import { supabase } from "@/integrations/supabase/client";
import { ROLE_PERMISSIONS, type Permission, type Role, type User } from "@/types/auth";

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status: "active" | "inactive";
  group_id: string | null;
  last_login: string | null;
  created_at: string;
}

export function mapProfile(row: ProfileRow, role: Role): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role,
    groupId: row.group_id,
    status: row.status,
    lastLoginAt: row.last_login,
    createdAt: row.created_at,
    avatarUrl: row.avatar_url,
  };
}

const ROLE_RANK: Role[] = ["admin", "manager", "user"];

export function pickRole(roles: { role: Role }[] | null | undefined): Role {
  const found = ROLE_RANK.find((r) => (roles ?? []).some((x) => x.role === r));
  return found ?? "user";
}

export async function fetchPermissions(role: Role): Promise<Permission[]> {
  const { data } = await supabase
    .from("role_permissions")
    .select("permission")
    .eq("role", role);
  const list = (data ?? []).map((r) => r.permission as Permission);
  return list.length ? list : ROLE_PERMISSIONS[role];
}

/** Loads (and bootstraps, when missing) the profile + role for the signed-in user. */
export async function loadSessionUser(): Promise<{
  user: User;
  permissions: Permission[];
} | null> {
  const { data: auth } = await supabase.auth.getUser();
  const authUser = auth.user;
  if (!authUser) return null;

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!profile) {
    const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const name =
      (typeof meta["name"] === "string" && meta["name"]) ||
      (typeof meta["full_name"] === "string" && meta["full_name"]) ||
      (authUser.email ?? "").split("@")[0] ||
      "Usuário";
    const { data: created, error } = await supabase
      .from("profiles")
      .upsert({
        id: authUser.id,
        name,
        email: authUser.email ?? "",
        avatar_url: typeof meta["avatar_url"] === "string" ? meta["avatar_url"] : null,
        last_login: new Date().toISOString(),
      }, { onConflict: "id", ignoreDuplicates: false })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    profile = created;
  } else {
    await supabase
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", authUser.id);
  }

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", authUser.id);

  const role = pickRole(roles as { role: Role }[] | null);
  const permissions = await fetchPermissions(role);
  return { user: mapProfile(profile as ProfileRow, role), permissions };
}

export const authService = {
  async signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  },
  async signUp(input: { name: string; email: string; password: string }) {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { name: input.name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw new Error(error.message);
  },
  async signOut() {
    await supabase.auth.signOut();
  },
  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  },
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },
};
