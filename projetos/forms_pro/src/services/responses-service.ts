import { supabase } from "@/integrations/supabase/client";
import { STATIC_FIELDS, type FormDefinition, type FormPage } from "@/types/forms";
import type { FieldAnalytics, FormAnalytics, FormResponse } from "@/types/platform";

function fail(message?: string): never {
  throw new Error(message ?? "Erro inesperado");
}

function mapResponse(r: Record<string, unknown>): FormResponse {
  return {
    id: r["id"] as string,
    formId: r["form_id"] as string,
    formVersion: r["form_version"] as number,
    schemaSnapshot: (r["schema_snapshot"] as FormPage[]) ?? [],
    answers: (r["answers"] as Record<string, unknown>) ?? {},
    respondentId: (r["respondent_id"] as string | null) ?? null,
    status: r["status"] as FormResponse["status"],
    startedAt: (r["started_at"] as string | null) ?? null,
    completedAt: (r["completed_at"] as string | null) ?? null,
    durationMs: (r["duration_ms"] as number | null) ?? null,
    metadata: (r["metadata"] as Record<string, unknown>) ?? {},
    submittedAt: r["submitted_at"] as string,
  };
}

export interface SubmitInput {
  form: FormDefinition;
  answers: Record<string, unknown>;
  startedAt: string;
}

export const responsesApi = {
  async submit({ form, answers, startedAt }: SubmitInput): Promise<void> {
    const completedAt = new Date().toISOString();
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("form_responses").insert({
      form_id: form.id,
      form_version: form.version,
      schema_snapshot: form.pages as never,
      answers: answers as never,
      respondent_id: auth.user?.id ?? null,
      status: "complete",
      started_at: startedAt,
      completed_at: completedAt,
      duration_ms: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      metadata: {
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        language: typeof navigator !== "undefined" ? navigator.language : "",
      } as never,
    });
    if (error) fail(error.message);
  },

  async list(formId: string): Promise<FormResponse[]> {
    const { data, error } = await supabase
      .from("form_responses")
      .select("*")
      .eq("form_id", formId)
      .order("submitted_at", { ascending: false });
    if (error) fail(error.message);
    return (data ?? []).map((r) => mapResponse(r as Record<string, unknown>));
  },

  async get(id: string): Promise<FormResponse> {
    const { data, error } = await supabase
      .from("form_responses")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) fail(error.message);
    if (!data) fail("Resposta não encontrada");
    return mapResponse(data as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("form_responses").delete().eq("id", id);
    if (error) fail(error.message);
  },

  async countByForm(): Promise<Record<string, number>> {
    const { data } = await supabase.from("form_responses").select("form_id");
    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { form_id: string }[]) {
      counts[row.form_id] = (counts[row.form_id] ?? 0) + 1;
    }
    return counts;
  },
};

/** Builds per-field analytics from stored responses using each response's own schema snapshot. */
export function buildAnalytics(
  form: FormDefinition,
  responses: FormResponse[],
): FormAnalytics {
  const fields = form.pages
    .flatMap((p) => p.fields ?? [])
    .filter((f) => !STATIC_FIELDS.includes(f.type));

  const fieldStats: FieldAnalytics[] = fields.map((field) => {
    const values = responses
      .map((r) => r.answers[field.id])
      .filter((v) => v !== undefined && v !== null && v !== "");

    const distribution: { label: string; count: number }[] = [];
    let average: number | null = null;
    const samples: string[] = [];

    if (field.options.length) {
      const counts = new Map<string, number>();
      for (const v of values) {
        const list = Array.isArray(v) ? v : [v];
        for (const item of list) {
          const key = String(item);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
      for (const opt of field.options) {
        distribution.push({
          label: opt.label,
          count: counts.get(opt.value) ?? counts.get(opt.label) ?? 0,
        });
      }
    } else if (["number", "scale", "rating"].includes(field.type)) {
      const nums = values.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
      if (nums.length) average = nums.reduce((a, b) => a + b, 0) / nums.length;
      const counts = new Map<number, number>();
      for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
      for (const [k, v] of [...counts.entries()].sort((a, b) => a[0] - b[0])) {
        distribution.push({ label: String(k), count: v });
      }
    } else if (field.type === "checkbox") {
      const yes = values.filter((v) => v === true || v === "true").length;
      distribution.push({ label: "Sim", count: yes }, { label: "Não", count: values.length - yes });
    } else {
      samples.push(...values.slice(0, 8).map((v) => String(v)));
    }

    return {
      fieldId: field.id,
      label: field.label || field.type,
      type: field.type,
      answered: values.length,
      distribution,
      average,
      samples,
    };
  });

  const durations = responses
    .map((r) => r.durationMs)
    .filter((d): d is number => typeof d === "number" && d > 0);

  const perDayMap = new Map<string, number>();
  for (const r of responses) {
    const day = r.submittedAt.slice(0, 10);
    perDayMap.set(day, (perDayMap.get(day) ?? 0) + 1);
  }

  const completed = responses.filter((r) => r.status === "complete").length;

  return {
    total: responses.length,
    completed,
    partial: responses.length - completed,
    completionRate: responses.length ? Math.round((completed / responses.length) * 100) : 0,
    avgDurationMs: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null,
    perDay: [...perDayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count })),
    fields: fieldStats,
  };
}
