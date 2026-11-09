import { supabase } from "@/integrations/supabase/client";
import { auditService } from "@/services/audit.service";
import type { CurrentUser, Plan, PlanCode, Role, RoleCode, UserStatus } from "@/types/profile";

async function fetchRoleByCode(code: string): Promise<Role | null> {
  const { data, error } = await supabase.from("roles").select("*").eq("code", code).maybeSingle();
  if (error) {
    console.error("[iam] fetchRoleByCode error", error.message);
    return null;
  }
  return data as Role | null;
}

async function fetchPlanByCode(code: string): Promise<Plan | null> {
  const { data, error } = await supabase.from("plans").select("*").eq("code", code).maybeSingle();
  if (error) {
    console.error("[iam] fetchPlanByCode error", error.message);
    return null;
  }
  return data as Plan | null;
}

async function fetchPlanById(id: string): Promise<Plan | null> {
  const { data, error } = await supabase.from("plans").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[iam] fetchPlanById error", error.message);
    return null;
  }
  return data as Plan | null;
}

export const iamService = {
  async getCurrentUser(userId: string): Promise<CurrentUser | null> {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, name, email, avatar_url, status, role_id, plan_id")
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      console.error("[iam] getCurrentUser error", error.message);
      return null;
    }
    if (!profile) return null;

    let roleCode: string | null = null;
    if (profile.role_id) {
      const { data: role } = await supabase
        .from("roles")
        .select("code")
        .eq("id", profile.role_id)
        .maybeSingle();
      roleCode = role?.code ?? null;
    }

    const plan = profile.plan_id ? await fetchPlanById(profile.plan_id) : null;

    return {
      id: profile.id,
      authUserId: profile.id,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      role: (roleCode ?? "PUBLISHER") as RoleCode,
      roleId: profile.role_id ?? "",
      plan: (plan?.code ?? null) as PlanCode | null,
      planId: profile.plan_id ?? null,
      planDetails: plan,
      status: (profile.status ?? "ACTIVE") as UserStatus,
      isActive: profile.status === "ACTIVE",
    };
  },

  async getRole(code: RoleCode): Promise<Role | null> {
    return fetchRoleByCode(code);
  },

  async getPlan(code: PlanCode): Promise<Plan | null> {
    return fetchPlanByCode(code);
  },

  async setRole(userId: string, roleCode: RoleCode, actorId?: string): Promise<{ error?: string }> {
    const role = await fetchRoleByCode(roleCode);
    if (!role) return { error: `Role "${roleCode}" not found` };

    const { error } = await supabase.from("profiles").update({ role_id: role.id }).eq("id", userId);

    if (error) return { error: error.message };

    if (actorId) {
      await auditService.log({
        action: "ROLE_CHANGE",
        entity: "profile",
        entityId: userId,
        newValue: { role: roleCode },
      });
    }

    return {};
  },

  async setPlan(
    userId: string,
    planCode: PlanCode | null,
    actorId?: string,
  ): Promise<{ error?: string }> {
    const planId = planCode ? ((await fetchPlanByCode(planCode))?.id ?? null) : null;
    const { error } = await supabase.from("profiles").update({ plan_id: planId }).eq("id", userId);

    if (error) return { error: error.message };

    if (actorId) {
      await auditService.log({
        action: "PLAN_CHANGE",
        entity: "profile",
        entityId: userId,
        newValue: { plan: planCode },
      });
    }

    return {};
  },

  async setStatus(
    userId: string,
    status: UserStatus,
    actorId?: string,
  ): Promise<{ error?: string }> {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
    if (error) return { error: error.message };

    if (actorId) {
      await auditService.log({
        action: "STATUS_CHANGE",
        entity: "profile",
        entityId: userId,
        newValue: { status },
      });
    }

    return {};
  },

  /** Retorna mapa roleCode -> [permission, ...] carregado do banco. */
  async listRolePermissions(): Promise<Record<string, string[]>> {
    const [{ data: roles, error: rolesErr }, { data: perms, error: permsErr }] = await Promise.all([
      supabase.from("roles").select("id, code"),
      supabase.from("role_permissions").select("role_id, permission"),
    ]);
    if (rolesErr) throw rolesErr;
    if (permsErr) throw permsErr;

    const roleMap = new Map<string, string>();
    for (const r of roles ?? []) roleMap.set(r.id, r.code);

    const result: Record<string, string[]> = {};
    for (const rp of perms ?? []) {
      const code = roleMap.get(rp.role_id);
      if (!code) continue;
      (result[code] ??= []).push(rp.permission);
    }
    return result;
  },

  /** Concede ou revoga uma permissao para uma role. */
  async setPermission(
    roleCode: RoleCode,
    permission: string,
    granted: boolean,
  ): Promise<{ error?: string }> {
    const { data: role } = await supabase
      .from("roles")
      .select("id")
      .eq("code", roleCode)
      .maybeSingle();
    if (!role) return { error: `Role "${roleCode}" not found` };

    if (granted) {
      const { error } = await supabase
        .from("role_permissions")
        .upsert({ role_id: role.id, permission });
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", role.id)
        .eq("permission", permission);
      if (error) return { error: error.message };
    }

    await auditService.log({
      action: "UPDATE",
      entity: "role_permissions",
      entityId: role.id,
      oldValue: { permission, granted: !granted },
      newValue: { permission, granted },
    });

    return {};
  },
};
