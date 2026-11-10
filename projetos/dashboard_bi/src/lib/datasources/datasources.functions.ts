import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { dataSourceInputSchema, idSchema, testConnectionSchema } from "./ds-schemas";

export const testConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => testConnectionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const s = await import("./ds.server");
    const supabase = context.supabase as unknown as import("./ds.server").Db;
    const orgId = await s.resolveOrgId(supabase, context.userId);
    await s.assertCanManage(supabase, context.userId, orgId);

    if (data.dataSourceId) {
      const row = await s.loadRowWithSecret(orgId, data.dataSourceId);
      const result = await s.probe(s.configFromRow(row, data.draft?.password ?? null));
      await s.applyHealth(supabase, row.id, result);
      return result;
    }

    if (!data.draft) throw new Error("Nothing to test.");
    const d = data.draft;
    return s.probe(
      s.buildConfig(
        {
          type: d.type,
          host: d.host ?? null,
          port: d.port ?? null,
          database_name: d.databaseName ?? null,
          default_schema: d.defaultSchema ?? null,
          username: d.username ?? null,
          ssl_enabled: d.sslEnabled,
          ssl_ca_certificate: null,
          timeout_ms: d.timeoutMs,
          extra_config: {},
        },
        d.password ?? "",
      ),
    );
  });

export const saveDataSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => dataSourceInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const s = await import("./ds.server");
    const { encryptSecret } = await import("./crypto.server");
    const supabase = context.supabase as unknown as import("./ds.server").Db;
    const orgId = await s.resolveOrgId(supabase, context.userId);
    await s.assertCanManage(supabase, context.userId, orgId);

    const payload = {
      organization_id: orgId,
      workspace_id: data.workspaceId ?? null,
      name: data.name,
      description: data.description ?? null,
      type: data.type,
      environment: data.environment,
      host: data.host ?? null,
      port: data.port ?? null,
      database_name: data.databaseName ?? null,
      default_schema: data.defaultSchema ?? null,
      username: data.username ?? null,
      ssl_enabled: data.sslEnabled,
      timeout_ms: data.timeoutMs,
      tags: data.tags,
      sync_mode: data.syncMode,
      sync_frequency: data.syncFrequency,
      active: data.active,
      ...(data.password ? { secret_ciphertext: encryptSecret(data.password) } : {}),
    };

    if (data.id) {
      const { error } = await supabase.from("data_sources").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabase
      .from("data_sources")
      .insert({ ...payload, created_by: context.userId })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to create data source.");
    return { id: row.id };
  });

export const deleteDataSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const s = await import("./ds.server");
    const supabase = context.supabase as unknown as import("./ds.server").Db;
    const orgId = await s.resolveOrgId(supabase, context.userId);
    await s.assertCanManage(supabase, context.userId, orgId);
    const { error } = await supabase.from("data_sources").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const syncDataSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const s = await import("./ds.server");
    const supabase = context.supabase as unknown as import("./ds.server").Db;
    const orgId = await s.resolveOrgId(supabase, context.userId);
    await s.assertCanManage(supabase, context.userId, orgId);

    const row = await s.loadRowWithSecret(orgId, data.id);

    const startedAt = new Date().toISOString();
    const { data: run } = await supabase
      .from("ds_sync_runs")
      .insert({
        organization_id: orgId,
        data_source_id: row.id,
        triggered_by: context.userId,
        trigger_source: "manual",
        status: "running",
        started_at: startedAt,
      })
      .select("id")
      .single();

    const t0 = Date.now();
    try {
      const result = await s.discover(s.configFromRow(row));
      const counts = await s.persistDiscovery(supabase, orgId, row.id, result);
      if (run) {
        await supabase
          .from("ds_sync_runs")
          .update({
            status: "success",
            finished_at: new Date().toISOString(),
            duration_ms: Date.now() - t0,
            objects_added: counts.tableCount + counts.viewCount,
          })
          .eq("id", run.id);
      }
      return { ok: true as const, ...counts };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (run) {
        await supabase
          .from("ds_sync_runs")
          .update({
            status: "failed",
            finished_at: new Date().toISOString(),
            duration_ms: Date.now() - t0,
            error_message: message,
          })
          .eq("id", run.id);
      }
      await supabase
        .from("data_sources")
        .update({
          health: "offline",
          health_message: message,
          health_checked_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      return { ok: false as const, message };
    }
  });

/** Registers the platform's own Postgres as a demo data source, then syncs it. */
export const seedDemoDataSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = await import("./ds.server");
    const { encryptSecret } = await import("./crypto.server");
    const supabase = context.supabase as unknown as import("./ds.server").Db;
    const orgId = await s.resolveOrgId(supabase, context.userId);
    await s.assertCanManage(supabase, context.userId, orgId);

    const platform = s.platformPostgresConfig();
    if (!platform) throw new Error("The platform database URL is not available.");

    const { data: existing } = await supabase
      .from("data_sources")
      .select("id")
      .eq("organization_id", orgId)
      .eq("name", "Platform Postgres (demo)")
      .maybeSingle();

    let id = existing?.id;
    if (!id) {
      const { data: row, error } = await supabase
        .from("data_sources")
        .insert({
          organization_id: orgId,
          name: "Platform Postgres (demo)",
          description: "Banco PostgreSQL da própria plataforma, usado como fonte de demonstração.",
          type: "postgresql",
          environment: "development",
          host: platform.host,
          port: platform.port,
          database_name: platform.database,
          default_schema: "public",
          username: platform.username,
          secret_ciphertext: encryptSecret(platform.password),
          ssl_enabled: true,
          tags: ["demo", "interno"],
          created_by: context.userId,
        })
        .select("id")
        .single();
      if (error || !row) throw new Error(error?.message ?? "Failed to create demo source.");
      id = row.id;
    }

    const row = await s.loadRowWithSecret(orgId, id);
    const result = await s.discover(s.configFromRow(row));
    const counts = await s.persistDiscovery(supabase, orgId, id, result);
    return { id, ...counts };
  });
