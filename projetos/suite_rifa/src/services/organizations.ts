import { supabase } from "@/integrations/supabase/client";
import { rpcArgs } from "@/lib/rpc";

import type { AuditLog, AuditLogRow, Organization, OrgStatus, Paginated } from "./types";

export interface OrganizationInput {
  name: string;
  slug: string;
  legal_name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  primary_color: string;
  secondary_color: string;
  timezone: string;
  locale: string;
  currency: string;
  date_format: string;
}

/** OrganizationService — organization lifecycle. All rules enforced in the database. */
export const OrganizationService = {
  async create(input: { name: string; slug: string; email?: string; phone?: string }) {
    const args: { _name: string; _slug: string; _email?: string; _phone?: string } = {
      _name: input.name,
      _slug: input.slug,
    };
    if (input.email) args._email = input.email;
    if (input.phone) args._phone = input.phone;
    const { data, error } = await supabase.rpc("create_organization", args);
    if (error) throw error;
    return data as string;
  },

  async get(organizationId: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as Organization | null) ?? null;
  },

  async update(organizationId: string, patch: Partial<OrganizationInput>) {
    const { error } = await supabase.from("organizations").update(patch).eq("id", organizationId);
    if (error) throw error;
  },

  async setStatus(organizationId: string, status: OrgStatus) {
    const { error } = await supabase.rpc("set_organization_status", {
      _org: organizationId,
      _status: status,
    });
    if (error) throw error;
  },

  /** Owner-initiated suspension; reactivation is restricted to platform admins. */
  async suspendSelf(organizationId: string, confirmation: string) {
    const { error } = await supabase.rpc("suspend_own_organization", {
      _org: organizationId,
      _confirmation: confirmation,
    });
    if (error) throw error;
  },

  async listAll(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Organization[];
  },

  /** Uploads into the tenant-isolated folder `organizations/{id}/logo/...` and records the audit event. */
  async uploadLogo(organizationId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `organizations/${organizationId}/logo/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("org-assets").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) throw error;
    const { error: rpcError } = await supabase.rpc("set_organization_logo", {
      _org: organizationId,
      _path: path,
    });
    if (rpcError) throw rpcError;
    return path;
  },

  async removeLogo(organizationId: string, path: string | null) {
    // Empty path clears the logo (the database normalizes it to NULL).
    const { error } = await supabase.rpc("set_organization_logo", {
      _org: organizationId,
      _path: "",
    });
    if (error) throw error;
    if (path && !path.startsWith("http")) {
      await supabase.storage.from("org-assets").remove([path]);
    }
  },

  async signedLogoUrl(path: string | null): Promise<string | null> {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const { data, error } = await supabase.storage.from("org-assets").createSignedUrl(path, 3600);
    if (error) return null;
    return data?.signedUrl ?? null;
  },
};

export interface AuditFilters {
  action?: string | null;
  actor?: string | null;
  entity?: string | null;
  from?: string | null;
  to?: string | null;
  limit?: number;
  offset?: number;
}

export const AuditService = {
  /** Paginated, filterable audit trail. Requires `audit.view` (validated in the database). */
  async list(organizationId: string, filters: AuditFilters = {}): Promise<Paginated<AuditLogRow>> {
    const { data, error } = await supabase.rpc(
      "list_audit_logs",
      rpcArgs<{ _org: string }>({
        _org: organizationId,
        _action: filters.action,
        _actor: filters.actor,
        _entity: filters.entity,
        _from: filters.from,
        _to: filters.to,
        _limit: filters.limit ?? 25,
        _offset: filters.offset ?? 0,
      }),
    );
    if (error) throw error;
    const payload = data as unknown as { total: number; rows: AuditLogRow[] };
    return { total: Number(payload?.total ?? 0), rows: payload?.rows ?? [] };
  },

  async listForOrganization(organizationId: string, limit = 100): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as AuditLog[];
  },

  async listGlobal(limit = 200): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as AuditLog[];
  },
};

export const PlatformService = {
  async metrics() {
    const { data, error } = await supabase.rpc("platform_metrics");
    if (error) throw error;
    return data as unknown as Record<string, number>;
  },

  async listOrganizations(params: {
    search?: string | undefined;
    status?: string | null;
    limit?: number;
    offset?: number;
  } = {}) {
    const { data, error } = await supabase.rpc(
      "platform_list_organizations",
      rpcArgs<Record<string, never>>({
        _search: params.search?.trim(),
        _status: params.status,
        _limit: params.limit ?? 20,
        _offset: params.offset ?? 0,
      }),
    );
    if (error) throw error;
    const payload = data as unknown as { total: number; rows: PlatformOrganizationRow[] };
    return { total: Number(payload?.total ?? 0), rows: payload?.rows ?? [] };
  },

  async listUsers(params: { search?: string | undefined; limit?: number; offset?: number } = {}) {
    const { data, error } = await supabase.rpc(
      "platform_list_users",
      rpcArgs<Record<string, never>>({
        _search: params.search?.trim(),
        _limit: params.limit ?? 20,
        _offset: params.offset ?? 0,
      }),
    );
    if (error) throw error;
    const payload = data as unknown as { total: number; rows: PlatformUserRow[] };
    return { total: Number(payload?.total ?? 0), rows: payload?.rows ?? [] };
  },

  async organizationDetail(organizationId: string) {
    const { data, error } = await supabase.rpc("platform_organization_detail", {
      _org: organizationId,
    });
    if (error) throw error;
    return data as unknown as PlatformOrganizationDetail;
  },
};

export interface PlatformOrganizationRow {
  id: string;
  name: string;
  slug: string;
  status: OrgStatus;
  created_at: string;
  owner_name: string | null;
  owner_email: string | null;
  plan_name: string | null;
  users: number;
  campaigns: number;
}

export interface PlatformUserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  last_seen_at: string | null;
  is_global_admin: boolean;
  organizations: number;
}

export interface PlatformOrganizationDetail {
  organization: Organization;
  members: {
    id: string;
    role: string;
    status: string;
    full_name: string | null;
    email: string | null;
    created_at: string;
  }[];
  subscription: {
    status: string;
    billing_interval: string;
    current_period_end: string | null;
    trial_end: string | null;
    plan_name: string;
    plan_slug: string;
  } | null;
  usage: Record<string, number>;
  audit: {
    id: string;
    action: string;
    created_at: string;
    actor_name: string | null;
    metadata: Record<string, unknown>;
  }[];
}
