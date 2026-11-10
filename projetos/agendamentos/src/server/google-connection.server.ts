import {
  encryptConnectionKey,
  decryptConnectionKey,
} from "./connection-key-crypto.server";
import { callAsAppUser } from "@/integrations/lovable/appUserConnector";

export const GATEWAY_BASE_URL = "https://api.olivelas.com.br/connectors";
export const GOOGLE_CALENDAR_CONNECTOR_ID = "google_calendar";

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

export function requireClientApiKey(): string {
  const value = process.env["GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY"];
  if (!value) {
    throw new Error("GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY is not set");
  }
  return value;
}

export async function saveConnectionKeyForUser(
  userId: string,
  connectorId: string,
  connectionAPIKey: string,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("app_user_connections").upsert(
    {
      user_id: userId,
      connector_id: connectorId,
      connection_key_ciphertext: encryptConnectionKey(connectionAPIKey),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,connector_id" },
  );
  if (error) throw error;
}

export async function getConnectionKeyForUser(
  userId: string,
  connectorId: string,
): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("app_user_connections")
    .select("connection_key_ciphertext")
    .eq("user_id", userId)
    .eq("connector_id", connectorId)
    .maybeSingle();
  if (error) throw error;
  return data ? decryptConnectionKey(data.connection_key_ciphertext) : null;
}

export async function deleteConnectionKeyForUser(
  userId: string,
  connectorId: string,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("app_user_connections")
    .delete()
    .eq("user_id", userId)
    .eq("connector_id", connectorId);
  if (error) throw error;
}

/** Calls the Google Calendar API on behalf of the app user and parses JSON. */
export async function googleFetch<T>(
  connectionAPIKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey,
    connectorId: GOOGLE_CALENDAR_CONNECTOR_ID,
    path,
    init,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Google API ${path} failed (${res.status}): ${text.slice(0, 400)}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export interface GoogleCalendarListEntry {
  id: string;
  summary?: string;
  summaryOverride?: string;
  description?: string;
  backgroundColor?: string;
  timeZone?: string;
  accessRole?: string;
  primary?: boolean;
  selected?: boolean;
  deleted?: boolean;
}

export async function fetchGoogleCalendarList(
  connectionAPIKey: string,
): Promise<GoogleCalendarListEntry[]> {
  const items: GoogleCalendarListEntry[] = [];
  let pageToken: string | undefined;
  do {
    const query = new URLSearchParams({ maxResults: "250", showHidden: "true" });
    if (pageToken) query.set("pageToken", pageToken);
    const page = await googleFetch<{
      items?: GoogleCalendarListEntry[];
      nextPageToken?: string;
    }>(connectionAPIKey, `/calendar/v3/users/me/calendarList?${query.toString()}`);
    items.push(...(page.items ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return items.filter((c) => !c.deleted);
}
