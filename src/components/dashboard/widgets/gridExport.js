const xml = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

export function gridFile(rows, format) {
  if (format === 'csv') {
    const cell = value => {
      const safe = typeof value === 'string' && /^\s*[=+@-]/.test(value) ? "'" + value : String(value ?? '')
      return '"' + safe.replaceAll('"', '""') + '"'
    }
    return new Blob(['\uFEFF', rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  }
  const cells = row => row.map(value => '<Cell><Data ss:Type="' + (typeof value === 'number' ? 'Number' : 'String') + '">' + xml(value) + '</Data></Cell>').join('')
  const sheet = rows.map(row => '<Row>' + cells(row) + '</Row>').join('')
  return new Blob(['<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Grid"><Table>', sheet, '</Table></Worksheet></Workbook>'], { type: 'application/xml;charset=utf-8' })
}
