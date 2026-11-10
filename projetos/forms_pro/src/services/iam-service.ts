import { supabase } from "@/integrations/supabase/client";
import { mapProfile, pickRole } from "./auth-service";
import type { Database } from "@/integrations/supabase/types";
import type { Group, Permission, Role, User } from "@/types/auth";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type GroupUpdate = Database["public"]["Tables"]["groups"]["Update"];

function fail(message: string | undefined): never {
  throw new Error(message ?? "Erro inesperado");
}

export const usersApi = {
  async list(): Promise<User[]> {
    const [{ data: profiles, error }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (error) fail(error.message);
    const byUser = new Map<string, { role: Role }[]>();
    for (const r of (roles ?? []) as { user_id: string; role: Role }[]) {
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), { role: r.role }]);
    }
    return (profiles ?? []).map((p) =>
      mapProfile(p as never, pickRole(byUser.get(p.id as string))),
    );
  },

  /** Creates a profile placeholder. Account credentials are created by the person on sign-up. */
  async create(input: Omit<User, "id" | "createdAt" | "lastLoginAt">): Promise<User> {
    throw new Error(
      "Novos acessos são criados pelo próprio usuário na tela de cadastro. Depois disso você pode editar o perfil, o grupo e a função aqui." +
        (input.email ? "" : ""),
    );
  },

  async update(id: string, patch: Partial<User>): Promise<User> {
    const update: ProfileUpdate = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.email !== undefined) update.email = patch.email;
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.groupId !== undefined) update.group_id = patch.groupId;
    if (patch.avatarUrl !== undefined) update.avatar_url = patch.avatarUrl;

    if (Object.keys(update).length) {
      const { error } = await supabase.from("profiles").update(update).eq("id", id);
      if (error) fail(error.message);
    }

    if (patch.role) {
      await supabase.from("user_roles").delete().eq("user_id", id);
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: id, role: patch.role });
      if (error) fail(error.message);
    }

    const { data: profile, error: readErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (readErr) fail(readErr.message);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", id);
    return mapProfile(profile as never, pickRole(roles as { role: Role }[]));
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) fail(error.message);
  },
};

interface GroupRow {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  created_at: string;
}

export const groupsApi = {
  async list(): Promise<Group[]> {
    const [{ data: rows, error }, { data: members }, { data: perms }] = await Promise.all([
      supabase.from("groups").select("*").order("created_at"),
      supabase.from("profiles").select("id, group_id"),
      supabase.from("group_permissions").select("group_id, permission"),
    ]);
    if (error) fail(error.message);
    return ((rows ?? []) as GroupRow[]).map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      status: g.status,
      createdAt: g.created_at,
      memberIds: (members ?? [])
        .filter((m) => (m as { group_id: string | null }).group_id === g.id)
        .map((m) => (m as { id: string }).id),
      permissions: (perms ?? [])
        .filter((p) => (p as { group_id: string }).group_id === g.id)
        .map((p) => (p as { permission: Permission }).permission),
    }));
  },

  async create(input: Omit<Group, "id" | "createdAt">): Promise<Group> {
    const { data, error } = await supabase
      .from("groups")
      .insert({ name: input.name, description: input.description, status: input.status })
      .select("*")
      .single();
    if (error) fail(error.message);
    const row = data as GroupRow;
    await groupsApi.syncPermissions(row.id, input.permissions ?? []);
    await groupsApi.syncMembers(row.id, input.memberIds ?? []);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      memberIds: input.memberIds ?? [],
      permissions: input.permissions ?? [],
    };
  },

  async syncPermissions(groupId: string, permissions: Permission[]) {
    await supabase.from("group_permissions").delete().eq("group_id", groupId);
    if (permissions.length) {
      await supabase
        .from("group_permissions")
        .insert(permissions.map((permission) => ({ group_id: groupId, permission })));
    }
  },

  async syncMembers(groupId: string, memberIds: string[]) {
    await supabase.from("profiles").update({ group_id: null }).eq("group_id", groupId);
    if (memberIds.length) {
      await supabase.from("profiles").update({ group_id: groupId }).in("id", memberIds);
    }
  },

  async update(id: string, patch: Partial<Group>): Promise<Group> {
    const update: GroupUpdate = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.description !== undefined) update.description = patch.description;
    if (patch.status !== undefined) update.status = patch.status;
    if (Object.keys(update).length) {
      const { error } = await supabase.from("groups").update(update).eq("id", id);
      if (error) fail(error.message);
    }
    if (patch.permissions) await groupsApi.syncPermissions(id, patch.permissions);
    if (patch.memberIds) await groupsApi.syncMembers(id, patch.memberIds);
    const all = await groupsApi.list();
    const found = all.find((g) => g.id === id);
    if (!found) fail("Grupo não encontrado");
    return found;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) fail(error.message);
  },
};
