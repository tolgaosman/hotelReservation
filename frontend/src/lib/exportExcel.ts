import type ExcelJS from "exceljs";

interface ExcelColumn<T> {
  header: string;
  value: (row: T) => string;
  /** Column width in characters; omit to auto-fit to the widest cell in the column. */
  width?: number;
  /** Cell background + text color (ARGB) for this column, e.g. to mirror an on-site status color. */
  fill?: (row: T) => { bg: string; text: string } | undefined;
}

const HEADER_FILL = "FF1E3A8A"; // site accent (navy), ARGB
const BORDER_COLOR = "FF9CA3AF"; // visible mid-gray — Excel's "All Borders" grid, not the site's faint --line-strong

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: BORDER_COLOR } },
  left: { style: "thin", color: { argb: BORDER_COLOR } },
  bottom: { style: "thin", color: { argb: BORDER_COLOR } },
  right: { style: "thin", color: { argb: BORDER_COLOR } },
};

export async function exportToExcel<T>(filename: string, sheetName: string, columns: ExcelColumn<T>[], rows: T[]): Promise<void> {
  // exceljs is only needed for this one action — load it on demand instead
  // of shipping it in every table page's initial bundle.
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((c) => {
    if (c.width) return { width: c.width };
    // Auto-fit: widest cell (header or any row's rendered value) plus breathing room.
    const widest = rows.reduce((max, row) => Math.max(max, c.value(row).length), c.header.length);
    return { width: widest + 4 };
  });

  const headerRow = sheet.addRow(columns.map((c) => c.header));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = THIN_BORDER;
  });

  for (const row of rows) {
    const dataRow = sheet.addRow(columns.map((c) => c.value(row)));
    dataRow.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = THIN_BORDER;
      const colors = columns[colNumber - 1].fill?.(row);
      if (colors) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.bg } };
        cell.font = { bold: true, color: { argb: colors.text } };
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
