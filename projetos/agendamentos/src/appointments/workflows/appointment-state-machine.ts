/** Pure state-machine helpers shared by UI and server. */
import { STATUS_TRANSITIONS } from "../constants";
import type { AppointmentPermission, AppointmentStatus } from "../types";

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: AppointmentStatus, to: AppointmentStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`invalid_status_transition:${from}->${to}`);
  }
}

export type AppointmentAction =
  | "start"
  | "complete"
  | "confirm"
  | "reschedule"
  | "cancel"
  | "no_show"
  | "history";

export interface ActionDescriptor {
  action: AppointmentAction;
  permission: AppointmentPermission | null;
  variant: "default" | "outline" | "destructive" | "secondary";
}

/** Actions offered for a status, before permission filtering. */
export function actionsForStatus(status: AppointmentStatus): ActionDescriptor[] {
  switch (status) {
    case "draft":
    case "requested":
    case "reserved":
      return [
        { action: "confirm", permission: "appointments.edit", variant: "default" },
        { action: "cancel", permission: "appointments.cancel", variant: "destructive" },
      ];
    case "confirmed":
      return [
        { action: "start", permission: "appointments.edit", variant: "default" },
        { action: "reschedule", permission: "appointments.reschedule", variant: "outline" },
        { action: "no_show", permission: "appointments.no_show", variant: "outline" },
        { action: "cancel", permission: "appointments.cancel", variant: "destructive" },
      ];
    case "in_progress":
      return [
        { action: "complete", permission: "appointments.complete", variant: "default" },
        { action: "cancel", permission: "appointments.cancel", variant: "destructive" },
      ];
    case "completed":
      return [{ action: "history", permission: null, variant: "outline" }];
    case "cancelled":
    case "no_show":
      return [
        { action: "reschedule", permission: "appointments.reschedule", variant: "default" },
        { action: "history", permission: null, variant: "outline" },
      ];
    case "rescheduled":
      return [{ action: "history", permission: null, variant: "outline" }];
    default:
      return [];
  }
}

export function availableActions(
  status: AppointmentStatus,
  can: (permission: AppointmentPermission) => boolean,
): ActionDescriptor[] {
  return actionsForStatus(status).filter((a) => !a.permission || can(a.permission));
}
