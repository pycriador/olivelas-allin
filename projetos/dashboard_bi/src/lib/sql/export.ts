// Browser-only exporters. They only ever serialize the rows already returned to
// the client, so nothing outside the authorized result set can be exported.
import type { QueryColumn, QueryRow } from "./types";
import { rawText } from "./value-format";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown): string {
  const text = rawText(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function exportCsv(columns: QueryColumn[], rows: QueryRow[], filename: string) {
  const header = columns.map((c) => csvCell(c.name)).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(r[c.name])).join(",")).join("\n");
  download(new Blob([`\uFEFF${header}\n${body}`], { type: "text/csv;charset=utf-8" }), `${filename}.csv`);
}

export function exportJson(columns: QueryColumn[], rows: QueryRow[], filename: string) {
  const payload = rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const c of columns) out[c.name] = r[c.name] ?? null;
    return out;
  });
  download(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }),
    `${filename}.json`,
  );
}

export async function exportXlsx(columns: QueryColumn[], rows: QueryRow[], filename: string) {
  const XLSX = await import("xlsx");
  const data = rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const c of columns) {
      const v = r[c.name];
      out[c.name] = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : v;
    }
    return out;
  });
  const sheet = XLSX.utils.json_to_sheet(data, { header: columns.map((c) => c.name) });
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Resultado");
  const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  download(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${filename}.xlsx`,
  );
}