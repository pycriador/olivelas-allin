import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Profile, ProfileWithRole, RoleCode } from "@/types/profile";
import type { UpdateProfileInput } from "@/schemas/profile.schema";

const PROFILE_COLUMNS =
  "id, name, email, avatar_url, status, created_at, updated_at, last_login, role_id, plan_id";

export const profileService = {
  async getById(userId: string): Promise<ProfileWithRole | null> {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile?.role_id) return null;

    const { data: roleRow } = await supabase
      .from("roles")
      .select("code")
      .eq("id", profile.role_id)
      .maybeSingle();

    const role: AppRole = roleRow?.code === "GLOBAL_ADMIN" ? "GLOBAL_ADMIN" : "USER";

    return { ...(profile as unknown as Profile), role };
  },

  async getRoleCode(userId: string): Promise<RoleCode | null> {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role_id")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile?.role_id) return null;

    const { data: roleRow } = await supabase
      .from("roles")
      .select("code")
      .eq("id", profile.role_id)
      .maybeSingle();

    return (roleRow?.code ?? null) as RoleCode | null;
  },

  async update(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        name: input.name,
        avatar_url: input.avatar_url ? input.avatar_url : null,
      })
      .eq("id", userId)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) throw error;
    return data as unknown as Profile;
  },

  async touchLastLogin(userId: string): Promise<void> {
    await supabase
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", userId);
  },
};
