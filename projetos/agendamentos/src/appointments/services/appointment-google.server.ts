/**
 * Google Calendar bridge for appointments.
 * Reuses the existing app-user connector; failures never lose the appointment.
 */
import {
  GOOGLE_CALENDAR_CONNECTOR_ID,
  getConnectionKeyForUser,
  googleFetch,
} from "@/server/google-connection.server";

type Db = { from: (table: string) => any };

export interface GoogleSyncOutcome {
  status: "synced" | "pending" | "error" | "not_synced";
  googleEventId?: string | null;
  calendarRowId?: string | null;
  meetUrl?: string | null;
  meetId?: string | null;
  message?: string | null;
}

interface TargetCalendar {
  ownerUserId: string;
  calendarRowId: string;
  calendarId: string;
}

async function resolveCalendar(
  supabase: Db,
  tenantId: string,
  professionalId: string,
): Promise<TargetCalendar | null> {
  const { data: account } = await supabase
    .from("google_accounts")
    .select("id, user_id, status")
    .eq("tenant_id", tenantId)
    .eq("professional_id", professionalId)
    .eq("status", "connected")
    .maybeSingle();
  if (!account?.user_id) return null;

  const { data: calendars } = await supabase
    .from("google_calendars")
    .select("id, calendar_id, is_primary, sync_enabled, read_only")
    .eq("tenant_id", tenantId)
    .eq("account_id", account.id)
    .eq("sync_enabled", true);

  const usable = (calendars ?? []).filter((c: any) => !c.read_only);
  const target = usable.find((c: any) => c.is_primary) ?? usable[0];
  if (!target) return null;

  return {
    ownerUserId: account.user_id as string,
    calendarRowId: target.id as string,
    calendarId: target.calendar_id as string,
  };
}

export interface GoogleEventPayload {
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  timezone: string;
  createMeet?: boolean;
}

/** Creates the Google event for an appointment. Returns a sync outcome. */
export async function pushAppointmentToGoogle(
  supabase: Db,
  tenantId: string,
  professionalId: string,
  payload: GoogleEventPayload,
): Promise<GoogleSyncOutcome> {
  try {
    const target = await resolveCalendar(supabase, tenantId, professionalId);
    if (!target) return { status: "not_synced", message: "no_connected_calendar" };

    const key = await getConnectionKeyForUser(target.ownerUserId, GOOGLE_CALENDAR_CONNECTOR_ID);
    if (!key) return { status: "pending", message: "missing_connection" };

    const query = payload.createMeet ? "?conferenceDataVersion=1" : "";
    const body: Record<string, unknown> = {
      summary: payload.title,
      description: payload.description ?? undefined,
      start: { dateTime: payload.startAt, timeZone: payload.timezone },
      end: { dateTime: payload.endAt, timeZone: payload.timezone },
    };
    if (payload.createMeet) {
      body["conferenceData"] = {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    const created = await googleFetch<any>(
      key,
      `/calendar/v3/calendars/${encodeURIComponent(target.calendarId)}/events${query}`,
      { method: "POST", body: JSON.stringify(body) },
    );

    const entry = (created?.conferenceData?.entryPoints ?? []).find(
      (e: any) => e.entryPointType === "video",
    );

    return {
      status: "synced",
      googleEventId: created?.id ?? null,
      calendarRowId: target.calendarRowId,
      meetUrl: entry?.uri ?? created?.hangoutLink ?? null,
      meetId: created?.conferenceData?.conferenceId ?? null,
    };
  } catch (err) {
    console.error("google push failed", err);
    return { status: "error", message: (err as Error).message?.slice(0, 400) ?? "unknown" };
  }
}

/** Moves an existing Google event (reschedule). */
export async function patchGoogleEvent(
  supabase: Db,
  tenantId: string,
  professionalId: string,
  googleEventId: string,
  payload: Pick<GoogleEventPayload, "startAt" | "endAt" | "timezone">,
): Promise<GoogleSyncOutcome> {
  try {
    const target = await resolveCalendar(supabase, tenantId, professionalId);
    if (!target) return { status: "not_synced", message: "no_connected_calendar" };
    const key = await getConnectionKeyForUser(target.ownerUserId, GOOGLE_CALENDAR_CONNECTOR_ID);
    if (!key) return { status: "pending", message: "missing_connection" };

    await googleFetch(
      key,
      `/calendar/v3/calendars/${encodeURIComponent(target.calendarId)}/events/${encodeURIComponent(googleEventId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          start: { dateTime: payload.startAt, timeZone: payload.timezone },
          end: { dateTime: payload.endAt, timeZone: payload.timezone },
        }),
      },
    );
    return { status: "synced", googleEventId };
  } catch (err) {
    console.error("google patch failed", err);
    return { status: "error", message: (err as Error).message?.slice(0, 400) ?? "unknown" };
  }
}

/** Removes the Google event (cancellation). */
export async function deleteGoogleEvent(
  supabase: Db,
  tenantId: string,
  professionalId: string,
  googleEventId: string,
): Promise<GoogleSyncOutcome> {
  try {
    const target = await resolveCalendar(supabase, tenantId, professionalId);
    if (!target) return { status: "not_synced", message: "no_connected_calendar" };
    const key = await getConnectionKeyForUser(target.ownerUserId, GOOGLE_CALENDAR_CONNECTOR_ID);
    if (!key) return { status: "pending", message: "missing_connection" };
    await googleFetch(
      key,
      `/calendar/v3/calendars/${encodeURIComponent(target.calendarId)}/events/${encodeURIComponent(googleEventId)}`,
      { method: "DELETE" },
    );
    return { status: "synced", googleEventId: null };
  } catch (err) {
    console.error("google delete failed", err);
    return { status: "error", message: (err as Error).message?.slice(0, 400) ?? "unknown" };
  }
}
