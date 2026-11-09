/**
 * Appointment Management — server-only business logic.
 * Availability is delegated to the Availability Engine; this module owns the
 * appointment life cycle, Google sync bridging and auditing.
 */
import { validateBooking, tenantOf } from "@/availability/services/booking.server";
import { invalidateCache } from "@/availability/repositories/availability.repository.server";

import {
  APPOINTMENT_SELECT,
  audit,
  flatten,
  getAppointment,
  getHistory,
  releaseExpiredReservations,
} from "../repositories/appointments.repository.server";
import { RESERVATION_MINUTES } from "../constants";
import { assertTransition } from "../workflows/appointment-state-machine";
import { NotificationService } from "./notification.service.server";
import {
  deleteGoogleEvent,
  patchGoogleEvent,
  pushAppointmentToGoogle,
} from "./appointment-google.server";
import type {
  CancelInput,
  ConfirmInput,
  ListInput,
  NoShowInput,
  ReserveInput,
  RescheduleInput,
  TransitionInput,
  WaitingListInput,
} from "../validators";

type Db = { from: (table: string) => any };

export { tenantOf };

function minutesBetween(startAt: string, endAt: string): number {
  return Math.max(1, Math.round((Date.parse(endAt) - Date.parse(startAt)) / 60000));
}

function mapDbError(err: unknown): Error {
  const message = (err as { message?: string })?.message ?? "";
  if (message.includes("slot_taken") || message.includes("appointments_no_double_booking")) {
    return new Error("slot_taken");
  }
  if (message.includes("invalid_status_transition")) return new Error("invalid_transition");
  if (message.includes("row-level security")) return new Error("forbidden");
  return err instanceof Error ? err : new Error("unexpected_error");
}

async function tenantTimezone(supabase: Db, tenantId: string): Promise<string> {
  const { data } = await supabase.from("tenants").select("timezone").eq("id", tenantId).maybeSingle();
  return (data?.timezone as string) ?? "America/Sao_Paulo";
}

/* ------------------------------------------------------------------ */
/* Reservation                                                         */
/* ------------------------------------------------------------------ */

/**
 * Creates a temporary hold. The Availability Engine validates the slot and the
 * database trigger guarantees no concurrent booking wins the same window.
 */
export async function reserveSlot(
  supabase: Db,
  tenantId: string,
  userId: string,
  input: ReserveInput,
) {
  await releaseExpiredReservations(tenantId);

  const validation = await validateBooking(supabase, tenantId, {
    date: input.date,
    professionalId: input.professionalId,
    clientId: input.clientId ?? null,
    appointmentTypeId: input.serviceTypeId ?? null,
    startsAt: input.startAt,
    endsAt: input.endAt,
    title: input.title ?? "Atendimento",
    description: input.notes ?? null,
    modality: input.modality === "online" ? "online" : input.modality === "in_person" ? "in_person" : "any",
    allowOverbooking: input.bookingType === "fit_in" && input.allowRuleViolation,
  });

  const blocking = validation.issues.filter((i) => i.severity === "error");
  if (blocking.length > 0 && !(input.bookingType === "fit_in" && input.allowRuleViolation)) {
    const err = new Error("rule_violation");
    (err as never as { issues: unknown }).issues = validation.issues;
    throw err;
  }

  const timezone = await tenantTimezone(supabase, tenantId);
  const reservedUntil = new Date(Date.now() + RESERVATION_MINUTES * 60_000).toISOString();

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      tenant_id: tenantId,
      client_id: input.clientId ?? null,
      professional_id: input.professionalId,
      service_type_id: input.serviceTypeId ?? null,
      location_id: input.locationId ?? null,
      title: input.title?.trim() || "Atendimento",
      start_at: input.startAt,
      end_at: input.endAt,
      duration_minutes: minutesBetween(input.startAt, input.endAt),
      timezone,
      status: "reserved",
      source: "manual",
      booking_type: input.bookingType,
      modality: input.modality,
      notes: input.notes ?? null,
      reserved_until: reservedUntil,
      reserved_by: userId,
      created_by: userId,
      updated_by: userId,
    })
    .select("id, reserved_until")
    .single();

  if (error) throw mapDbError(error);

  await audit({
    tenantId,
    appointmentId: data.id,
    action: "reserved",
    userId,
    next: { start_at: input.startAt, end_at: input.endAt, booking_type: input.bookingType },
  });

  return {
    appointmentId: data.id as string,
    reservedUntil: data.reserved_until as string,
    warnings: validation.issues.filter((i) => i.severity === "warning").map((i) => i.code),
    ruleViolations: blocking.map((i) => i.code),
    professionalName: validation.professionalName,
  };
}

