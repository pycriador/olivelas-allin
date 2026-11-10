import * as XLSX from "xlsx";
import { STATIC_FIELDS, type FormDefinition, type FormField } from "@/types/forms";
import type { FormResponse } from "@/types/platform";

function inputFields(form: FormDefinition): FormField[] {
  return form.pages
    .flatMap((p) => p.fields ?? [])
    .filter((f) => !STATIC_FIELDS.includes(f.type));
}

function formatValue(field: FormField, value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) {
    return value
      .map((v) => field.options.find((o) => o.value === v)?.label ?? String(v))
      .join("; ");
  }
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return field.options.find((o) => o.value === value)?.label ?? String(value);
}

export function buildRows(form: FormDefinition, responses: FormResponse[]) {
  const fields = inputFields(form);
  return responses.map((r) => {
    const row: Record<string, string | number> = {
      ID: r.id,
      "Enviado em": new Date(r.submittedAt).toLocaleString(),
      Versão: r.formVersion,
      Status: r.status === "complete" ? "Completa" : "Parcial",
      "Duração (s)": r.durationMs ? Math.round(r.durationMs / 1000) : "",
    };
    for (const f of fields) {
      row[f.label || f.type] = formatValue(f, r.answers[f.id]);
    }
    return row;
  });
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(form: FormDefinition, responses: FormResponse[]) {
  const rows = buildRows(form, responses);
  const sheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ";" });
  download(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), `${form.slug}.csv`);
}

export function exportXlsx(form: FormDefinition, responses: FormResponse[]) {
  const rows = buildRows(form, responses);
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Respostas");
  const out = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  download(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${form.slug}.xlsx`,
  );
}

export function exportJson(form: FormDefinition, responses: FormResponse[]) {
  download(
    new Blob([JSON.stringify(responses, null, 2)], { type: "application/json" }),
    `${form.slug}.json`,
  );
}
