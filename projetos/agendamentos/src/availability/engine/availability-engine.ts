import {
  clampIntervals,
  formatHm,
  generateSlots,
  mergeIntervals,
  parseHm,
  subtractIntervals,
  toIso,
  totalMinutes,
  weekdayOf,
  type Interval,
} from "../calculators/intervals";
import { RuleSet } from "../rules/rule-set";
import type {
  AvailabilityQuery,
  AvailabilityRule,
  BusyInterval,
  EngineSettings,
  ProfessionalInput,
  ProfessionalTimeline,
  ScheduleInput,
  ScoreReason,
  SlotSuggestion,
  TimelineSegment,
  TimelineState,
} from "../dto/types";

export interface EngineDataset {
  timezone: string;
  settings: EngineSettings;
  rules: AvailabilityRule[];
  professionals: ProfessionalInput[];
  schedules: ScheduleInput[];
  /** busy intervals per professional id (already in local minutes) */
  busyByProfessional: Record<string, BusyInterval[]>;
  /** minutes already booked in the current week, per professional */
  weeklyMinutes: Record<string, number>;
  /** number of appointments on the requested date, per professional */
  dailyAppointments: Record<string, number>;
  /** professional ids that already attended the queried client */
  clientHistory: string[];
}

const BUSY_STATE: Record<string, TimelineState> = {
  event: "event",
  google: "google",
  block: "block",
  vacation: "vacation",
  holiday: "block",
  lunch: "lunch",
  interval: "partial",
};

/** Working windows of a professional for the requested date. */
export function workingWindows(
  professionalId: string,
  dataset: EngineDataset,
  date: string,
): Interval[] {
  const weekday = weekdayOf(date);
  return mergeIntervals(
    dataset.schedules
      .filter(
        (s) => s.professional_id === professionalId && s.active && s.weekday === weekday,
      )
      .map((s) => ({ start: parseHm(s.start_time), end: parseHm(s.end_time) })),
  );
}

function lunchInterval(settings: EngineSettings): Interval {
  return { start: parseHm(settings.lunch_start), end: parseHm(settings.lunch_end) };
}

function busyFor(
  professionalId: string,
  dataset: EngineDataset,
  rules: RuleSet,
): BusyInterval[] {
  const raw = dataset.busyByProfessional[professionalId] ?? [];
  const kindRule: Record<string, boolean> = {
    event: rules.isEnabled("internal_events"),
    google: rules.isEnabled("google_calendar"),
    block: rules.isEnabled("blocks"),
    vacation: rules.isEnabled("vacation_leave"),
    holiday: rules.isEnabled("holidays"),
  };
  const busy = raw.filter((b) => kindRule[b.kind] !== false);
  if (rules.isEnabled("lunch")) {
    busy.push({ ...lunchInterval(dataset.settings), kind: "lunch", label: "lunch" });
  }
  return busy;
}

/** Free windows for a professional after applying every blocking rule. */
export function freeWindows(
  professionalId: string,
  dataset: EngineDataset,
  query: AvailabilityQuery,
): Interval[] {
  const rules = new RuleSet(dataset.rules);
  let base = rules.isEnabled("working_hours")
    ? workingWindows(professionalId, dataset, query.date)
    : [{ start: 0, end: 1440 }];

  if (query.timeFrom || query.timeTo) {
    base = clampIntervals(base, {
      start: query.timeFrom ? parseHm(query.timeFrom) : 0,
      end: query.timeTo ? parseHm(query.timeTo) : 1440,
    });
  }

  const gap = rules.isEnabled("min_gap")
    ? dataset.settings.min_minutes_between_appointments
    : 0;
  const busy = busyFor(professionalId, dataset, rules).map((b) => ({
    start: b.kind === "lunch" ? b.start : b.start - gap,
    end: b.kind === "lunch" ? b.end : b.end + gap,
  }));

  return subtractIntervals(base, busy);
}

