// Tiny CSV export helper. The app had no export path before (only an import
// parser in FileUploadModal); the Availability download reuses this, and future
// exports (e.g. Locate History) can too.

// columns: [{ key, header }]. Values are RFC-4180 quoted when they contain a
// comma, quote or newline; embedded quotes are doubled. Cells beginning with a
// formula trigger (= + - @, tab or CR) are prefixed with a single quote so a
// spreadsheet treats them as text — defends against CSV/formula injection when
// the exported data later comes from an untrusted live feed.
export function toCsv(rows, columns) {
  const esc = (v) => {
    let s = v == null ? '' : String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const head = columns.map(c => esc(c.header)).join(',')
  const body = rows.map(r => columns.map(c => esc(r[c.key])).join(',')).join('\r\n')
  return body ? `${head}\r\n${body}` : head
}

// Trigger a browser download of `text` as a file.
export function downloadBlob(filename, text, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadCsv(filename, rows, columns) {
  downloadBlob(filename, toCsv(rows, columns))
}
