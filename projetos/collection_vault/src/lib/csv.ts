import Papa from "papaparse";
import type { FieldDef } from "@/components/crud/types";

export function downloadCsv(filename: string, rows: Record<string, unknown>[], headers: string[]) {
  const csv = Papa.unparse({ fields: headers, data: rows.map((r) => headers.map((h) => r[h] ?? "")) });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function downloadTemplate(filename: string, fields: FieldDef[]) {
  const headers = fields.map((f) => f.name);
  downloadCsv(filename, [], headers);
}

export function downloadData(filename: string, fields: FieldDef[], rows: Record<string, unknown>[]) {
  const headers = fields.map((f) => f.name);
  downloadCsv(filename, rows, headers);
}

export function parseCsv(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => resolve(res.data),
      error: (err) => reject(err),
    });
  });
}

export function coerceRow(raw: Record<string, string>, fields: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = raw[f.name];
    if (v === undefined || v === "") { out[f.name] = null; continue; }
    if (f.type === "number") out[f.name] = Number(v);
    else if (f.type === "boolean") out[f.name] = v === "true" || v === "1" || v === "sim";
    else out[f.name] = v;
  }
  if (raw.id) out.id = raw.id;
  return out;
}