/** Drops a hold the user abandoned. */
export async function releaseReservation(supabase: Db, tenantId: string, userId: string, id: string) {
  const current = await getAppointment(supabase, id);
  if (current.status !== "reserved") return { released: false };
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw mapDbError(error);
  await audit({ tenantId, appointmentId: null, action: "reservation_released", userId, previous: current });
  return { released: true };
}

/* ------------------------------------------------------------------ */
/* Confirmation                                                        */
/* ------------------------------------------------------------------ */

async function upsertInternalEvent(
  supabase: Db,
  tenantId: string,
  userId: string,
  appointment: any,
) {
  const payload = {
    tenant_id: tenantId,
    professional_id: appointment.professional_id,
    client_id: appointment.client_id,
    appointment_type_id: appointment.service_type_id,
    title: appointment.title,
    description: appointment.notes,
    starts_at: appointment.start_at,
    ends_at: appointment.end_at,
    status: "scheduled" as const,
    source: "manual" as const,
    created_by: userId,
  };
  if (appointment.event_id) {
    await supabase.from("events").update(payload).eq("id", appointment.event_id);
    return appointment.event_id as string;
  }
  const { data, error } = await supabase.from("events").insert(payload).select("id").single();
  if (error) throw mapDbError(error);
  return data.id as string;
}

/** Confirms a hold, materialises the agenda event and syncs Google. */
export async function confirmAppointment(
  supabase: Db,
  tenantId: string,
  userId: string,
  input: ConfirmInput,
) {
  const current = await getAppointment(supabase, input.appointmentId);
  assertTransition(current.status, "confirmed");

  if (current.status === "reserved" && current.reserved_until && Date.parse(current.reserved_until) < Date.now()) {
    throw new Error("reservation_expired");
  }

  const eventId = await upsertInternalEvent(supabase, tenantId, userId, current);

  const wantsMeet = input.createMeet && current.modality !== "in_person";
  const sync = await pushAppointmentToGoogle(supabase, tenantId, current.professional_id, {
    title: current.title,
    description: input.notes ?? current.notes,
    startAt: current.start_at,
    endAt: current.end_at,
    timezone: current.timezone,
    createMeet: wantsMeet,
  });

  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "confirmed",
      reserved_until: null,
      event_id: eventId,
      notes: input.notes ?? current.notes,
      google_event_id: sync.googleEventId ?? current.google_event_id,
      calendar_id: sync.calendarRowId ?? current.calendar_id,
      meet_url: sync.meetUrl ?? current.meet_url,
      meet_id: sync.meetId ?? current.meet_id,
      sync_status: sync.status,
      sync_error: sync.message ?? null,
      updated_by: userId,
    })
    .eq("id", input.appointmentId)
    .select("id, status, sync_status")
    .single();
  if (error) throw mapDbError(error);

  await invalidateCache(supabase, tenantId, current.start_at.slice(0, 10));
  await audit({ tenantId, appointmentId: current.id, action: "confirmed", userId, previous: current, next: data });
  await NotificationService.enqueue({
    tenantId,
    appointmentId: current.id,
    clientId: current.client_id,
    professionalId: current.professional_id,
    type: "appointment_confirmed",
    scheduledAt: current.start_at,
  });

  return {
    appointmentId: data.id as string,
    status: data.status,
    syncStatus: data.sync_status,
    syncMessage: sync.message ?? null,
  };
}