function matchesFilters(
  pro: ProfessionalInput,
  dataset: EngineDataset,
  query: AvailabilityQuery,
  rules: RuleSet,
): boolean {
  if (!pro.active) return false;
  if (query.professionalId && pro.id !== query.professionalId) return false;
  if (query.modality === "online" && rules.isEnabled("online") && !pro.accepts_online)
    return false;
  if (
    query.modality === "in_person" &&
    rules.isEnabled("in_person") &&
    !pro.accepts_in_person
  )
    return false;
  if (query.specialty && rules.isEnabled("specialty")) {
    if ((pro.specialty ?? "").toLowerCase() !== query.specialty.toLowerCase()) return false;
  }
  if (query.appointmentTypeId && rules.isEnabled("appointment_type")) {
    if (
      pro.appointment_type_ids.length > 0 &&
      !pro.appointment_type_ids.includes(query.appointmentTypeId)
    )
      return false;
  }
  if (query.scheduleGroupId && rules.isEnabled("shared_agenda")) {
    const inGroup = dataset.schedules.some(
      (s) => s.professional_id === pro.id && s.schedule_group_id === query.scheduleGroupId,
    );
    if (!inGroup) return false;
  }
  return true;
}

export interface ProfessionalLimits {
  dailyMinutes: number;
  weeklyMinutes: number;
  appointments: number;
  capacityMinutes: number;
  workloadPercent: number;
  dailyExceeded: boolean;
  weeklyExceeded: boolean;
  appointmentsExceeded: boolean;
}

export function professionalLimits(
  pro: ProfessionalInput,
  dataset: EngineDataset,
  query: AvailabilityQuery,
): ProfessionalLimits {
  const rules = new RuleSet(dataset.rules);
  const windows = workingWindows(pro.id, dataset, query.date);
  const capacityMinutes = totalMinutes(windows) || dataset.settings.max_daily_minutes;
  const busy = (dataset.busyByProfessional[pro.id] ?? []).filter(
    (b) => b.kind === "event" || b.kind === "google",
  );
  const dailyMinutes = totalMinutes(clampIntervals(busy, { start: 0, end: 1440 }));
  const weeklyMinutes = dataset.weeklyMinutes[pro.id] ?? 0;
  const appointments = dataset.dailyAppointments[pro.id] ?? 0;

  return {
    dailyMinutes,
    weeklyMinutes,
    appointments,
    capacityMinutes,
    workloadPercent:
      capacityMinutes > 0
        ? Math.min(100, Math.round((dailyMinutes / capacityMinutes) * 100))
        : 0,
    dailyExceeded:
      rules.isEnabled("max_daily") && dailyMinutes >= dataset.settings.max_daily_minutes,
    weeklyExceeded:
      rules.isEnabled("max_weekly") && weeklyMinutes >= dataset.settings.max_weekly_minutes,
    appointmentsExceeded:
      rules.isEnabled("max_appointments") &&
      appointments >= dataset.settings.max_daily_appointments,
  };
}

function scoreSlot(
  pro: ProfessionalInput,
  slot: Interval,
  limits: ProfessionalLimits,
  dataset: EngineDataset,
  query: AvailabilityQuery,
  overbooking: boolean,
): { score: number; reasons: ScoreReason[] } {
  const s = dataset.settings;
  const reasons: ScoreReason[] = [{ key: "available", points: s.weight_available }];

  if (query.clientId && dataset.clientHistory.includes(pro.id)) {
    reasons.push({ key: "sameProfessional", points: s.weight_same_professional });
  }
  if (limits.workloadPercent <= 50) {
    reasons.push({ key: "lowerWorkload", points: s.weight_lower_workload });
  }
  if (query.preferredPeriod && periodOf(slot.start) === query.preferredPeriod) {
    reasons.push({ key: "preferredPeriod", points: s.weight_preferred_period });
  }
  if (query.specialty && pro.specialty) {
    reasons.push({ key: "specialtyMatch", points: s.weight_specialty });
  }
  if (limits.workloadPercent >= 85) {
    reasons.push({ key: "almostFull", points: s.weight_almost_full });
  }
  const lunch = lunchInterval(s);
  if (Math.abs(slot.end - lunch.start) <= 30 || Math.abs(slot.start - lunch.end) <= 30) {
    reasons.push({ key: "nearLunch", points: s.weight_near_lunch });
  }
  if (overbooking) {
    reasons.push({ key: "overbooking", points: s.weight_overbooking });
  }

  const score = reasons.reduce((sum, r) => sum + r.points, 0);
  return { score: Math.max(0, Math.min(100, score)), reasons };
}

