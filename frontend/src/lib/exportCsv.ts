interface CsvColumn<T> {
  header: string;
  value: (row: T) => string;
}

function escapeCsvField(field: string): string {
  return `"${field.replace(/"/g, '""')}"`;
}

/**
 * Excel needs a UTF-8 BOM to render Turkish characters (İ, ı, ş, ğ, ö, ü)
 * correctly instead of mojibake — plain UTF-8 without it is misread as the
 * system codepage on Windows.
 */
const UTF8_BOM = "﻿";

export function exportToCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  const lines = [
    columns.map((c) => escapeCsvField(c.header)).join(","),
    ...rows.map((row) => columns.map((c) => escapeCsvField(c.value(row))).join(",")),
  ];

  const blob = new Blob([UTF8_BOM + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
