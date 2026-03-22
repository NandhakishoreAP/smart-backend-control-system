// Utility to export array of objects to CSV and trigger download
export default function exportToCsv(filename, rows) {
  if (!rows || !rows.length) return
  const separator = ','
  const keys = Object.keys(rows[0])
  const csvContent = [
    keys.join(separator),
    ...rows.map(row => keys.map(k => '"' + (row[k] ?? '') + '"').join(separator))
  ].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
