import { googleFetch } from "./google-connection.server";

export interface GoogleEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

export async function fetchGoogleEvents(
  connectionAPIKey: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
): Promise<GoogleEvent[]> {
  const items: GoogleEvent[] = [];
  let pageToken: string | undefined;
  do {
    const query = new URLSearchParams({
      maxResults: "250",
      singleEvents: "true",
      showDeleted: "true",
      orderBy: "startTime",
      timeMin,
      timeMax,
    });
    if (pageToken) query.set("pageToken", pageToken);
    const page = await googleFetch<{ items?: GoogleEvent[]; nextPageToken?: string }>(
      connectionAPIKey,
      `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${query.toString()}`,
    );
    items.push(...(page.items ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return items;
}

export function toIsoRange(ev: GoogleEvent): { starts_at: string; ends_at: string } | null {
  const start = ev.start?.dateTime ?? (ev.start?.date ? `${ev.start.date}T00:00:00Z` : null);
  const end = ev.end?.dateTime ?? (ev.end?.date ? `${ev.end.date}T23:59:59Z` : null);
  if (!start || !end) return null;
  return { starts_at: new Date(start).toISOString(), ends_at: new Date(end).toISOString() };
}

export interface SyncLogRow {
  tenant_id: string;
  account_id: string | null;
  calendar_id: string | null;
  user_id: string | null;
  sync_type: string;
  direction: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  events_total: number;
  events_created: number;
  events_updated: number;
  events_deleted: number;
  conflicts: number;
  success: boolean;
  error_message: string | null;
}

export async function writeSyncLog(row: SyncLogRow): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("calendar_sync_logs").insert(row);
  if (error) console.error("Failed to write calendar_sync_log", error);
}
