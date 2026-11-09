import { toLocalMinutes } from "../calculators/intervals";
import type {
  AvailabilityRule,
  BusyInterval,
  EngineSettings,
  ProfessionalInput,
  ScheduleInput,
} from "../dto/types";
import type { EngineDataset } from "../engine/availability-engine";

type Db = { from: (table: string) => any };

const BLOCK_VACATION = new Set(["vacation", "sick_leave", "day_off"]);
const BLOCK_HOLIDAY = new Set(["holiday"]);

export interface LoadOptions {
  date: string;
  clientId?: string | null;
}

/** Loads every input the engine needs for one date, scoped to a tenant. */
export async function loadDataset(
  supabase: Db,
  tenantId: string,
  options: LoadOptions,
): Promise<EngineDataset> {
  const { date } = options;
  const dayStartIso = new Date(`${date}T00:00:00Z`);
  const from = new Date(dayStartIso.getTime() - 36 * 3600 * 1000).toISOString();
  const to = new Date(dayStartIso.getTime() + 60 * 3600 * 1000).toISOString();

  const weekStart = new Date(dayStartIso);
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 3600 * 1000);

  const [
    tenantRes,
    settingsRes,
    rulesRes,
    prosRes,
    proTypesRes,
    schedulesRes,
    eventsRes,
    blocksRes,
    weekEventsRes,
  ] = await Promise.all([
    supabase.from("tenants").select("timezone").eq("id", tenantId).maybeSingle(),
    supabase.from("availability_settings").select("*").eq("tenant_id", tenantId).maybeSingle(),
    supabase.from("availability_rules").select("*").eq("tenant_id", tenantId),
    supabase
      .from("professionals")
      .select(
        "id, full_name, specialty, agenda_color, accepts_online, accepts_in_person, active, default_session_minutes, default_interval_minutes",
      )
      .eq("tenant_id", tenantId),
    supabase.from("professional_appointment_types").select("professional_id, appointment_type_id"),
    supabase.from("schedules").select("*").eq("tenant_id", tenantId),
    supabase
      .from("events")
      .select("id, professional_id, client_id, title, starts_at, ends_at, status, source")
      .eq("tenant_id", tenantId)
      .neq("status", "cancelled")
      .gte("starts_at", from)
      .lte("starts_at", to),
    supabase
      .from("blocks")
      .select("id, professional_id, reason, title, starts_at, ends_at")
      .eq("tenant_id", tenantId)
      .lte("starts_at", to)
      .gte("ends_at", from),
    supabase
      .from("events")
      .select("professional_id, starts_at, ends_at")
      .eq("tenant_id", tenantId)
      .neq("status", "cancelled")
      .gte("starts_at", weekStart.toISOString())
      .lt("starts_at", weekEnd.toISOString()),
  ]);

  const timezone = (tenantRes.data?.timezone as string) ?? "America/Sao_Paulo";
  const settings = (settingsRes.data ?? DEFAULT_SETTINGS) as EngineSettings;
  const rules = (rulesRes.data ?? []) as AvailabilityRule[];

  const typesByPro = new Map<string, string[]>();
  for (const row of (proTypesRes.data ?? []) as Array<{
    professional_id: string;
    appointment_type_id: string;
  }>) {
    const list = typesByPro.get(row.professional_id) ?? [];
    list.push(row.appointment_type_id);
    typesByPro.set(row.professional_id, list);
  }

  const professionals: ProfessionalInput[] = ((prosRes.data ?? []) as any[]).map((p) => ({
    ...p,
    appointment_type_ids: typesByPro.get(p.id) ?? [],
  }));

  const schedules = ((schedulesRes.data ?? []) as any[]).map<ScheduleInput>((s) => ({
    professional_id: s.professional_id,
    weekday: s.weekday,
    start_time: String(s.start_time).slice(0, 5),
    end_time: String(s.end_time).slice(0, 5),
    interval_minutes: s.interval_minutes,
    active: s.active,
    schedule_group_id: s.schedule_group_id ?? null,
  }));

  const busyByProfessional: Record<string, BusyInterval[]> = {};
  const dailyAppointments: Record<string, number> = {};
  const push = (proId: string, interval: BusyInterval) => {
    if (interval.end <= 0 || interval.start >= 1440) return;
    const list = busyByProfessional[proId] ?? (busyByProfessional[proId] = []);
    list.push({
      ...interval,
      start: Math.max(0, interval.start),
      end: Math.min(1440, interval.end),
    });
  };

  for (const ev of (eventsRes.data ?? []) as any[]) {
    if (!ev.professional_id) continue;
    const start = toLocalMinutes(ev.starts_at, date, timezone);
    const end = toLocalMinutes(ev.ends_at, date, timezone);
    push(ev.professional_id, {
      start,
      end,
      kind: ev.source === "google" ? "google" : "event",
      label: ev.title ?? undefined,
      clientId: ev.client_id ?? null,
    });
    if (end > 0 && start < 1440) {
      dailyAppointments[ev.professional_id] = (dailyAppointments[ev.professional_id] ?? 0) + 1;
    }
  }

  for (const bl of (blocksRes.data ?? []) as any[]) {
    const start = toLocalMinutes(bl.starts_at, date, timezone);
    const end = toLocalMinutes(bl.ends_at, date, timezone);
    const kind: BusyInterval["kind"] = BLOCK_VACATION.has(bl.reason)
      ? "vacation"
      : BLOCK_HOLIDAY.has(bl.reason)
        ? "holiday"
        : "block";
    const targets = bl.professional_id
      ? [bl.professional_id]
      : professionals.map((p) => p.id);
    for (const proId of targets) {
      push(proId, { start, end, kind, label: bl.title ?? bl.reason });
    }
  }

  const weeklyMinutes: Record<string, number> = {};
  for (const ev of (weekEventsRes.data ?? []) as any[]) {
    if (!ev.professional_id) continue;
    const minutes = Math.max(
      0,
      (Date.parse(ev.ends_at) - Date.parse(ev.starts_at)) / 60000,
    );
    weeklyMinutes[ev.professional_id] = (weeklyMinutes[ev.professional_id] ?? 0) + minutes;
  }

  let clientHistory: string[] = [];
  if (options.clientId) {
    const { data } = await supabase
      .from("events")
      .select("professional_id")
      .eq("tenant_id", tenantId)
      .eq("client_id", options.clientId)
      .not("professional_id", "is", null)
      .limit(200);
    clientHistory = [
      ...new Set(((data ?? []) as any[]).map((r) => r.professional_id as string)),
    ];
  }

  return {
    timezone,
    settings,
    rules,
    professionals,
    schedules,
    busyByProfessional,
    weeklyMinutes,
    dailyAppointments,
    clientHistory,
  };
}

