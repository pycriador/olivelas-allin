import { supabase } from "@/integrations/supabase/client";
import type {
  AutomationExecution,
  AutomationRule,
  FeatureFlag,
  Integration,
  IntegrationProvider,
  SystemEvent,
} from "@/types/org";

function fail(message?: string): never {
  throw new Error(message ?? "Erro inesperado");
}

/** Extensible marketplace catalog — adapters are added without schema changes. */
export const INTEGRATION_CATALOG: IntegrationProvider[] = [
  { id: "slack", name: "Slack", category: "communication", description: "Notificações em canais e mensagens diretas.", available: false },
  { id: "microsoft_teams", name: "Microsoft Teams", category: "communication", description: "Cards adaptativos em canais do Teams.", available: false },
  { id: "google_sheets", name: "Google Sheets", category: "storage", description: "Envie cada resposta para uma planilha.", available: false },
  { id: "google_drive", name: "Google Drive", category: "storage", description: "Arquive anexos e exportações.", available: false },
  { id: "zapier", name: "Zapier", category: "automation", description: "Dispare zaps a partir de eventos da plataforma.", available: false },
  { id: "make", name: "Make", category: "automation", description: "Cenários automatizados com eventos e webhooks.", available: false },
];

export const integrationsApi = {
  async list(organizationId: string): Promise<Integration[]> {
    const { data, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("organization_id", organizationId);
    if (error) fail(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      provider: r.provider,
      category: r.category,
      status: r.status as Integration["status"],
      config: (r.config as Record<string, unknown>) ?? {},
      connectedAt: r.connected_at,
    }));
  },

  async connect(organizationId: string, provider: IntegrationProvider) {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("integrations").upsert(
      {
        organization_id: organizationId,
        provider: provider.id,
        category: provider.category,
        status: "connected",
        connected_by: auth.user?.id ?? null,
        connected_at: new Date().toISOString(),
        // Credentials live in the secret store; only a reference is persisted.
        secret_ref: `integration:${organizationId}:${provider.id}`,
        config: { mode: provider.available ? "live" : "simulation" } as never,
      } as never,
      { onConflict: "organization_id,provider" },
    );
    if (error) fail(error.message);
  },

  async disconnect(id: string) {
    const { error } = await supabase
      .from("integrations")
      .update({ status: "disconnected", connected_at: null })
      .eq("id", id);
    if (error) fail(error.message);
  },
};

export const automationsApi = {
  async list(organizationId: string): Promise<AutomationRule[]> {
    const { data, error } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error) fail(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      name: r.name,
      description: r.description,
      triggerType: r.trigger_type as AutomationRule["triggerType"],
      formId: r.form_id,
      conditions: (r.conditions as unknown as AutomationRule["conditions"]) ?? [],
      actions: (r.actions as unknown as AutomationRule["actions"]) ?? [],
      status: r.status as AutomationRule["status"],
      lastRunAt: r.last_run_at,
      runCount: r.run_count,
      createdAt: r.created_at,
    }));
  },

  async create(input: Omit<AutomationRule, "id" | "createdAt" | "lastRunAt" | "runCount">) {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("automation_rules").insert({
      organization_id: input.organizationId,
      name: input.name,
      description: input.description,
      trigger_type: input.triggerType,
      form_id: input.formId,
      conditions: input.conditions as never,
      actions: input.actions as never,
      status: input.status,
      created_by: auth.user?.id ?? null,
    });
    if (error) fail(error.message);
  },

  async setStatus(id: string, status: AutomationRule["status"]) {
    const { error } = await supabase.from("automation_rules").update({ status }).eq("id", id);
    if (error) fail(error.message);
  },

  async remove(id: string) {
    const { error } = await supabase.from("automation_rules").delete().eq("id", id);
    if (error) fail(error.message);
  },

  async executions(organizationId: string): Promise<AutomationExecution[]> {
    const { data } = await supabase
      .from("automation_executions")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []).map((r) => ({
      id: r.id,
      ruleId: r.rule_id,
      status: r.status as AutomationExecution["status"],
      triggerType: r.trigger_type,
      error: r.error,
      durationMs: r.duration_ms,
      createdAt: r.created_at,
    }));
  },
};

export const flagsApi = {
  async list(organizationId: string | null): Promise<FeatureFlag[]> {
    const { data, error } = await supabase.from("feature_flags").select("*").order("key");
    if (error) fail(error.message);
    return (data ?? [])
      .filter((r) => r.organization_id === null || r.organization_id === organizationId)
      .map((r) => ({
        id: r.id,
        key: r.key,
        description: r.description,
        enabled: r.enabled,
        organizationId: r.organization_id,
        userId: r.user_id,
      }));
  },

  /** Organization override wins over the global default. */
  resolve(flags: FeatureFlag[], key: string, organizationId: string | null): boolean {
    const scoped = flags.find((f) => f.key === key && f.organizationId === organizationId);
    if (scoped) return scoped.enabled;
    return flags.find((f) => f.key === key && f.organizationId === null)?.enabled ?? false;
  },

  async setOverride(key: string, organizationId: string, enabled: boolean) {
    const { error } = await supabase
      .from("feature_flags")
      .upsert(
        { key, organization_id: organizationId, enabled, description: "" } as never,
        { onConflict: "key,organization_id,user_id" },
      );
    if (error) fail(error.message);
  },
};

export const systemApi = {
  async events(organizationId: string): Promise<SystemEvent[]> {
    const { data } = await supabase
      .from("system_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? [])
      .filter((r) => r.organization_id === null || r.organization_id === organizationId)
      .map((r) => ({
        id: r.id,
        organizationId: r.organization_id,
        source: r.source,
        severity: r.severity as SystemEvent["severity"],
        message: r.message,
        createdAt: r.created_at,
      }));
  },

  async record(input: {
    organizationId: string | null;
    source: string;
    severity: SystemEvent["severity"];
    message: string;
    context?: Record<string, unknown>;
  }) {
    await supabase.from("system_events").insert({
      organization_id: input.organizationId,
      source: input.source,
      severity: input.severity,
      message: input.message,
      context: (input.context ?? {}) as never,
    });
  },
};
