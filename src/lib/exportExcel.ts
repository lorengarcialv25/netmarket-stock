import * as XLSX from "xlsx";

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: unknown) => string | number;
}

/** Safe file base name for Windows/macOS (no path separators or wildcards). */
export function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?*[\]:]/g, "_").trim().slice(0, 180) || "export";
}

function sanitizeSheetName(name: string): string {
  const s = name.replace(/[/\\?*[\]:]/g, "_").trim().slice(0, 31);
  return s || "Hoja1";
}

function rowsFromData<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[]
): Record<string, string | number>[] {
  return data.map((item) =>
    Object.fromEntries(
      columns.map((col) => [
        col.label,
        col.format ? col.format(item[col.key]) : ((item[col.key] ?? "") as string | number),
      ])
    )
  );
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  fileName: string,
  sheetName = "Datos"
) {
  const rows = rowsFromData(data, columns);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheetName));
  XLSX.writeFile(wb, `${sanitizeFileName(fileName)}.xlsx`);
}

export interface ExportSheetSpec {
  /** Excel sheet name (max 31 chars, sanitized). */
  name: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
}

/**
 * Multi-sheet workbook (e.g. escandallos: resumen + detalle).
 * Skips empty sheets if skipEmpty is true (default false).
 */
export function exportWorkbook(
  sheets: ExportSheetSpec[],
  fileName: string,
  options?: { skipEmpty?: boolean }
) {
  const skipEmpty = options?.skipEmpty ?? false;
  const wb = XLSX.utils.book_new();
  let added = 0;
  for (const sheet of sheets) {
    if (skipEmpty && sheet.data.length === 0) continue;
    const rows = rowsFromData(sheet.data, sheet.columns);
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheet.name));
    added++;
  }
  if (added === 0) {
    const ws = XLSX.utils.json_to_sheet([{ Mensaje: "Sin datos" }]);
    XLSX.utils.book_append_sheet(wb, ws, "Vacío");
  }
  XLSX.writeFile(wb, `${sanitizeFileName(fileName)}.xlsx`);
}
