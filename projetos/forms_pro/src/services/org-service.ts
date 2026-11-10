import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/types/forms";
import type {
  OrgInvitation,
  OrgLimits,
  OrgMember,
  OrgPermission,
  OrgRole,
  Organization,
} from "@/types/org";

function fail(message?: string): never {
  throw new Error(message ?? "Erro inesperado");
}

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  legal_name: string;
  status: "active" | "inactive";
  logo_url: string | null;
  plan: Organization["plan"];
  response_retention_days: number;
  audit_retention_days: number;
  created_at: string;
};

function mapOrg(row: OrgRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    legalName: row.legal_name,
    status: row.status,
    logoUrl: row.logo_url,
    plan: row.plan,
    responseRetentionDays: row.response_retention_days,
    auditRetentionDays: row.audit_retention_days,
    createdAt: row.created_at,
  };
}

async function uniqueSlug(base: string) {
  const root = slugify(base) || "organizacao";
  let slug = root;
  let i = 1;
  for (;;) {
    const { data } = await supabase.from("organizations").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    i += 1;
    slug = `${root}-${i}`;
  }
}

export const organizationsApi = {
  /** Organizations the signed-in user is an active member of. */
  async listMine(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at");
    if (error) fail(error.message);
    return ((data ?? []) as OrgRow[]).map(mapOrg);
  },

  async get(id: string): Promise<Organization | null> {
    const { data } = await supabase.from("organizations").select("*").eq("id", id).maybeSingle();
    return data ? mapOrg(data as OrgRow) : null;
  },

  async create(input: { name: string; legalName?: string }): Promise<Organization> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) fail("Sessão expirada");
    const slug = await uniqueSlug(input.name);
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: input.name,
        legal_name: input.legalName ?? input.name,
        slug,
        created_by: auth.user.id,
      })
      .select("*")
      .single();
    if (error) fail(error.message);
    const org = mapOrg(data as OrgRow);
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({ organization_id: org.id, user_id: auth.user.id, role: "owner" });
    if (memberError) fail(memberError.message);
    await supabase.from("organization_limits").insert({ organization_id: org.id });
    return org;
  },

  async update(id: string, patch: Partial<Organization>): Promise<Organization> {
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update["name"] = patch.name;
    if (patch.legalName !== undefined) update["legal_name"] = patch.legalName;
    if (patch.logoUrl !== undefined) update["logo_url"] = patch.logoUrl;
    if (patch.status !== undefined) update["status"] = patch.status;
    if (patch.plan !== undefined) update["plan"] = patch.plan;
    if (patch.responseRetentionDays !== undefined)
      update["response_retention_days"] = patch.responseRetentionDays;
    if (patch.auditRetentionDays !== undefined)
      update["audit_retention_days"] = patch.auditRetentionDays;
    const { data, error } = await supabase
      .from("organizations")
      .update(update as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error.message);
    return mapOrg(data as OrgRow);
  },

  async permissions(organizationId: string): Promise<OrgPermission[]> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];
    const { data: member } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (!member) return [];
    const { data: perms } = await supabase
      .from("org_role_permissions")
      .select("permission")
      .eq("role", member.role);
    return (perms ?? []).map((p) => p.permission as OrgPermission);
  },

  async myRole(organizationId: string): Promise<OrgRole | null> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    return (data?.role as OrgRole) ?? null;
  },

  async rolePermissionMatrix(): Promise<Record<OrgRole, OrgPermission[]>> {
    const { data } = await supabase.from("org_role_permissions").select("role, permission");
    const matrix = { owner: [], admin: [], manager: [], editor: [], viewer: [] } as Record<
      OrgRole,
      OrgPermission[]
    >;
    for (const row of data ?? []) {
      matrix[row.role as OrgRole].push(row.permission as OrgPermission);
    }
    return matrix;
  },
};

