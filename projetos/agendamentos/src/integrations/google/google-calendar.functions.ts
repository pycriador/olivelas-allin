import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CONNECTOR_ID = "google_calendar";

async function resolveTenantId(
  supabase: { from: (t: string) => any },
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.tenant_id) throw new Error("Perfil sem clínica associada.");
  return data.tenant_id as string;
}

/** Starts the per-user Google OAuth consent and returns the authorization URL. */
export const startGoogleConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { authorizeAppUserOAuth } = await import(
      "@/integrations/lovable/appUserConnector"
    );
    const {
      GATEWAY_BASE_URL,
      GOOGLE_CALENDAR_SCOPES,
      getConnectionKeyForUser,
      requireClientApiKey,
    } = await import("@/server/google-connection.server");

    const request = getRequest();
    if (!request) throw new Error("OAuth must start from an app request.");
    const returnUrl = new URL("/oauth/google/return", request.url).toString();

    const existingKey = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);

    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: CONNECTOR_ID,
      appUserId: context.userId,
      clientAPIKey: requireClientApiKey(),
      returnUrl,
      connectionAPIKey: existingKey ?? undefined,
      credentialsConfiguration: { scopes: GOOGLE_CALENDAR_SCOPES },
    });

    return { authorizationUrl };
  });

/** Exchanges the one-time OAuth code, stores the key and syncs the account. */
export const completeGoogleConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => {
    if (!input?.code || typeof input.code !== "string") {
      throw new Error("Código OAuth inválido.");
    }
    return { code: input.code };
  })
  .handler(async ({ data, context }) => {
    const { exchangeAppUserOAuthCode } = await import(
      "@/integrations/lovable/appUserConnector"
    );
    const {
      GATEWAY_BASE_URL,
      GOOGLE_CALENDAR_SCOPES,
      saveConnectionKeyForUser,
      fetchGoogleCalendarList,
    } = await import("@/server/google-connection.server");

    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(
      GATEWAY_BASE_URL,
      data.code,
    );
    if (connectorId !== CONNECTOR_ID) {
      throw new Error("OAuth completion returned the wrong connector");
    }

    await saveConnectionKeyForUser(context.userId, connectorId, connectionAPIKey);

    const tenantId = await resolveTenantId(context.supabase, context.userId);
    const calendars = await fetchGoogleCalendarList(connectionAPIKey);
    const primary = calendars.find((c) => c.primary) ?? calendars[0];

    const { data: professional } = await context.supabase
      .from("professionals")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    const { data: account, error: accountError } = await context.supabase
      .from("google_accounts")
      .upsert(
        {
          tenant_id: tenantId,
          user_id: context.userId,
          professional_id: professional?.id ?? null,
          google_user_id: primary?.id ?? null,
          email: primary?.id ?? null,
          display_name: primary?.summary ?? null,
          scopes: GOOGLE_CALENDAR_SCOPES,
          status: "connected",
          last_error: null,
          last_sync: new Date().toISOString(),
        },
        { onConflict: "tenant_id,user_id" },
      )
      .select("id")
      .single();
    if (accountError) throw accountError;

    await persistCalendars(context.supabase, tenantId, account.id, calendars);

    return { ok: true, calendars: calendars.length };
  });

/** Re-reads the calendar list from Google and updates the local mirror. */
export const refreshGoogleCalendars = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getConnectionKeyForUser, fetchGoogleCalendarList } = await import(
      "@/server/google-connection.server"
    );

    const connectionAPIKey = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!connectionAPIKey) throw new Error("Conta Google não conectada.");

    const tenantId = await resolveTenantId(context.supabase, context.userId);
    const { data: account, error } = await context.supabase
      .from("google_accounts")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    if (!account) throw new Error("Conta Google não encontrada.");

    const calendars = await fetchGoogleCalendarList(connectionAPIKey);
    await persistCalendars(context.supabase, tenantId, account.id, calendars);

    await context.supabase
      .from("google_accounts")
      .update({ last_sync: new Date().toISOString(), status: "connected", last_error: null })
      .eq("id", account.id);

    return { ok: true, calendars: calendars.length };
  });

