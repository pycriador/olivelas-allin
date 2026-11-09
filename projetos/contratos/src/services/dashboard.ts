import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  projects: number;
  executions: number;
  documents: number;
  users: number;
  connectors: number;
  alerts: number;
  auditLogs: number;
  pendingItems: number;
}

export class DashboardService {
  async getStats(workspaceId: string): Promise<DashboardStats> {
    const [projects, executions, documents, users, connectors, auditLogs, executionsByStatus] =
      await Promise.all([
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),
        supabase
          .from("executions")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),
        supabase
          .from("generated_documents")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),
        supabase
          .from("workspace_members")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "active"),
        supabase
          .from("connectors")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),
        supabase
          .from("audit_logs")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),
        supabase.from("executions").select("status").eq("workspace_id", workspaceId),
      ]);

    const failedExecutions =
      executionsByStatus.data?.filter((e) => e.status === "failed").length ?? 0;

    return {
      projects: projects.count ?? 0,
      executions: executions.count ?? 0,
      documents: documents.count ?? 0,
      users: users.count ?? 0,
      connectors: connectors.count ?? 0,
      alerts: failedExecutions,
      auditLogs: auditLogs.count ?? 0,
      pendingItems: failedExecutions,
    };
  }

  async getRecentExecutions(workspaceId: string, limit = 6) {
    const { data, error } = await supabase
      .from("executions")
      .select(
        `
        *,
        project:projects(name)
      `,
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async getRecentActivity(workspaceId: string, limit = 8) {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async getRecentDocuments(workspaceId: string, limit = 6) {
    const { data, error } = await supabase
      .from("generated_documents")
      .select(
        `
        *,
        project:projects(name),
        execution:executions(status)
      `,
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }
}

export const dashboardService = new DashboardService();
