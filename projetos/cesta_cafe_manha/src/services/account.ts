import { supabase } from "@/integrations/supabase/client";
import type { AccountMember, AppRole, Profile } from "@/types/domain";

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMyRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.role);
}

export async function fetchMembers(): Promise<AccountMember[]> {
  const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
  if (profilesError) throw profilesError;
  if (rolesError) throw rolesError;

  return (profiles ?? []).map((profile) => ({
    profile,
    roles: (roles ?? []).filter((row) => row.user_id === profile.id).map((row) => row.role),
  }));
}

export async function setMemberStatus(
  memberId: string,
  status: "aprovado" | "rejeitado",
  actorId: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      status,
      approved_by: actorId,
      approved_at: status === "aprovado" ? new Date().toISOString() : null,
    })
    .eq("id", memberId);
  if (error) throw error;
  await logActivity(
    actorId,
    status === "aprovado" ? "usuario_aprovado" : "usuario_rejeitado",
    memberId,
  );
}

export async function setMemberRole(
  memberId: string,
  role: AppRole,
  actorId: string,
): Promise<void> {
  const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", memberId);
  if (deleteError) throw deleteError;
  const { error: insertError } = await supabase
    .from("user_roles")
    .insert({ user_id: memberId, role });
  if (insertError) throw insertError;
  await logActivity(actorId, "funcao_usuario_alterada", memberId, { role });
}

export async function logActivity(
  userId: string,
  event: string,
  detail?: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await supabase.from("activity_logs").insert({
    user_id: userId,
    event,
    detail: detail ?? null,
    metadata: metadata as never,
  });
}