function periodOf(minutes: number): "morning" | "afternoon" | "evening" {
  if (minutes < 12 * 60) return "morning";
  if (minutes < 18 * 60) return "afternoon";
  return "evening";
}

/** Core search: best professionals + best time windows for a query. */
export function searchAvailability(
  dataset: EngineDataset,
  query: AvailabilityQuery,
): SlotSuggestion[] {
  const rules = new RuleSet(dataset.rules);
  const duration = Math.max(5, query.durationMinutes);
  const suggestions: SlotSuggestion[] = [];

  for (const pro of dataset.professionals) {
    if (!matchesFilters(pro, dataset, query, rules)) continue;

    const limits = professionalLimits(pro, dataset, query);
    const overbookingAllowed =
      rules.isEnabled("overbooking", false) && dataset.settings.overbooking_margin_minutes > 0;

    const hardLimit =
      limits.dailyExceeded || limits.weeklyExceeded || limits.appointmentsExceeded;
    if (hardLimit && !(query.urgent && overbookingAllowed)) continue;

    const windows = freeWindows(pro.id, dataset, query);
    const gap = rules.isEnabled("min_gap")
      ? dataset.settings.min_minutes_between_appointments
      : 0;
    const slots = generateSlots(windows, duration, dataset.settings.slot_granularity_minutes, gap);
    const overbooking = hardLimit;

    const googleBusy = (dataset.busyByProfessional[pro.id] ?? []).some(
      (b) => b.kind === "google",
    );

    for (const slot of slots) {
      const { score, reasons } = scoreSlot(
        pro,
        slot,
        limits,
        dataset,
        query,
        overbooking,
      );
      suggestions.push({
        professionalId: pro.id,
        professionalName: pro.full_name,
        professionalColor: pro.agenda_color,
        specialty: pro.specialty,
        startMinutes: slot.start,
        endMinutes: slot.end,
        startLabel: formatHm(slot.start),
        endLabel: formatHm(slot.end),
        startsAt: toIso(query.date, slot.start, dataset.timezone),
        endsAt: toIso(query.date, slot.end, dataset.timezone),
        score,
        reasons,
        workloadPercent: limits.workloadPercent,
        googleFree: !googleBusy,
        conflicts: 0,
        overbooking,
      });
    }
  }

  suggestions.sort((a, b) => b.score - a.score || a.startMinutes - b.startMinutes);
  return suggestions.slice(0, query.limit ?? 60);
}

/** Timeline segments per professional for a single date. */
export function buildTimelines(
  dataset: EngineDataset,
  date: string,
  dayStart = 7 * 60,
  dayEnd = 22 * 60,
): ProfessionalTimeline[] {
  const rules = new RuleSet(dataset.rules);
  const bound = { start: dayStart, end: dayEnd };

  return dataset.professionals
    .filter((p) => p.active)
    .map((pro) => {
      const working = clampIntervals(workingWindows(pro.id, dataset, date), bound);
      const busy = busyFor(pro.id, dataset, rules);
      const clampedBusy = busy
        .map((b) => ({
          ...b,
          start: Math.max(b.start, bound.start),
          end: Math.min(b.end, bound.end),
        }))
        .filter((b) => b.end > b.start);

      const free = subtractIntervals(working, clampedBusy);
      const segments: TimelineSegment[] = [
        ...free.map<TimelineSegment>((f) => ({ ...f, state: "available" })),
        ...clampedBusy.map<TimelineSegment>((b) => ({
          start: b.start,
          end: b.end,
          state: BUSY_STATE[b.kind] ?? "event",
          ...(b.label ? { label: b.label } : {}),
        })),
      ].sort((a, b) => a.start - b.start);

      const busyMinutes = totalMinutes(
        clampedBusy.filter((b) => b.kind === "event" || b.kind === "google"),
      );
      const capacity = totalMinutes(working);

      return {
        professionalId: pro.id,
        professionalName: pro.full_name,
        professionalColor: pro.agenda_color,
        segments,
        freeMinutes: totalMinutes(free),
        busyMinutes,
        appointments: dataset.dailyAppointments[pro.id] ?? 0,
        workloadPercent: capacity > 0 ? Math.round((busyMinutes / capacity) * 100) : 0,
      };
    });
}
