import { supabase } from "@/integrations/supabase/client";
import type {
  Profile,
  Workspace,
  WorkspaceMember,
  UserRole,
  Permission,
  Group,
  GroupMember,
  AppRole,
} from "@/types";

export class WorkspaceService {
  async listByUser(userId: string) {
    const { data: memberships, error: memError } = await supabase
      .from("workspace_members")
      .select(
        `
        *,
        workspace:workspaces(*)
      `,
      )
      .eq("user_id", userId)
      .order("is_default", { ascending: false });

    if (memError) throw memError;
    return memberships as (WorkspaceMember & { workspace: Workspace })[];
  }

  async getDefaultWorkspace(userId: string) {
    const memberships = await this.listByUser(userId);
    if (!memberships || memberships.length === 0) return null;

    const defaultMembership = memberships.find((m) => m.is_default) ?? memberships[0]!;
    return defaultMembership.workspace;
  }

  async getById(id: string) {
    const { data, error } = await supabase.from("workspaces").select("*").eq("id", id).single();
    if (error) throw error;
    return data as Workspace;
  }

  async update(id: string, payload: Partial<Workspace>) {
    const { data, error } = await supabase
      .from("workspaces")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Workspace;
  }
}

export class ProfileService {
  async getById(id: string) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (error) return null;
    return data as Profile;
  }

  async upsert(profile: Partial<Profile> & { id: string }) {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(profile as unknown as Profile)
      .select("*")
      .single();
    if (error) throw error;
    return data as Profile;
  }

  async update(id: string, payload: Partial<Profile>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Profile;
  }

  async listByWorkspace(workspaceId: string) {
    const { data: members, error } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId);
    if (error) throw error;

    const userIds = members.map((m) => m.user_id);
    if (userIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);
    if (profilesError) throw profilesError;

    const profilesById = new Map(profiles.map((p) => [p.id, p]));
    return members.map((m) => ({
      ...m,
      profile: profilesById.get(m.user_id) as Profile,
    })) as (WorkspaceMember & { profile: Profile })[];
  }
}

export class RoleService {
  async listByUser(userId: string) {
    const { data, error } = await supabase.from("user_roles").select("*").eq("user_id", userId);
    if (error) throw error;
    return data as UserRole[];
  }

  async listRolesForWorkspace(userId: string, workspaceId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId);
    if (error) throw error;
    return data as UserRole[];
  }

  async listAll(): Promise<AppRole[]> {
    const { data, error } = await supabase.from("user_roles").select("role");
    if (error) throw error;
    const unique = [...new Set(data.map((r) => r.role))];
    return unique as AppRole[];
  }

  async listPermissions(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .order("module")
      .order("key");
    if (error) throw error;
    return data as Permission[];
  }

  async assign(userId: string, role: AppRole, workspaceId: string | null) {
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role,
      workspace_id: workspaceId,
    });
    if (error) throw error;
  }

  async remove(id: string) {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) throw error;
  }
}

export class GroupService {
  async listByWorkspace(workspaceId: string | null) {
    let query = supabase.from("groups").select("*").order("name");
    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else {
      query = query.is("workspace_id", null);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data as Group[];
  }

  async listMembers(groupId: string) {
    const { data: members, error } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId);
    if (error) throw error;

    const userIds = members.map((m) => m.user_id);
    if (userIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);
    if (profilesError) throw profilesError;

    const profilesById = new Map(profiles.map((p) => [p.id, p]));
    return members.map((m) => ({
      ...m,
      profile: profilesById.get(m.user_id) as Profile,
    })) as (GroupMember & { profile: Profile })[];
  }
}

export const workspaceService = new WorkspaceService();
export const profileService = new ProfileService();
export const roleService = new RoleService();
export const groupService = new GroupService();
