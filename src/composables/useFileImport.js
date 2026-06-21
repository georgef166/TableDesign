// Shared file-import pipeline. Reads a CSV or XLS/XLSX file into a grid (array of
// rows), then maps columns to canonical locate fields BY HEADER NAME in any order
// and validates each row. Used by the bulk uploader (FileUploadModal) and the
// Schedule List modal's "add securities from file" path.
import { findSecurity } from '../data/securities.js'

// Canonical fields → header aliases. Matching is on a normalised header
// (lowercased, non-alphanumerics stripped), so "Qty Requested", "qty_requested"
// and "QTYREQUESTED" all resolve to the same field.
export const FIELD_ALIASES = {
  ticker:       ['ticker', 'symbol', 'tkr'],
  security:     ['security', 'securityname', 'name', 'description', 'desc'],
  sedol:        ['sedol'],
  isin:         ['isin'],
  cusip:        ['cusip'],
  qtyRequested: ['qtyrequested', 'qty', 'quantity', 'shares', 'qtyreq'],
  marketValue:  ['marketvalue', 'mktvalue', 'notional', 'mv']
}

export const FIELD_LABELS = {
  ticker: 'Ticker', security: 'Security', sedol: 'SEDOL', isin: 'ISIN',
  cusip: 'CUSIP', qtyRequested: 'Qty Requested', marketValue: 'Market Value'
}

const norm = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '')

function resolveField(header) {
  const h = norm(header)
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(h)) return field
  }
  return null
}

// Minimal RFC-4180-ish CSV parser (handles quoted fields + embedded commas).
// Returns a grid: array of string-cell arrays (header row included).
export function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') inQuotes = false
      else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some(v => v.trim() !== '')) rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); if (row.some(v => v.trim() !== '')) rows.push(row) }
  return rows
}

// Read any supported file into a grid. XLS/XLSX support is loaded lazily so CSV
// uploads (and the rest of the app) never pay for the SheetJS chunk.
export async function readFileToGrid(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (ext === 'xls' || ext === 'xlsx') {
    const XLSX = await import('xlsx')
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    // header:1 → array-of-arrays, matching parseCsv's shape. raw:false keeps
    // values as strings so downstream Number() coercion behaves the same.
    return XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, raw: false, defval: '' })
      .map(r => r.map(c => (c == null ? '' : String(c))))
  }
  return parseCsv(await file.text())
}

function validateRow(rec, idx) {
  const errors = []
  // Enrich missing fields from the security master where possible.
  const match = findSecurity(rec)
  if (match) {
    rec.ticker = rec.ticker || match.ticker
    rec.security = rec.security || match.name
    rec.isin = rec.isin || match.isin
    rec.sedol = rec.sedol || match.sedol
    rec.cusip = rec.cusip || match.cusip
  }
  if (!rec.ticker && !rec.isin && !rec.sedol && !rec.cusip) errors.push('No identifier')
  const qty = Number(rec.qtyRequested)
  const mv = Number(rec.marketValue)
  if (!(qty > 0) && !(mv > 0)) errors.push('Missing qty / market value')
  return {
    line: idx + 2, // 1-based incl. header row
    ticker: rec.ticker || '',
    security: rec.security || (match ? match.name : ''),
    isin: rec.isin || '', sedol: rec.sedol || '', cusip: rec.cusip || '',
    qtyRequested: qty > 0 ? qty : null,
    marketValue: mv > 0 ? mv : null,
    locateBy: qty > 0 ? 'SHARES' : (mv > 0 ? 'MARKET_VALUE' : 'SHARES'),
    bbgTicker: match?.bbgTicker || (rec.ticker ? `${rec.ticker} US` : ''),
    ric: match?.ric || '',
    errors
  }
}

// Map a grid → { headers, mapping, rows }. `error` is set (and the rest empty)
// when the file is unusable, so callers can surface a single message.
export function gridToRecords(grid) {
  if (!grid || grid.length < 2) {
    return { error: 'File has no data rows.', headers: [], mapping: [], rows: [] }
  }
  const headers = grid[0].map(h => (h || '').toString().trim())
  const mapping = headers.map(h => ({ header: h, field: resolveField(h) }))
  const hasId = mapping.some(m => ['ticker', 'isin', 'sedol', 'cusip'].includes(m.field))
  if (!hasId) {
    return {
      error: 'No identifier column found. Include at least one of: Ticker, ISIN, SEDOL, CUSIP.',
      headers, mapping, rows: []
    }
  }
  const rows = grid.slice(1).map((cells, idx) => {
    const rec = {}
    mapping.forEach((m, c) => { if (m.field) rec[m.field] = (cells[c] ?? '').toString().trim() })
    return validateRow(rec, idx)
  })
  return { error: '', headers, mapping, rows }
}
