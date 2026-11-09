import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "@/lib/iam/permissions.server";
import type { AuditLog, AuditLogWithActor } from "@/types/audit";

const AUDIT_COLUMNS =
  "id, actor_id, action, entity, entity_id, old_value, new_value, ip, user_agent, metadata, created_at";

async function withActors(
  rows: Array<any>,
  userIds: string[],
): Promise<AuditLogWithActor[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let actors: Record<string, { name: string; email: string }> = {};
  if (userIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);
    if (error) throw error;
    actors = Object.fromEntries((data ?? []).map((p) => [p.id, { name: p.name, email: p.email }]));
  }
  return rows.map((row) => ({
    ...(row as AuditLog),
    actor_name: row.actor_id ? (actors[row.actor_id as string]?.name ?? null) : null,
    actor_email: row.actor_id ? (actors[row.actor_id as string]?.email ?? null) : null,
  }));
}

const auditSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(15),
  search: z.string().optional(),
  action: z.string().optional(),
  actorId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const listAuditLogsAdminFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(auditSchema)
  .handler(async ({ context, data }) => {
    await requirePermission(context.userId, "audit.view");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    let query = supabaseAdmin
      .from("audit_logs")
      .select(AUDIT_COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data.action) query = query.eq("action", data.action);
    if (data.actorId) query = query.eq("actor_id", data.actorId);
    if (data.from) query = query.gte("created_at", data.from);
    if (data.to) query = query.lte("created_at", data.to);
    if (data.search) {
      const term = `%${data.search}%`;
      query = query.or(`entity.ilike.${term},entity_id.ilike.${term},action.ilike.${term}`);
    }

    const [listRes, recentRes, todayRes] = await Promise.all([
      query,
      supabaseAdmin
        .from("audit_logs")
        .select(AUDIT_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(6),
      supabaseAdmin
        .from("audit_logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);

    if (listRes.error) throw listRes.error;
    if (recentRes.error) throw recentRes.error;
    if (todayRes.error) throw todayRes.error;

    const rows = (listRes.data ?? []) as Array<any>;
    const recentRows = (recentRes.data ?? []) as Array<any>;
    const userIds = [
      ...new Set([
        ...rows.map((r) => r.actor_id as string | null).filter(Boolean),
        ...recentRows.map((r) => r.actor_id as string | null).filter(Boolean),
      ]),
    ] as string[];

    const [rowsWithActor, recentWithActor] = await Promise.all([
      withActors(rows, userIds),
      withActors(recentRows, userIds),
    ]);

    return {
      rows: rowsWithActor,
      total: listRes.count ?? 0,
      recent: recentWithActor,
      today: todayRes.count ?? 0,
    };
  });