/** Retries a failed/pending Google sync. */
export async function retrySync(supabase: Db, tenantId: string, userId: string, id: string) {
  const current = await getAppointment(supabase, id);
  const sync = await pushAppointmentToGoogle(supabase, tenantId, current.professional_id, {
    title: current.title,
    description: current.notes,
    startAt: current.start_at,
    endAt: current.end_at,
    timezone: current.timezone,
    createMeet: current.modality !== "in_person",
  });
  const { error } = await supabase
    .from("appointments")
    .update({
      google_event_id: sync.googleEventId ?? current.google_event_id,
      calendar_id: sync.calendarRowId ?? current.calendar_id,
      meet_url: sync.meetUrl ?? current.meet_url,
      meet_id: sync.meetId ?? current.meet_id,
      sync_status: sync.status,
      sync_error: sync.message ?? null,
      updated_by: userId,
    })
    .eq("id", id);
  if (error) throw mapDbError(error);
  await audit({ tenantId, appointmentId: id, action: "sync_retried", userId, next: sync });
  return { appointmentId: id, syncStatus: sync.status, syncMessage: sync.message ?? null };
}

/* ------------------------------------------------------------------ */
/* Life-cycle transitions                                              */
/* ------------------------------------------------------------------ */

export async function transitionAppointment(
  supabase: Db,
  tenantId: string,
  userId: string,
  input: TransitionInput,
) {
  if (input.action === "release") {
    return releaseReservation(supabase, tenantId, userId, input.appointmentId);
  }
  const current = await getAppointment(supabase, input.appointmentId);
  const next = input.action === "start" ? "in_progress" : "completed";
  assertTransition(current.status, next);

  const patch: Record<string, unknown> = { status: next, updated_by: userId };
  if (next === "in_progress") patch["started_at"] = new Date().toISOString();
  if (next === "completed") patch["completed_at"] = new Date().toISOString();

  const { error } = await supabase.from("appointments").update(patch).eq("id", input.appointmentId);
  if (error) throw mapDbError(error);

  if (next === "completed" && current.event_id) {
    await supabase.from("events").update({ status: "completed" }).eq("id", current.event_id);
  }

  await audit({ tenantId, appointmentId: current.id, action: next, userId, previous: current, next: patch });
  return { appointmentId: current.id as string, status: next };
}

export async function cancelAppointment(
  supabase: Db,
  tenantId: string,
  userId: string,
  input: CancelInput,
) {
  const current = await getAppointment(supabase, input.appointmentId);
  assertTransition(current.status, "cancelled");

  let syncStatus = current.sync_status;
  if (current.google_event_id) {
    const res = await deleteGoogleEvent(supabase, tenantId, current.professional_id, current.google_event_id);
    syncStatus = res.status === "synced" ? "not_synced" : res.status;
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancellation_reason: input.reason,
      cancellation_notes: input.notes,
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      reserved_until: null,
      google_event_id: null,
      sync_status: syncStatus,
      updated_by: userId,
    })
    .eq("id", input.appointmentId);
  if (error) throw mapDbError(error);

  if (current.event_id) {
    await supabase.from("events").update({ status: "cancelled" }).eq("id", current.event_id);
  }
  await invalidateCache(supabase, tenantId, current.start_at.slice(0, 10));
  await audit({
    tenantId,
    appointmentId: current.id,
    action: "cancelled",
    userId,
    previous: current,
    next: { reason: input.reason, notes: input.notes },
  });
  await NotificationService.enqueue({
    tenantId,
    appointmentId: current.id,
    clientId: current.client_id,
    professionalId: current.professional_id,
    type: "appointment_cancelled",
  });
  return { appointmentId: current.id as string, status: "cancelled" as const };
}