export const DEFAULT_SETTINGS: EngineSettings = {
  weight_available: 50,
  weight_same_professional: 30,
  weight_lower_workload: 20,
  weight_preferred_period: 10,
  weight_almost_full: -20,
  weight_near_lunch: -15,
  weight_overbooking: -10,
  weight_conflict: -100,
  weight_specialty: 15,
  min_minutes_between_appointments: 0,
  max_daily_minutes: 480,
  max_weekly_minutes: 2400,
  max_daily_appointments: 12,
  overbooking_margin_minutes: 0,
  lunch_start: "12:00",
  lunch_end: "13:00",
  slot_granularity_minutes: 15,
  cache_ttl_seconds: 300,
};

/** Persists computed slots so repeated searches are cheap. */
export async function writeCache(
  supabase: Db,
  tenantId: string,
  date: string,
  rows: Array<{
    professional_id: string;
    slot_time: string;
    duration_minutes: number;
    available: boolean;
    reason: string | null;
  }>,
): Promise<void> {
  if (rows.length === 0) return;
  const payload = rows.slice(0, 500).map((r) => ({ ...r, tenant_id: tenantId, date }));
  const { error } = await supabase
    .from("availability_cache")
    .upsert(payload, { onConflict: "professional_id,date,slot_time,duration_minutes" });
  if (error) console.error("availability cache write failed", error);
}

/** Invalidates cached slots for a date (or the whole tenant). */
export async function invalidateCache(
  supabase: Db,
  tenantId: string,
  date?: string,
): Promise<void> {
  let query = supabase.from("availability_cache").delete().eq("tenant_id", tenantId);
  if (date) query = query.eq("date", date);
  await query;
}

/** Recomputes and stores workload aggregates for a date. */
export async function writeWorkload(
  supabase: Db,
  tenantId: string,
  date: string,
  rows: Array<{
    professional_id: string;
    worked_minutes: number;
    free_minutes: number;
    appointments: number;
    occupancy_percent: number;
    overbookings: number;
  }>,
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from("professional_workload")
    .upsert(
      rows.map((r) => ({ ...r, tenant_id: tenantId, date })),
      { onConflict: "professional_id,date" },
    );
  if (error) console.error("workload write failed", error);
}
