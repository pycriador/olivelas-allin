/**
 * Availability Engine — Data Transfer Objects.
 * Pure types shared by the engine, rules, calculators, services and UI.
 */

export type RuleType =
  | "working_hours"
  | "interval"
  | "lunch"
  | "vacation_leave"
  | "blocks"
  | "holidays"
  | "internal_events"
  | "google_calendar"
  | "min_gap"
  | "max_daily"
  | "max_weekly"
  | "max_appointments"
  | "online"
  | "in_person"
  | "specialty"
  | "appointment_type"
  | "shared_agenda"
  | "overbooking"
  | "recurring_events";

export interface AvailabilityRule {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  type: RuleType;
  priority: number;
  enabled: boolean;
  params: Record<string, unknown>;
}

export interface EngineSettings {
  weight_available: number;
  weight_same_professional: number;
  weight_lower_workload: number;
  weight_preferred_period: number;
  weight_almost_full: number;
  weight_near_lunch: number;
  weight_overbooking: number;
  weight_conflict: number;
  weight_specialty: number;
  min_minutes_between_appointments: number;
  max_daily_minutes: number;
  max_weekly_minutes: number;
  max_daily_appointments: number;
  overbooking_margin_minutes: number;
  lunch_start: string;
  lunch_end: string;
  slot_granularity_minutes: number;
  cache_ttl_seconds: number;
}

export interface ProfessionalInput {
  id: string;
  full_name: string;
  specialty: string | null;
  agenda_color: string;
  accepts_online: boolean;
  accepts_in_person: boolean;
  active: boolean;
  default_session_minutes: number;
  default_interval_minutes: number;
  appointment_type_ids: string[];
}

export interface ScheduleInput {
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  active: boolean;
  schedule_group_id: string | null;
}

export type BusyKind =
  | "event"
  | "google"
  | "block"
  | "vacation"
  | "holiday"
  | "lunch"
  | "interval";

export interface BusyInterval {
  /** minutes from local midnight of the requested date */
  start: number;
  end: number;
  kind: BusyKind;
  label?: string;
  clientId?: string | null;
}

export type Modality = "online" | "in_person" | "any";

export interface AvailabilityQuery {
  date: string; // YYYY-MM-DD
  timeFrom?: string | null; // HH:mm
  timeTo?: string | null; // HH:mm
  durationMinutes: number;
  specialty?: string | null;
  appointmentTypeId?: string | null;
  modality?: Modality;
  professionalId?: string | null;
  scheduleGroupId?: string | null;
  clientId?: string | null;
  urgent?: boolean;
  preferredPeriod?: "morning" | "afternoon" | "evening" | null;
  limit?: number;
}

export interface ScoreReason {
  key: string;
  points: number;
}

export interface SlotSuggestion {
  professionalId: string;
  professionalName: string;
  professionalColor: string;
  specialty: string | null;
  startMinutes: number;
  endMinutes: number;
  startLabel: string;
  endLabel: string;
  startsAt: string;
  endsAt: string;
  score: number;
  reasons: ScoreReason[];
  workloadPercent: number;
  googleFree: boolean;
  conflicts: number;
  overbooking: boolean;
}

export type TimelineState =
  | "available"
  | "partial"
  | "block"
  | "lunch"
  | "vacation"
  | "event"
  | "google"
  | "appointment"
  | "off";

export interface TimelineSegment {
  start: number;
  end: number;
  state: TimelineState;
  label?: string;
}

export interface ProfessionalTimeline {
  professionalId: string;
  professionalName: string;
  professionalColor: string;
  segments: TimelineSegment[];
  workloadPercent: number;
  freeMinutes: number;
  busyMinutes: number;
  appointments: number;
}

export interface HeatmapCell {
  date: string;
  occupancyPercent: number;
  appointments: number;
}

export interface WorkloadRow {
  professionalId: string;
  professionalName: string;
  date: string;
  workedMinutes: number;
  freeMinutes: number;
  appointments: number;
  occupancyPercent: number;
  overbookings: number;
}
