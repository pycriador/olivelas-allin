import { supabase } from "@/lib/supabase";

export type AppRole = "global_admin" | "admin" | "editor" | "viewer";

export const userRolesService = {
  /** Reads the current user's roles from the database (RLS-scoped to self). */
  async listForCurrentUser(): Promise<AppRole[]> {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return [];
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);
    if (error) throw error;
    return ((data ?? []) as Array<{ role: AppRole }>).map((r) => r.role);
  },

  /** Server-verified admin check (never trust client metadata). */
  async isAdmin(): Promise<boolean> {
    const roles = await this.listForCurrentUser();
    return roles.includes("global_admin") || roles.includes("admin");
  },
};
