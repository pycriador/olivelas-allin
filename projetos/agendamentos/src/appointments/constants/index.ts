/** Appointment Management — domain constants. */
import type { AppointmentStatus, CancellationReason, AppointmentPermission } from "../types";

/** Temporary hold duration, in minutes. */
export const RESERVATION_MINUTES = 5;

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "draft",
  "requested",
  "reserved",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
];

/** Mirrors the database state machine (public.appointments_guard). */
export const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  draft: ["requested", "reserved", "confirmed", "cancelled"],
  requested: ["reserved", "confirmed", "cancelled"],
  reserved: ["confirmed", "cancelled", "draft", "requested"],
  confirmed: ["in_progress", "cancelled", "rescheduled", "no_show", "completed"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: ["rescheduled"],
  no_show: ["rescheduled"],
  rescheduled: ["confirmed"],
};

export const CANCELLATION_REASONS: CancellationReason[] = [
  "client_request",
  "professional_request",
  "conflict",
  "illness",
  "holiday",
  "emergency",
  "other",
];

export const APPOINTMENT_PERMISSIONS: AppointmentPermission[] = [
  "appointments.view",
  "appointments.create",
  "appointments.edit",
  "appointments.cancel",
  "appointments.reschedule",
  "appointments.complete",
  "appointments.no_show",
  "appointments.fit_in",
  "appointments.delete",
  "waiting_list.view",
  "waiting_list.manage",
];

/** Client-side mirror of private.has_permission — the backend re-validates. */
export const ROLE_PERMISSIONS: Record<string, AppointmentPermission[] | "all"> = {
  global_admin: "all",
  clinic_admin: "all",
  receptionist: [
    "appointments.view",
    "appointments.create",
    "appointments.edit",
    "appointments.cancel",
    "appointments.reschedule",
    "appointments.no_show",
    "waiting_list.view",
    "waiting_list.manage",
  ],
  psychologist: [
    "appointments.view",
    "appointments.create",
    "appointments.edit",
    "appointments.cancel",
    "appointments.reschedule",
    "appointments.complete",
    "appointments.no_show",
    "waiting_list.view",
  ],
  supervisor: ["appointments.view", "appointments.fit_in", "waiting_list.view"],
  read_only: ["appointments.view", "waiting_list.view"],
};

export const STATUS_TONE: Record<AppointmentStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  requested: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  reserved: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  confirmed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  in_progress: "bg-primary/15 text-primary",
  completed: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  cancelled: "bg-destructive/15 text-destructive",
  no_show: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  rescheduled: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
};
