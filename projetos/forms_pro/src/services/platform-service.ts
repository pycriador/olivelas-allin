import { supabase } from "@/integrations/supabase/client";
import type { AppNotification, AuditLog } from "@/types/platform";

export const auditApi = {
  async log(input: {
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const meta = (auth.user.user_metadata ?? {}) as Record<string, unknown>;
    await supabase.from("audit_logs").insert({
      user_id: auth.user.id,
      actor_name:
        (typeof meta["name"] === "string" ? meta["name"] : auth.user.email) ?? "",
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: (input.metadata ?? {}) as never,
    });
  },

  async list(limit = 200): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      userId: (r.user_id as string | null) ?? null,
      actorName: r.actor_name as string,
      action: r.action as string,
      entityType: r.entity_type as string,
      entityId: (r.entity_id as string | null) ?? null,
      metadata: (r.metadata as Record<string, unknown>) ?? {},
      createdAt: r.created_at as string,
    }));
  },
};

export const notificationsApi = {
  async list(): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return (data ?? []).map((n) => ({
      id: n.id as string,
      title: n.title as string,
      body: n.body as string,
      kind: n.kind as string,
      entityType: (n.entity_type as string | null) ?? null,
      entityId: (n.entity_id as string | null) ?? null,
      readAt: (n.read_at as string | null) ?? null,
      createdAt: n.created_at as string,
    }));
  },

  async push(input: {
    title: string;
    body?: string;
    kind?: string;
    entityType?: string;
    entityId?: string;
  }) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from("notifications").insert({
      user_id: auth.user.id,
      title: input.title,
      body: input.body ?? "",
      kind: input.kind ?? "info",
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    });
  },

  async markAllRead() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", auth.user.id)
      .is("read_at", null);
  },
};
