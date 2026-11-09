import { supabase } from "@/lib/supabase";

export type AuditResult = "success" | "failure" | "info";

export interface AuditPayload {
  action: string;
  result?: AuditResult;
  resource?: string;
  companyId?: string | null;
  metadata?: Record<string, unknown>;
}

/** A single field-level change captured for compliance ("o que alterou"). */
export interface AuditChange {
  field: string;
  from: unknown;
  to: unknown;
}

const DIFF_IGNORED_KEYS = new Set(["updatedAt", "updated_at"]);

/**
 * Computes field-level differences between two record snapshots.
 * Values are compared via JSON serialization so nested objects/arrays work.
 */
export function diffChanges(before: unknown, after: unknown): AuditChange[] {
  if (!before || !after || typeof before !== "object" || typeof after !== "object") return [];
  const b = before as Record<string, unknown>;
  const a = after as Record<string, unknown>;
  const changes: AuditChange[] = [];
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  for (const key of keys) {
    if (DIFF_IGNORED_KEYS.has(key)) continue;
    if (JSON.stringify(b[key] ?? null) !== JSON.stringify(a[key] ?? null)) {
      changes.push({ field: key, from: b[key] ?? null, to: a[key] ?? null });
    }
  }
  return changes;
}

/**
 * Fire-and-forget audit log insertion. Never throws.
 */
export async function audit(payload: AuditPayload): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id ?? null;
    await supabase.from("audit_log").insert({
      user_id: userId,
      company_id: payload.companyId ?? null,
      action: payload.action,
      resource: payload.resource ?? null,
      result: payload.result ?? "success",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      metadata: payload.metadata ?? {},
    });
  } catch {
    /* swallow — audit is best-effort */
  }
}

export interface AdminAuditInput {
  /** Dot-namespaced action, e.g. "admin.users.update". */
  action: string;
  /** Resource/entity being changed, e.g. "admin_users". */
  resource: string;
  recordId?: string;
  description?: string;
  /** Snapshot before the change (for update/delete). */
  before?: unknown;
  /** Snapshot after the change (for create/update). */
  after?: unknown;
  result?: AuditResult;
}

const COMPANY_STORAGE_KEY = "sf.currentCompanyId";

/**
 * Audit trail for administrative actions: who did it (user id, name, email),
 * when (server timestamp), and what changed (field-level diff in metadata).
 * Fire-and-forget — never throws and never blocks the mutation.
 */
export async function auditAdmin(input: AdminAuditInput): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    let userName: string = user.email ?? user.id;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.name) userName = profile.name;
    } catch {
      /* profile lookup is best-effort */
    }

    const companyId =
      typeof window !== "undefined" ? window.localStorage.getItem(COMPANY_STORAGE_KEY) : null;

    const changes =
      input.before !== undefined || input.after !== undefined
        ? diffChanges(input.before, input.after)
        : [];

    await supabase.from("audit_log").insert({
      user_id: user.id,
      company_id: companyId,
      action: input.action,
      resource: input.resource,
      result: input.result ?? "success",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      metadata: {
        user_name: userName,
        user_email: user.email ?? null,
        record_id: input.recordId ?? null,
        description: input.description ?? null,
        changes,
      },
    });
  } catch {
    /* swallow — audit is best-effort */
  }
}

export interface CloudAuditEntry {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  companyId: string | null;
  action: string;
  resource: string | null;
  result: string;
  userAgent: string | null;
  description: string;
  changes: AuditChange[];
  createdAt: string;
}

/**
 * Reads the cloud audit trail (newest first) for the admin audit screen.
 */
export async function listCloudAuditLogs(limit = 500): Promise<CloudAuditEntry[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, user_id, company_id, action, resource, result, user_agent, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      userId: row.user_id,
      userName:
        (meta.user_name as string) ?? (meta.email as string) ?? (row.user_id ? "Usuário" : "Sistema"),
      userEmail: (meta.user_email as string) ?? (meta.email as string) ?? null,
      companyId: row.company_id,
      action: row.action,
      resource: row.resource,
      result: row.result ?? "success",
      userAgent: row.user_agent,
      description: (meta.description as string) ?? "",
      changes: Array.isArray(meta.changes) ? (meta.changes as AuditChange[]) : [],
      createdAt: row.created_at,
    };
  });
}
