import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "global_admin" | "admin" | "user";
  avatarUrl?: string;
}

export function mapUser(u: User | null | undefined): AppUser | null {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email ?? "",
    name:
      (u.user_metadata?.full_name as string | undefined) ||
      (u.user_metadata?.name as string | undefined) ||
      u.email?.split("@")[0] ||
      "Usuário",
    role: ((u.user_metadata?.role as AppUser["role"]) || "user"),
    avatarUrl: u.user_metadata?.avatar_url as string | undefined,
  };
}

export const authService = {
  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  },
  async getUser(): Promise<AppUser | null> {
    const { data } = await supabase.auth.getUser();
    return mapUser(data.user);
  },
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return mapUser(data.user);
  },
  async register(name: string, email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return mapUser(data.user);
  },
  async loginGoogle() {
    const { lovable } = await import("@/integrations/lovable/index");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (result.error) throw result.error;
  },
  async logout() {
    await supabase.auth.signOut();
  },
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },
  async updateProfile(patch: { name?: string; avatarUrl?: string }) {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...(patch.name !== undefined ? { full_name: patch.name } : {}),
        ...(patch.avatarUrl !== undefined ? { avatar_url: patch.avatarUrl } : {}),
      },
    });
    if (error) throw error;
    return mapUser(data.user);
  },
  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  },
};