export async function markNoShow(
  supabase: Db,
  tenantId: string,
  userId: string,
  input: NoShowInput,
) {
  const current = await getAppointment(supabase, input.appointmentId);
  assertTransition(current.status, "no_show");

  const { error } = await supabase
    .from("appointments")
    .update({
      status: "no_show",
      no_show_party: input.party,
      no_show_notes: input.notes,
      no_show_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", input.appointmentId);
  if (error) throw mapDbError(error);

  if (current.event_id) {
    await supabase.from("events").update({ status: "no_show" }).eq("id", current.event_id);
  }
  await audit({
    tenantId,
    appointmentId: current.id,
    action: "no_show",
    userId,
    previous: current,
    next: { party: input.party, notes: input.notes },
  });
  return { appointmentId: current.id as string, status: "no_show" as const };
}

/**
 * Reschedules in place — same appointment id, validated by the engine again.
 */
export async function rescheduleAppointment(
  supabase: Db,
  tenantId: string,
  userId: string,
  input: RescheduleInput,
) {
  const current = await getAppointment(supabase, input.appointmentId);

  const validation = await validateBooking(supabase, tenantId, {
    date: input.date,
    professionalId: input.professionalId,
    clientId: current.client_id,
    appointmentTypeId: current.service_type_id,
    startsAt: input.startAt,
    endsAt: input.endAt,
    title: current.title,
    description: current.notes,
    modality:
      current.modality === "online" ? "online" : current.modality === "in_person" ? "in_person" : "any",
    allowOverbooking: input.allowRuleViolation,
  });
  const blocking = validation.issues.filter((i) => i.severity === "error");
  if (blocking.length > 0 && !input.allowRuleViolation) {
    const err = new Error("rule_violation");
    (err as never as { issues: unknown }).issues = validation.issues;
    throw err;
  }

  // Cancelled / no-show appointments are revived through the 'rescheduled' state.
  if (current.status === "cancelled" || current.status === "no_show") {
    const { error: revive } = await supabase
      .from("appointments")
      .update({ status: "rescheduled", updated_by: userId })
      .eq("id", input.appointmentId);
    if (revive) throw mapDbError(revive);
  }

  const patch: Record<string, unknown> = {
    professional_id: input.professionalId,
    start_at: input.startAt,
    end_at: input.endAt,
    duration_minutes: minutesBetween(input.startAt, input.endAt),
    previous_start_at: current.start_at,
    previous_end_at: current.end_at,
    status: "confirmed",
    cancellation_reason: null,
    cancellation_notes: null,
    cancelled_at: null,
    cancelled_by: null,
    no_show_party: null,
    updated_by: userId,
  };

  const { error } = await supabase.from("appointments").update(patch).eq("id", input.appointmentId);
  if (error) throw mapDbError(error);

  if (current.event_id) {
    await supabase
      .from("events")
      .update({
        professional_id: input.professionalId,
        starts_at: input.startAt,
        ends_at: input.endAt,
        status: "scheduled",
      })
      .eq("id", current.event_id);
  }

  let syncStatus = current.sync_status;
  let syncMessage: string | null = null;
  if (current.google_event_id) {
    const res = await patchGoogleEvent(
      supabase,
      tenantId,
      input.professionalId,
      current.google_event_id,
      { startAt: input.startAt, endAt: input.endAt, timezone: current.timezone },
    );
    syncStatus = res.status;
    syncMessage = res.message ?? null;
    await supabase
      .from("appointments")
      .update({ sync_status: syncStatus, sync_error: syncMessage })
      .eq("id", input.appointmentId);
  }

  await invalidateCache(supabase, tenantId, current.start_at.slice(0, 10));
  await invalidateCache(supabase, tenantId, input.date);
  await audit({
    tenantId,
    appointmentId: current.id,
    action: "rescheduled",
    userId,
    previous: { start_at: current.start_at, end_at: current.end_at, professional_id: current.professional_id },
    next: { start_at: input.startAt, end_at: input.endAt, professional_id: input.professionalId },
  });
  await NotificationService.enqueue({
    tenantId,
    appointmentId: current.id,
    clientId: current.client_id,
    professionalId: input.professionalId,
    type: "appointment_rescheduled",
    scheduledAt: input.startAt,
  });

  return {
    appointmentId: current.id as string,
    status: "confirmed" as const,
    syncStatus,
    syncMessage,
    warnings: validation.issues.filter((i) => i.severity === "warning").map((i) => i.code),
  };
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function listAppointments(supabase: Db, tenantId: string, input: ListInput) {
  await releaseExpiredReservations(tenantId);
  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("tenant_id", tenantId)
    .gte("start_at", `${input.from}T00:00:00.000Z`)
    .lte("start_at", `${input.to}T23:59:59.999Z`)
    .order("start_at", { ascending: true })
    .limit(input.limit);

  if (input.professionalId) query = query.eq("professional_id", input.professionalId);
  if (input.clientId) query = query.eq("client_id", input.clientId);
  if (input.status) query = query.eq("status", input.status);
  if (input.serviceTypeId) query = query.eq("service_type_id", input.serviceTypeId);
  if (input.modality) query = query.eq("modality", input.modality);
  if (input.locationId) query = query.eq("location_id", input.locationId);
  if (input.source) query = query.eq("source", input.source);

  const { data, error } = await query;
  if (error) throw mapDbError(error);
  return (data ?? []).map(flatten);
}

export async function appointmentDetail(supabase: Db, id: string) {
  const appointment = await getAppointment(supabase, id);
  const history = await getHistory(supabase, id);
  return { ...appointment, history };
}

/** Aggregates used by the client journey and professional pages. */
export async function appointmentSummary(
  supabase: Db,
  tenantId: string,
  scope: { clientId?: string | null; professionalId?: string | null },
) {
  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("tenant_id", tenantId)
    .order("start_at", { ascending: false })
    .limit(300);
  if (scope.clientId) query = query.eq("client_id", scope.clientId);
  if (scope.professionalId) query = query.eq("professional_id", scope.professionalId);

  const { data, error } = await query;
  if (error) throw mapDbError(error);
  const rows = (data ?? []).map(flatten);
  const now = Date.now();

  const completed = rows.filter((r: any) => r.status === "completed");
  const upcoming = rows
    .filter((r: any) => Date.parse(r.start_at) >= now && ["confirmed", "reserved", "in_progress"].includes(r.status))
    .sort((a: any, b: any) => Date.parse(a.start_at) - Date.parse(b.start_at));

  return {
    rows,
    next: upcoming[0] ?? null,
    last: completed[0] ?? null,
    total: rows.length,
    completed: completed.length,
    cancelled: rows.filter((r: any) => r.status === "cancelled").length,
    noShows: rows.filter((r: any) => r.status === "no_show").length,
    rescheduled: rows.filter((r: any) => r.previous_start_at).length,
    minutesAttended: completed.reduce((acc: number, r: any) => acc + (r.duration_minutes ?? 0), 0),
  };
}

/* ------------------------------------------------------------------ */
/* Waiting list                                                        */
/* ------------------------------------------------------------------ */

export async function addToWaitingList(
  supabase: Db,
  tenantId: string,
  userId: string,
  input: WaitingListInput,
) {
  const { data, error } = await supabase
    .from("waiting_list")
    .insert({
      tenant_id: tenantId,
      client_id: input.clientId,
      service_type_id: input.serviceTypeId,
      preferred_professional_id: input.preferredProfessionalId,
      preferred_date: input.preferredDate,
      preferred_time_start: input.preferredTimeStart,
      preferred_time_end: input.preferredTimeEnd,
      modality: input.modality,
      priority: input.priority,
      notes: input.notes,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw mapDbError(error);
  await audit({ tenantId, appointmentId: null, action: "waiting_list_created", userId, next: input });
  return { id: data.id as string };
}

export async function listWaitingList(supabase: Db, tenantId: string) {
  const { data, error } = await supabase
    .from("waiting_list")
    .select("*, clients:client_id ( full_name, phone ), professionals:preferred_professional_id ( full_name ), appointment_types:service_type_id ( name )")
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw mapDbError(error);
  return (data ?? []).map((row: any) => ({
    ...row,
    client_name: row.clients?.full_name ?? null,
    client_phone: row.clients?.phone ?? null,
    professional_name: row.professionals?.full_name ?? null,
    service_type_name: row.appointment_types?.name ?? null,
  }));
}

export async function updateWaitingListStatus(
  supabase: Db,
  tenantId: string,
  userId: string,
  id: string,
  status: "waiting" | "contacted" | "scheduled" | "cancelled",
) {
  const { error } = await supabase.from("waiting_list").update({ status }).eq("id", id);
  if (error) throw mapDbError(error);
  await audit({ tenantId, appointmentId: null, action: `waiting_list_${status}`, userId, next: { id, status } });
  return { id, status };
}