export const membersApi = {
  async list(organizationId: string): Promise<OrgMember[]> {
    const { data, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .order("joined_at");
    if (error) fail(error.message);
    const rows = data ?? [];
    const ids = rows.map((r) => r.user_id);
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id, name, email, avatar_url").in("id", ids)
      : { data: [] as { id: string; name: string; email: string; avatar_url: string | null }[] };
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return rows.map((r) => {
      const p = byId.get(r.user_id);
      return {
        id: r.id,
        organizationId: r.organization_id,
        userId: r.user_id,
        role: r.role as OrgRole,
        status: r.status as OrgMember["status"],
        joinedAt: r.joined_at,
        name: p?.name ?? "—",
        email: p?.email ?? "",
        avatarUrl: p?.avatar_url ?? null,
      };
    });
  },

  async setRole(memberId: string, role: OrgRole) {
    const { error } = await supabase
      .from("organization_members")
      .update({ role })
      .eq("id", memberId);
    if (error) fail(error.message);
  },

  async setStatus(memberId: string, status: OrgMember["status"]) {
    const { error } = await supabase
      .from("organization_members")
      .update({ status })
      .eq("id", memberId);
    if (error) fail(error.message);
  },

  async remove(memberId: string) {
    const { error } = await supabase.from("organization_members").delete().eq("id", memberId);
    if (error) fail(error.message);
  },
};

export const invitationsApi = {
  async list(organizationId: string): Promise<OrgInvitation[]> {
    const { data, error } = await supabase
      .from("organization_invitations")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error) fail(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      email: r.email,
      role: r.role as OrgRole,
      status: r.status as OrgInvitation["status"],
      token: r.token,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
    }));
  },

  async create(organizationId: string, email: string, role: OrgRole): Promise<OrgInvitation> {
    const { data: auth } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("organization_invitations")
      .insert({
        organization_id: organizationId,
        email: email.toLowerCase(),
        role,
        invited_by: auth.user?.id ?? null,
      })
      .select("*")
      .single();
    if (error) fail(error.message);
    return {
      id: data.id,
      organizationId: data.organization_id,
      email: data.email,
      role: data.role as OrgRole,
      status: data.status as OrgInvitation["status"],
      token: data.token,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
    };
  },

  async cancel(id: string) {
    const { error } = await supabase
      .from("organization_invitations")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) fail(error.message);
  },

  async resend(id: string) {
    const expires = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
    const { error } = await supabase
      .from("organization_invitations")
      .update({ status: "pending", expires_at: expires })
      .eq("id", id);
    if (error) fail(error.message);
  },

  /** Accepts an invitation for the signed-in user, creating the membership. */
  async accept(token: string): Promise<Organization> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) fail("Faça login para aceitar o convite");
    const { data: invite } = await supabase
      .from("organization_invitations")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (!invite) fail("Convite não encontrado");
    if (invite.status !== "pending") fail("Este convite não está mais disponível");
    if (new Date(invite.expires_at) < new Date()) {
      await supabase
        .from("organization_invitations")
        .update({ status: "expired" })
        .eq("id", invite.id);
      fail("Convite expirado");
    }
    if ((auth.user.email ?? "").toLowerCase() !== invite.email.toLowerCase()) {
      fail("Este convite foi enviado para outro e-mail");
    }
    const { error: memberError } = await supabase.from("organization_members").insert({
      organization_id: invite.organization_id,
      user_id: auth.user.id,
      role: invite.role,
    });
    if (memberError && !memberError.message.includes("duplicate")) fail(memberError.message);
    await supabase
      .from("organization_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id);
    const org = await organizationsApi.get(invite.organization_id);
    if (!org) fail("Organização indisponível");
    return org;
  },
};

export const limitsApi = {
  async get(organizationId: string): Promise<OrgLimits | null> {
    const { data } = await supabase
      .from("organization_limits")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (!data) return null;
    return {
      organizationId: data.organization_id,
      maxUsers: data.max_users,
      maxForms: data.max_forms,
      maxResponses: data.max_responses,
      maxStorageMb: data.max_storage_mb,
      maxApiCalls: data.max_api_calls,
      maxWebhooks: data.max_webhooks,
      maxAutomations: data.max_automations,
    };
  },

  async update(organizationId: string, patch: Partial<OrgLimits>) {
    const update: Record<string, unknown> = {};
    if (patch.maxUsers !== undefined) update["max_users"] = patch.maxUsers;
    if (patch.maxForms !== undefined) update["max_forms"] = patch.maxForms;
    if (patch.maxResponses !== undefined) update["max_responses"] = patch.maxResponses;
    if (patch.maxStorageMb !== undefined) update["max_storage_mb"] = patch.maxStorageMb;
    if (patch.maxApiCalls !== undefined) update["max_api_calls"] = patch.maxApiCalls;
    if (patch.maxWebhooks !== undefined) update["max_webhooks"] = patch.maxWebhooks;
    if (patch.maxAutomations !== undefined) update["max_automations"] = patch.maxAutomations;
    const { error } = await supabase
      .from("organization_limits")
      .upsert({ organization_id: organizationId, ...update } as never, {
        onConflict: "organization_id",
      });
    if (error) fail(error.message);
  },

  /** Current consumption used by limit gauges. */
  async usage(organizationId: string) {
    const [forms, responses, members, webhooks, automations, apiCalls] = await Promise.all([
      supabase
        .from("forms")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("form_responses")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("webhooks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("automation_rules")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("api_usage")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
    ]);
    return {
      forms: forms.count ?? 0,
      responses: responses.count ?? 0,
      users: members.count ?? 0,
      webhooks: webhooks.count ?? 0,
      automations: automations.count ?? 0,
      apiCalls: apiCalls.count ?? 0,
    };
  },
};
