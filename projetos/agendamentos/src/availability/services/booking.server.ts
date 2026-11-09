/**
 * Booking assistant — server-only validation and creation logic.
 * Uses the Availability Engine as the single source of truth for conflicts.
 */
import { formatHm, overlaps, toLocalMinutes } from "../calculators/intervals";
import { freeWindows, professionalLimits } from "../engine/availability-engine";
import { invalidateCache, loadDataset } from "../repositories/availability.repository.server";
import type { AvailabilityQuery } from "../dto/types";

type Db = { from: (table: string) => any };

export interface BookingInput {
  date: string;
  professionalId: string;
  clientId: string | null;
  appointmentTypeId: string | null;
  startsAt: string;
  endsAt: string;
  title: string;
  description: string | null;
  modality: "online" | "in_person" | "any";
  allowOverbooking: boolean;
}

export interface BookingIssue {
  code: string;
  severity: "error" | "warning";
  detail?: string;
}

export interface BookingValidation {
  ok: boolean;
  issues: BookingIssue[];
  professionalName: string | null;
  startLabel: string;
  endLabel: string;
  workloadPercent: number;
}

export async function tenantOf(supabase: Db, userId: string): Promise<string> {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.tenant_id) throw new Error("Perfil sem clínica associada.");
  return data.tenant_id as string;
}

/** Re-runs every engine rule against a concrete slot before persisting it. */
export async function validateBooking(
  supabase: Db,
  tenantId: string,
  input: BookingInput,
): Promise<BookingValidation> {
  const issues: BookingIssue[] = [];
  const dataset = await loadDataset(supabase, tenantId, {
    date: input.date,
    clientId: input.clientId,
  });

  const pro = dataset.professionals.find((p) => p.id === input.professionalId);
  const start = toLocalMinutes(input.startsAt, input.date, dataset.timezone);
  const end = toLocalMinutes(input.endsAt, input.date, dataset.timezone);
  const slot = { start, end };

  if (end <= start) {
    issues.push({ code: "invalidRange", severity: "error" });
  }
  if (Date.parse(input.startsAt) < Date.now()) {
    issues.push({ code: "inPast", severity: "warning" });
  }
  if (!pro) {
    issues.push({ code: "professionalMissing", severity: "error" });
    return {
      ok: false,
      issues,
      professionalName: null,
      startLabel: formatHm(start),
      endLabel: formatHm(end),
      workloadPercent: 0,
    };
  }
  if (!pro.active) issues.push({ code: "professionalInactive", severity: "error" });
  if (input.modality === "online" && !pro.accepts_online) {
    issues.push({ code: "modalityUnsupported", severity: "error" });
  }
  if (input.modality === "in_person" && !pro.accepts_in_person) {
    issues.push({ code: "modalityUnsupported", severity: "error" });
  }
  if (
    input.appointmentTypeId &&
    pro.appointment_type_ids.length > 0 &&
    !pro.appointment_type_ids.includes(input.appointmentTypeId)
  ) {
    issues.push({ code: "appointmentTypeUnsupported", severity: "warning" });
  }

  const query: AvailabilityQuery = {
    date: input.date,
    durationMinutes: Math.max(5, end - start),
    professionalId: input.professionalId,
    clientId: input.clientId,
    modality: input.modality,
  };

  // Hard conflicts: anything the engine marks as busy for this professional.
  for (const busy of dataset.busyByProfessional[pro.id] ?? []) {
    if (!overlaps(slot, busy)) continue;
    issues.push({
      code: busy.kind === "google" ? "googleConflict" : `${busy.kind}Conflict`,
      severity: busy.kind === "lunch" ? "warning" : "error",
      detail: busy.label ?? `${formatHm(busy.start)}–${formatHm(busy.end)}`,
    });
  }

  // Outside working hours / clinic rules.
  const windows = freeWindows(pro.id, dataset, query);
  const fits = windows.some((w) => slot.start >= w.start && slot.end <= w.end);
  if (!fits && !issues.some((i) => i.code.endsWith("Conflict"))) {
    issues.push({ code: "outsideWorkingHours", severity: "error" });
  }

  const limits = professionalLimits(pro, dataset, query);
  if (limits.dailyExceeded) issues.push({ code: "dailyLimit", severity: "warning" });
  if (limits.weeklyExceeded) issues.push({ code: "weeklyLimit", severity: "warning" });
  if (limits.appointmentsExceeded) {
    issues.push({ code: "appointmentsLimit", severity: "warning" });
  }

  // Same client already booked at the same time with another professional.
  if (input.clientId) {
    for (const [proId, list] of Object.entries(dataset.busyByProfessional)) {
      if (proId === pro.id) continue;
      if (list.some((b) => b.clientId === input.clientId && overlaps(slot, b))) {
        issues.push({ code: "clientBusy", severity: "error" });
        break;
      }
    }
  }

  const blocking = issues.filter((i) => i.severity === "error");
  const ok =
    blocking.length === 0 ||
    (input.allowOverbooking && blocking.every((i) => i.code.endsWith("Conflict")));

  return {
    ok,
    issues,
    professionalName: pro.full_name,
    startLabel: formatHm(start),
    endLabel: formatHm(end),
    workloadPercent: limits.workloadPercent,
  };
}

/** Validates then persists the appointment in the tenant agenda. */
export async function createBooking(
  supabase: Db,
  tenantId: string,
  userId: string,
  input: BookingInput,
): Promise<{ eventId: string; validation: BookingValidation }> {
  const validation = await validateBooking(supabase, tenantId, input);
  if (!validation.ok) {
    const error = new Error("booking_conflict");
    (error as any).validation = validation;
    throw error;
  }

  const { data, error } = await (supabase as any)
    .from("events")
    .insert({
      tenant_id: tenantId,
      professional_id: input.professionalId,
      client_id: input.clientId,
      appointment_type_id: input.appointmentTypeId,
      title: input.title,
      description: input.description,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: "scheduled",
      source: "manual",
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw error;

  // Cache is a system-owned table (service role writes only).
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await invalidateCache(supabaseAdmin as never, tenantId, input.date);
  return { eventId: data.id as string, validation };
}
