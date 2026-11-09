import { supabase } from "@/integrations/supabase/client";
import { auditService } from "@/services/audit.service";
import type { AppRole, Profile, ProfileStatus, ProfileWithRole, RoleCode } from "@/types/profile";

const COLUMNS =
  "id, name, email, avatar_url, status, created_at, updated_at, last_login, deleted_at, role_id, plan_id";

export type UserSortField = "name" | "email" | "created_at" | "last_login" | "status";

export interface UserListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: ProfileStatus | undefined;
  role?: RoleCode | "USER" | undefined;
  sortBy: UserSortField;
  sortDir: "asc" | "desc";
  includeDeleted?: boolean;
}

export interface UserListResult {
  rows: ProfileWithRole[];
  total: number;
}

async function rolesFor(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};

  const { data: profilesWithRoles, error } = await supabase
    .from("profiles")
    .select("id, role_id")
    .in("id", ids);

  if (error) throw error;

  const roleIds = [
    ...new Set((profilesWithRoles ?? []).map((p) => p.role_id).filter(Boolean)),
  ] as string[];

  if (roleIds.length === 0) return {};

  const { data: roles } = await supabase.from("roles").select("id, code").in("id", roleIds);

  const roleMap = new Map<string, string>();
  for (const r of roles ?? []) {
    roleMap.set(r.id, r.code);
  }

  const map: Record<string, string> = {};
  for (const row of profilesWithRoles ?? []) {
    const code = row.role_id ? (roleMap.get(row.role_id) ?? "USER") : "USER";
    map[row.id] = code;
  }
  return map;
}

export const userService = {
  async list(params: UserListParams): Promise<UserListResult> {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;

    let query = supabase
      .from("profiles")
      .select(COLUMNS, { count: "exact" })
      .order(params.sortBy, { ascending: params.sortDir === "asc", nullsFirst: false })
      .range(from, to);

    if (!params.includeDeleted) query = query.is("deleted_at", null);
    if (params.status) query = query.eq("status", params.status);
    if (params.search) {
      const term = `%${params.search}%`;
      query = query.or(`name.ilike.${term},email.ilike.${term}`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const profiles = (data ?? []) as unknown as Profile[];
    const roleMap = await rolesFor(profiles.map((p) => p.id));
    let rows: ProfileWithRole[] = profiles.map((profile): ProfileWithRole => ({
      ...profile,
      role: (roleMap[profile.id] ?? "USER") as AppRole,
    }));

    if (params.role) {
      rows = rows.filter((row) => row.role === params.role);
    }

    return { rows, total: count ?? 0 };
  },

  async update(
    userId: string,
    input: { name: string; avatar_url: string | null },
    previous?: Pick<Profile, "name" | "avatar_url">,
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update({ name: input.name, avatar_url: input.avatar_url })
      .eq("id", userId)
      .select(COLUMNS)
      .single();
    if (error) throw error;

    await auditService.log({
      action: "UPDATE",
      entity: "profile",
      entityId: userId,
      oldValue: previous ?? null,
      newValue: input,
    });
    return data as unknown as Profile;
  },

  async setStatus(userId: string, status: ProfileStatus): Promise<void> {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
    if (error) throw error;
    await auditService.log({
      action: "STATUS_CHANGE",
      entity: "profile",
      entityId: userId,
      newValue: { status },
    });
  },

  async setRole(userId: string, roleCode: string): Promise<void> {
    const { data: role } = await supabase
      .from("roles")
      .select("id")
      .eq("code", roleCode)
      .maybeSingle();

    if (!role) throw new Error(`Role "${roleCode}" not found`);

    const { error } = await supabase.from("profiles").update({ role_id: role.id }).eq("id", userId);
    if (error) throw error;

    await auditService.log({
      action: "ROLE_CHANGE",
      entity: "profile",
      entityId: userId,
      newValue: { role: roleCode },
    });
  },

  async softDelete(userId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ deleted_at: new Date().toISOString(), status: "DISABLED" })
      .eq("id", userId);
    if (error) throw error;
    await auditService.log({ action: "DELETE", entity: "profile", entityId: userId });
  },

  async restore(userId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ deleted_at: null, status: "ACTIVE" })
      .eq("id", userId);
    if (error) throw error;
    await auditService.log({
      action: "UPDATE",
      entity: "profile",
      entityId: userId,
      newValue: { restored: true },
    });
  },

  async counts(): Promise<{ active: number; disabled: number; deleted: number }> {
    const [active, disabled, deleted] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "ACTIVE")
        .is("deleted_at", null),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "DISABLED")
        .is("deleted_at", null),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .not("deleted_at", "is", null),
    ]);

    return {
      active: active.count ?? 0,
      disabled: disabled.count ?? 0,
      deleted: deleted.count ?? 0,
    };
  },

  async recentLogins(limit = 5): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select(COLUMNS)
      .is("deleted_at", null)
      .not("last_login", "is", null)
      .order("last_login", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as Profile[];
  },

  async growthByMonth(): Promise<{ label: string; value: number }[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;

    const buckets = new Map<string, number>();
    const formatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
    for (const row of data ?? []) {
      const date = new Date(row.created_at);
      const label = formatter.format(date);
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    }

    let running = 0;
    return [...buckets.entries()].map(([label, value]) => {
      running += value;
      return { label, value: running };
    });
  },
};
