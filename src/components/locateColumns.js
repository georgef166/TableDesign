// Shared AG Grid column definitions for the locate grids (Locate Requests + Locate
// History). Both views render the identical column set — a compact, flex-sized SCAN
// set shown by default plus demoted REFERENCE identifiers hidden behind the column
// chooser — so the definitions live here once. `makeLocateColumns()` returns a
// FRESH array each call: AG Grid may mutate colDefs internally, so the two grids
// must not share object references.
import { markRaw } from 'vue'
import StatusBadge from './StatusBadge.vue'

// Comma-group quantities (e.g. 5000 → "5,000"); blank for null/empty.
const fmtQty = (p) => (p.value || p.value === 0) ? p.value.toLocaleString() : ''
const mono = { cellClass: 'mono-cell' }

// Pending / Rejected quantities are derived from the row's status: a PENDING row's
// requested qty is its pending amount, a REJECTED row's is its rejected amount
// (0 otherwise). Exported so the History CSV export can reuse the same derivation.
export const qtyPendingOf = (r) => r?.status === 'PENDING' ? (r.qtyRequested || 0) : 0
export const qtyRejectedOf = (r) => r?.status === 'REJECTED' ? (r.qtyRequested || 0) : 0

export function makeLocateColumns() {
  return [
    // --- Scan set (visible by default) ---
    { headerName: 'Request Date', field: 'requestDate', flex: 1.1, minWidth: 150 },
    { headerName: 'Status', field: 'status', flex: 0.9, minWidth: 130,
      cellRenderer: markRaw(StatusBadge),
      cellRendererParams: (p) => ({ params: p }),
      cellClassRules: {
        'status-ok': p => p.value === 'APPROVED',
        'status-warn': p => p.value === 'PENDING',
        'status-bad': p => p.value === 'REJECTED'
      } },
    // Ticker and Security are discrete columns; Security carries the identifier
    // quick-filter so search still spans every identifier.
    { headerName: 'Ticker', field: 'ticker', flex: 0.8, minWidth: 100, cellClass: 'strong-cell' },
    { headerName: 'Security', field: 'security', flex: 1.6, minWidth: 200,
      getQuickFilterText: (p) =>
        [p.data.ticker, p.data.bbgTicker, p.data.security, p.data.sedol, p.data.isin, p.data.cusip, p.data.ric].join(' ') },
    // Numbers AND their headers right-aligned (type:'rightAligned'); comma-grouped.
    { headerName: 'Qty Req', field: 'qtyRequested', type: 'rightAligned', flex: 0.7, minWidth: 100,
      cellClass: 'mono-cell num-cell', valueFormatter: fmtQty },
    { headerName: 'Qty Appr', field: 'qtyApproved', type: 'rightAligned', flex: 0.7, minWidth: 100,
      valueFormatter: fmtQty,
      cellClass: (p) => p.value > 0 ? 'mono-cell num-cell appr-pos' : 'mono-cell num-cell appr-zero' },
    // Qty Pending — visible by default, to the right of Qty Approved.
    { headerName: 'Qty Pend', field: 'qtyPending', type: 'rightAligned', flex: 0.7, minWidth: 100,
      valueGetter: (p) => qtyPendingOf(p.data),
      valueFormatter: fmtQty,
      cellClass: (p) => p.value > 0 ? 'mono-cell num-cell pend-pos' : 'mono-cell num-cell appr-zero' },
    // Qty Rejected — hidden by default; toggled on via the column chooser.
    { headerName: 'Qty Rej', field: 'qtyRejected', type: 'rightAligned', minWidth: 100, hide: true,
      valueGetter: (p) => qtyRejectedOf(p.data),
      valueFormatter: fmtQty,
      cellClass: (p) => p.value > 0 ? 'mono-cell num-cell rej-pos' : 'mono-cell num-cell appr-zero' },

    // --- Reference set (hidden by default; toggled via the column chooser) ---
    { headerName: 'BBG Ticker', field: 'bbgTicker', minWidth: 120, hide: true },
    { headerName: 'Batch ID', field: 'batchId', minWidth: 110, hide: true, ...mono },
    { headerName: 'Locate ID', field: 'locateId', minWidth: 120, hide: true, ...mono },
    { headerName: 'SEDOL', field: 'sedol', minWidth: 110, hide: true, ...mono },
    { headerName: 'ISIN', field: 'isin', minWidth: 140, hide: true, ...mono },
    { headerName: 'RIC', field: 'ric', minWidth: 110, hide: true, ...mono },
    { headerName: 'CUSIP', field: 'cusip', minWidth: 120, hide: true, ...mono }
  ]
}

// The reference identifiers a user can toggle back on via the column chooser.
// Returns a fresh array so each view owns its own visibility state.
export function makeToggleableCols() {
  return [
    { field: 'qtyRejected', label: 'Qty Rejected', visible: false },
    { field: 'bbgTicker', label: 'BBG Ticker', visible: false },
    { field: 'batchId', label: 'Batch ID', visible: false },
    { field: 'locateId', label: 'Locate ID', visible: false },
    { field: 'sedol', label: 'SEDOL', visible: false },
    { field: 'isin', label: 'ISIN', visible: false },
    { field: 'ric', label: 'RIC', visible: false },
    { field: 'cusip', label: 'CUSIP', visible: false }
  ]
}

export const defaultColDef = { sortable: true, resizable: true, filter: true }
