import { supabase } from "@/integrations/supabase/client";
import type { AuditAction, AuditLogWithActor } from "@/types/audit";

export interface AuditListParams {
  page: number;
  pageSize: number;
  search?: string;
  action?: string | undefined;
  actorId?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export interface AuditListResult {
  rows: AuditLogWithActor[];
  total: number;
}

export interface AuditEventInput {
  action: AuditAction;
  entity?: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}

const COLUMNS =
  "id, actor_id, action, entity, entity_id, old_value, new_value, ip, user_agent, metadata, created_at";

export const auditService = {
  /** Registra um evento de auditoria para o usuário autenticado. */
  async log(input: AuditEventInput): Promise<void> {
    const { data } = await supabase.auth.getUser();
    const actorId = data.user?.id;
    if (!actorId) return;

    const { error } = await supabase.from("audit_logs").insert({
      actor_id: actorId,
      action: input.action,
      entity: input.entity ?? null,
      entity_id: input.entityId ?? null,
      old_value: (input.oldValue ?? null) as never,
      new_value: (input.newValue ?? null) as never,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : null,
      metadata: (input.metadata ?? {}) as never,
    });

    if (error) console.error("[audit] falha ao registrar evento", error.message);
  },

  async list(params: AuditListParams): Promise<AuditListResult> {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;

    let query = supabase
      .from("audit_logs")
      .select(COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (params.action) query = query.eq("action", params.action);
    if (params.actorId) query = query.eq("actor_id", params.actorId);
    if (params.from) query = query.gte("created_at", params.from);
    if (params.to) query = query.lte("created_at", params.to);
    if (params.search) {
      const term = `%${params.search}%`;
      query = query.or(`entity.ilike.${term},entity_id.ilike.${term},action.ilike.${term}`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = (data ?? []) as unknown as AuditLogWithActor[];
    const actorIds = [...new Set(rows.map((row) => row.actor_id).filter(Boolean))] as string[];

    let actors: Record<string, { name: string; email: string }> = {};
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", actorIds);
      actors = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, { name: p.name, email: p.email }]),
      );
    }

    return {
      rows: rows.map((row) => ({
        ...row,
        actor_name: row.actor_id ? (actors[row.actor_id]?.name ?? null) : null,
        actor_email: row.actor_id ? (actors[row.actor_id]?.email ?? null) : null,
      })),
      total: count ?? 0,
    };
  },

  async recent(limit = 8): Promise<AuditLogWithActor[]> {
    const { rows } = await auditService.list({ page: 1, pageSize: limit });
    return rows;
  },

  async listForEntity(entity: string, entityId: string): Promise<AuditLogWithActor[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select(COLUMNS)
      .eq("entity", entity)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    const rows = (data ?? []) as unknown as AuditLogWithActor[];
    const actorIds = [...new Set(rows.map((row) => row.actor_id).filter(Boolean))] as string[];
    let actors: Record<string, { name: string; email: string }> = {};
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", actorIds);
      actors = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, { name: p.name, email: p.email }]),
      );
    }

    return rows.map((row) => ({
      ...row,
      actor_name: row.actor_id ? (actors[row.actor_id]?.name ?? null) : null,
      actor_email: row.actor_id ? (actors[row.actor_id]?.email ?? null) : null,
    }));
  },

  async countToday(): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { count, error } = await supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", start.toISOString());
    if (error) throw error;
    return count ?? 0;
  },
};
