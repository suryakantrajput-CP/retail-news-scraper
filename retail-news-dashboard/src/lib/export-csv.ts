import Papa from "papaparse";

export function exportRowsToCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename: string
) {
  if (rows.length === 0) return;

  const csv = Papa.unparse(rows);
  // Prefix a UTF-8 BOM so Excel detects encoding correctly instead of mangling
  // special characters (accents, curly quotes) pulled from scraped article text.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
