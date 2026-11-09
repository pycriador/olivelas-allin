import { supabase } from "@/integrations/supabase/client";
import type { AuditLog, Json } from "@/types";

export interface AuditEntry {
  workspaceId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export class AuditService {
  async list(workspaceId: string | null, limit = 50, offset = 0) {
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else {
      query = query.is("workspace_id", null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as AuditLog[];
  }

  async record(entry: AuditEntry) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { error } = await supabase.from("audit_logs").insert({
      workspace_id: entry.workspaceId ?? null,
      actor_id: user.user.id,
      actor_email: user.user.email ?? null,
      action: entry.action,
      entity: entry.entity ?? null,
      entity_id: entry.entityId ?? null,
      metadata: (entry.metadata ?? {}) as Json,
      ip_address: entry.ipAddress ?? null,
    });
    if (error) throw error;
  }
}

export const auditService = new AuditService();
