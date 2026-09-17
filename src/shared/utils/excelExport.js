import * as XLSX from 'xlsx';

/**
 * Exports data rows to an Excel (.xlsx) file and initiates browser download.
 *
 * @param {Object} options
 * @param {string} options.filename - Desired filename without or with .xlsx extension
 * @param {string} [options.sheetName='Данные'] - Name of the worksheet tab
 * @param {Array<Object>} options.data - Array of row objects. Keys will become column headers.
 */
export function exportToExcel({ filename, sheetName = 'Данные', data = [] }) {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('exportToExcel: No data to export');
    alert('Нет данных для экспорта в Excel');
    return;
  }

  // 1. Convert JSON array to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 2. Auto-calculate column widths based on headers and cell contents
  const colWidths = [];
  const headers = Object.keys(data[0] || {});

  headers.forEach((header, colIdx) => {
    let maxLen = header.toString().length;

    // Sample up to 100 rows to determine column width
    for (let r = 0; r < Math.min(data.length, 100); r++) {
      const val = data[r][header];
      if (val !== null && val !== undefined) {
        const valStr = String(val);
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      }
    }

    // Give some padding, min 10 chars, max 60 chars
    colWidths[colIdx] = { wch: Math.min(Math.max(maxLen + 3, 10), 60) };
  });

  worksheet['!cols'] = colWidths;

  // 3. Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31)); // Excel limit 31 chars

  // 4. Ensure .xlsx extension
  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  // 5. Trigger download
  XLSX.writeFile(workbook, safeFilename);
}
