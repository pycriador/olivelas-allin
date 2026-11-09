import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AvailabilityQuery } from "../dto/types";

async function tenantOf(supabase: any, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.tenant_id) throw new Error("Perfil sem clínica associada.");
  return data.tenant_id as string;
}

function normalizeQuery(input: Partial<AvailabilityQuery> | undefined): AvailabilityQuery {
  const date = input?.date ?? new Date().toISOString().slice(0, 10);
  return {
    date,
    timeFrom: input?.timeFrom ?? null,
    timeTo: input?.timeTo ?? null,
    durationMinutes: Number(input?.durationMinutes) || 50,
    specialty: input?.specialty ?? null,
    appointmentTypeId: input?.appointmentTypeId ?? null,
    modality: input?.modality ?? "any",
    professionalId: input?.professionalId ?? null,
    scheduleGroupId: input?.scheduleGroupId ?? null,
    clientId: input?.clientId ?? null,
    urgent: Boolean(input?.urgent),
    preferredPeriod: input?.preferredPeriod ?? null,
    limit: Number(input?.limit) || 40,
  };
}

/** Smart search: best professionals and time windows for the given criteria. */
export const searchAvailabilityFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<AvailabilityQuery>) => normalizeQuery(input))
  .handler(async ({ data, context }) => {
    const t0 = Date.now();
    const { loadDataset, writeCache } = await import(
      "../repositories/availability.repository.server"
    );
    const { searchAvailability } = await import("../engine/availability-engine");

    const tenantId = await tenantOf(context.supabase, context.userId);
    const dataset = await loadDataset(context.supabase, tenantId, {
      date: data.date,
      clientId: data.clientId ?? null,
    });
    const suggestions = searchAvailability(dataset, data);

    // Derived/system tables are service-role only; tenant users cannot write them.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await writeCache(
      supabaseAdmin as never,
      tenantId,
      data.date,
      suggestions.map((s) => ({
        professional_id: s.professionalId,
        slot_time: `${s.startLabel}:00`,
        duration_minutes: data.durationMinutes,
        available: true,
        reason: null,
      })),
    );

    await supabaseAdmin.from("availability_audit_logs").insert({
      tenant_id: tenantId,
      user_id: context.userId,
      criteria: JSON.parse(JSON.stringify(data)),
      result_count: suggestions.length,
      duration_ms: Date.now() - t0,
    });

    return { suggestions, durationMs: Date.now() - t0 };
  });

/** Timeline + workload view for one date. */
export const getTimelineFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { date?: string }) => ({
    date: input?.date ?? new Date().toISOString().slice(0, 10),
  }))
  .handler(async ({ data, context }) => {
    const { loadDataset, writeWorkload } = await import(
      "../repositories/availability.repository.server"
    );
    const { buildTimelines } = await import("../engine/availability-engine");

    const tenantId = await tenantOf(context.supabase, context.userId);
    const dataset = await loadDataset(context.supabase, tenantId, { date: data.date });
    const timelines = buildTimelines(dataset, data.date);

    // Workload aggregates are system-written (service role only).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await writeWorkload(
      supabaseAdmin as never,
      tenantId,
      data.date,
      timelines.map((t) => ({
        professional_id: t.professionalId,
        worked_minutes: t.busyMinutes,
        free_minutes: t.freeMinutes,
        appointments: t.appointments,
        occupancy_percent: t.workloadPercent,
        overbookings: 0,
      })),
    );

    return { timelines, date: data.date };
  });

/** Occupancy heatmap over a range of days. */
export const getHeatmapFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { from?: string; days?: number }) => ({
    from: input?.from ?? new Date().toISOString().slice(0, 10),
    days: Math.min(42, Math.max(1, Number(input?.days) || 14)),
  }))
  .handler(async ({ data, context }) => {
    const { loadDataset } = await import("../repositories/availability.repository.server");
    const { buildTimelines } = await import("../engine/availability-engine");

    const tenantId = await tenantOf(context.supabase, context.userId);
    const cells: Array<{ date: string; occupancyPercent: number; appointments: number }> = [];

    for (let i = 0; i < data.days; i += 1) {
      const date = new Date(Date.parse(`${data.from}T00:00:00Z`) + i * 86400000)
        .toISOString()
        .slice(0, 10);
      const dataset = await loadDataset(context.supabase, tenantId, { date });
      const timelines = buildTimelines(dataset, date);
      const avg =
        timelines.length > 0
          ? Math.round(
              timelines.reduce((s, t) => s + t.workloadPercent, 0) / timelines.length,
            )
          : 0;
      cells.push({
        date,
        occupancyPercent: avg,
        appointments: timelines.reduce((s, t) => s + t.appointments, 0),
      });
    }

    return { cells };
  });

/** Dashboard indicators derived from the engine. */
export const getAvailabilityStatsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadDataset } = await import("../repositories/availability.repository.server");
    const { buildTimelines, searchAvailability } = await import(
      "../engine/availability-engine"
    );

    const tenantId = await tenantOf(context.supabase, context.userId);
    const date = new Date().toISOString().slice(0, 10);
    const dataset = await loadDataset(context.supabase, tenantId, { date });
    const timelines = buildTimelines(dataset, date);
    const suggestions = searchAvailability(dataset, normalizeQuery({ date, limit: 5 }));

    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const freeNow = timelines.filter((t) =>
      t.segments.some(
        (s) => s.state === "available" && s.start <= nowMinutes && s.end > nowMinutes,
      ),
    ).length;

    return {
      freeNow,
      averageOccupancy:
        timelines.length > 0
          ? Math.round(timelines.reduce((s, t) => s + t.workloadPercent, 0) / timelines.length)
          : 0,
      averageFreeMinutes:
        timelines.length > 0
          ? Math.round(timelines.reduce((s, t) => s + t.freeMinutes, 0) / timelines.length)
          : 0,
      overloaded: timelines.filter((t) => t.workloadPercent >= 85).length,
      nextSlots: suggestions.slice(0, 5),
    };
  });