/** Runs an immediate sync for the whole account or a single calendar. */
export const syncGoogleNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { calendarRowId?: string }) => ({
    calendarRowId:
      typeof input?.calendarRowId === "string" ? input.calendarRowId : undefined,
  }))
  .handler(async ({ data, context }) => {
    const { getConnectionKeyForUser } = await import(
      "@/server/google-connection.server"
    );
    const { fetchGoogleEvents, toIsoRange, writeSyncLog } = await import(
      "@/server/google-sync.server"
    );

    const connectionAPIKey = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!connectionAPIKey) throw new Error("Conta Google não conectada.");

    const tenantId = await resolveTenantId(context.supabase, context.userId);
    const { data: account, error: accountError } = await context.supabase
      .from("google_accounts")
      .select("id, professional_id")
      .eq("tenant_id", tenantId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (accountError) throw accountError;
    if (!account) throw new Error("Conta Google não encontrada.");

    let calendarQuery = context.supabase
      .from("google_calendars")
      .select("id, calendar_id, name, sync_enabled")
      .eq("account_id", account.id);
    if (data.calendarRowId) {
      calendarQuery = calendarQuery.eq("id", data.calendarRowId);
    } else {
      calendarQuery = calendarQuery.eq("sync_enabled", true);
    }
    const { data: calendars, error: calendarsError } = await calendarQuery;
    if (calendarsError) throw calendarsError;
    if (!calendars || calendars.length === 0) {
      throw new Error("Nenhum calendário habilitado para sincronizar.");
    }

    const now = Date.now();
    const timeMin = new Date(now - 30 * 24 * 3600 * 1000).toISOString();
    const timeMax = new Date(now + 90 * 24 * 3600 * 1000).toISOString();

    let totals = { total: 0, created: 0, updated: 0, deleted: 0 };
    let lastError: string | null = null;

    for (const cal of calendars as Array<{ id: string; calendar_id: string }>) {
      const startedAt = new Date().toISOString();
      const t0 = Date.now();
      let created = 0;
      let updated = 0;
      let deleted = 0;
      let total = 0;
      let success = true;
      let errorMessage: string | null = null;

      try {
        const googleEvents = await fetchGoogleEvents(
          connectionAPIKey,
          cal.calendar_id,
          timeMin,
          timeMax,
        );
        total = googleEvents.length;

        const ids = googleEvents.map((e) => e.id);
        const existing = new Map<string, string>();
        if (ids.length > 0) {
          const { data: rows } = await context.supabase
            .from("events")
            .select("id, google_event_id")
            .eq("tenant_id", tenantId)
            .in("google_event_id", ids);
          for (const row of (rows ?? []) as Array<{
            id: string;
            google_event_id: string | null;
          }>) {
            if (row.google_event_id) existing.set(row.google_event_id, row.id);
          }
        }

        for (const ev of googleEvents) {
          const localId = existing.get(ev.id);
          if (ev.status === "cancelled") {
            if (localId) {
              const { error } = await context.supabase
                .from("events")
                .update({ status: "cancelled" })
                .eq("id", localId);
              if (error) throw error;
              deleted += 1;
            }
            continue;
          }

          const range = toIsoRange(ev);
          if (!range) continue;

          const payload = {
            tenant_id: tenantId,
            professional_id: account.professional_id ?? null,
            title: ev.summary ?? "(sem título)",
            description: ev.description ?? null,
            starts_at: range.starts_at,
            ends_at: range.ends_at,
            source: "google" as const,
            google_event_id: ev.id,
          };

          if (localId) {
            const { error } = await context.supabase
              .from("events")
              .update(payload)
              .eq("id", localId);
            if (error) throw error;
            updated += 1;
          } else {
            const { error } = await context.supabase
              .from("events")
              .insert({ ...payload, status: "scheduled" as const });
            if (error) throw error;
            created += 1;
          }
        }

        await context.supabase
          .from("google_calendars")
          .update({ last_sync: new Date().toISOString() })
          .eq("id", cal.id);
      } catch (err) {
        success = false;
        errorMessage = err instanceof Error ? err.message : String(err);
        lastError = errorMessage;
      }

      totals = {
        total: totals.total + total,
        created: totals.created + created,
        updated: totals.updated + updated,
        deleted: totals.deleted + deleted,
      };

      await writeSyncLog({
        tenant_id: tenantId,
        account_id: account.id,
        calendar_id: cal.id,
        user_id: context.userId,
        sync_type: data.calendarRowId ? "manual_calendar" : "manual_account",
        direction: "inbound",
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - t0,
        events_total: total,
        events_created: created,
        events_updated: updated,
        events_deleted: deleted,
        conflicts: 0,
        success,
        error_message: errorMessage,
      });
    }

    await context.supabase
      .from("google_accounts")
      .update({
        last_sync: new Date().toISOString(),
        status: lastError ? "error" : "connected",
        last_error: lastError,
      })
      .eq("id", account.id);

    return { ok: !lastError, ...totals, error: lastError };
  });


/** Revokes the connection at the gateway and clears local records. */
export const disconnectGoogleAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { disconnectAppUser } = await import("@/integrations/lovable/appUserConnector");
    const { GATEWAY_BASE_URL, getConnectionKeyForUser, deleteConnectionKeyForUser } =
      await import("@/server/google-connection.server");

    const connectionAPIKey = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (connectionAPIKey) {
      try {
        await disconnectAppUser({
          gatewayBaseUrl: GATEWAY_BASE_URL,
          connectionAPIKey,
          connectorId: CONNECTOR_ID,
        });
      } catch (err) {
        console.error("Gateway disconnect failed", err);
      }
      await deleteConnectionKeyForUser(context.userId, CONNECTOR_ID);
    }

    const tenantId = await resolveTenantId(context.supabase, context.userId);
    await context.supabase
      .from("google_accounts")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("user_id", context.userId);

    return { ok: true };
  });

async function persistCalendars(
  supabase: { from: (t: string) => any },
  tenantId: string,
  accountId: string,
  calendars: Array<{
    id: string;
    summary?: string;
    summaryOverride?: string;
    description?: string;
    backgroundColor?: string;
    timeZone?: string;
    accessRole?: string;
    primary?: boolean;
    selected?: boolean;
  }>,
) {
  if (calendars.length > 0) {
    const rows = calendars.map((cal) => ({
      tenant_id: tenantId,
      account_id: accountId,
      calendar_id: cal.id,
      name: cal.summaryOverride ?? cal.summary ?? cal.id,
      description: cal.description ?? null,
      color: cal.backgroundColor ?? null,
      timezone: cal.timeZone ?? null,
      access_role: cal.accessRole ?? null,
      is_primary: cal.primary ?? false,
      read_only: cal.accessRole === "reader" || cal.accessRole === "freeBusyReader",
    }));
    const { error } = await supabase
      .from("google_calendars")
      .upsert(rows, { onConflict: "account_id,calendar_id" });
    if (error) throw error;
  }

  const keepIds = calendars.map((c) => c.id);
  let query = supabase.from("google_calendars").delete().eq("account_id", accountId);
  if (keepIds.length > 0) {
    query = query.not("calendar_id", "in", `(${keepIds.map((id) => `"${id}"`).join(",")})`);
  }
  await query;
}
