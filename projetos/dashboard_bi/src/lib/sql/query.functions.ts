import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { explainSchema, previewSchema, runQuerySchema } from "./query-schemas";

export const runQuery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => runQuerySchema.parse(input))
  .handler(async ({ data, context }) => {
    const q = await import("./query.server");
    const s = await import("@/lib/datasources/ds.server");
    const supabase = context.supabase as unknown as import("@/lib/datasources/ds.server").Db;
    try {
      const orgId = await s.resolveOrgId(supabase, context.userId);
      return await q.runReadQuery(
        { supabase, userId: context.userId, orgId },
        {
          dataSourceId: data.dataSourceId,
          sql: data.sql,
          limit: data.limit,
          schemaName: data.schemaName ?? null,
          workspaceId: data.workspaceId ?? null,
        },
      );
    } catch (error) {
      return q.classifyQueryError(error);
    }
  });

export const explainQuery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => explainSchema.parse(input))
  .handler(async ({ data, context }) => {
    const q = await import("./query.server");
    const s = await import("@/lib/datasources/ds.server");
    const { guardReadOnlySql } = await import("./guard");
    const supabase = context.supabase as unknown as import("@/lib/datasources/ds.server").Db;
    try {
      const orgId = await s.resolveOrgId(supabase, context.userId);
      const ctx = { supabase, userId: context.userId, orgId };
      await q.assertCanRunSql(ctx);
      const guard = guardReadOnlySql(data.sql);
      if (!guard.ok) {
        return { ok: false as const, kind: "guard" as const, message: guard.message };
      }
      const source = await q.loadSource(ctx, data.dataSourceId);
      const { getDriver } = await import("@/lib/datasources/drivers/index.server");
      const started = Date.now();
      const plan = await getDriver(source.type).explainQuery(source.config, guard.statement);
      if (!plan.supported) {
        return { ok: true as const, supported: false as const, message: plan.message };
      }
      return {
        ok: true as const,
        supported: true as const,
        text: plan.text,
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return q.classifyQueryError(error);
    }
  });

/** Paginated, filtered, sorted preview of one catalogued table or view. */
export const previewTableData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => previewSchema.parse(input))
  .handler(async ({ data, context }) => {
    const q = await import("./query.server");
    const s = await import("@/lib/datasources/ds.server");
    const { buildCountSql, buildPreviewSql } = await import("./dialect");
    const supabase = context.supabase as unknown as import("@/lib/datasources/ds.server").Db;
    try {
      const orgId = await s.resolveOrgId(supabase, context.userId);
      const ctx = { supabase, userId: context.userId, orgId };
      await q.assertCanRunSql(ctx);

      const { data: object, error } = await supabase
        .from("ds_objects")
        .select("id, name, data_source_id, schema_id, ds_schemas(name)")
        .eq("id", data.objectId)
        .eq("organization_id", orgId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!object) throw new q.PermissionError("Objeto não encontrado no catálogo.");

      const source = await q.loadSource(ctx, object.data_source_id);
      const schemaName =
        (object.ds_schemas as unknown as { name: string } | null)?.name ?? source.defaultSchema;

      const sql = buildPreviewSql(source.type, schemaName, object.name, {
        filters: data.filters,
        filterJoin: data.filterJoin,
        sorts: data.sorts,
        limit: data.limit,
        offset: data.offset,
      });

      const outcome = await q.runReadQuery(ctx, {
        dataSourceId: source.id,
        sql,
        limit: data.limit,
        schemaName,
      });
      if (!outcome.ok) return outcome;

      let total: number | null = null;
      if (data.withCount) {
        const countSql = buildCountSql(source.type, schemaName, object.name, {
          filters: data.filters,
          filterJoin: data.filterJoin,
        });
        const countOutcome = await q.runReadQuery(ctx, {
          dataSourceId: source.id,
          sql: countSql,
          limit: 1,
          schemaName,
          internal: true,
        });
        if (countOutcome.ok) {
          const first = countOutcome.result.rows[0];
          const value = first ? Object.values(first)[0] : null;
          total = value === null || value === undefined ? null : Number(value);
        }
      }

      return { ...outcome, sql, total, schemaName, dsType: source.type };
    } catch (error) {
      return q.classifyQueryError(error);
    }
  });