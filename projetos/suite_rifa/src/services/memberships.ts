import { supabase } from "@/integrations/supabase/client";
import { rpcArgs } from "@/lib/rpc";

import type {
  Invitation,
  InvitationPreview,
  InvitationTicket,
  MemberListRow,
  MembershipStatus,
  OrgRole,
  Paginated,
} from "./types";

export interface MemberFilters {
  search?: string | undefined;
  role?: OrgRole | null;
  status?: MembershipStatus | null;
  limit?: number;
  offset?: number;
}

/** MembershipService — members and invitations. Every rule is enforced in the database. */
export const MembershipService = {
  /** Server-side search + pagination; requires `users.view`. */
  async listMembers(
    organizationId: string,
    filters: MemberFilters = {},
  ): Promise<Paginated<MemberListRow>> {
    const { data, error } = await supabase.rpc(
      "list_organization_members",
      rpcArgs<{ _org: string }>({
        _org: organizationId,
        _search: filters.search?.trim(),
        _role: filters.role,
        _status: filters.status,
        _limit: filters.limit ?? 20,
        _offset: filters.offset ?? 0,
      }),
    );
    if (error) throw error;
    const payload = data as unknown as { total: number; rows: MemberListRow[] };
    return { total: Number(payload?.total ?? 0), rows: payload?.rows ?? [] };
  },

  async listInvitations(organizationId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from("organization_invitations")
      .select(
        "id, organization_id, email, role, status, message, expires_at, accepted_at, last_sent_at, resend_count, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Invitation[];
  },

  /** Returns the one-time invitation link data; only the token hash is stored. */
  async invite(
    organizationId: string,
    email: string,
    role: OrgRole,
    message?: string | undefined,
  ): Promise<InvitationTicket> {
    const { data, error } = await supabase.rpc(
      "invite_member",
      rpcArgs<{ _org: string; _email: string }>({
        _org: organizationId,
        _email: email,
        _role: role,
        _message: message?.trim(),
      }),
    );
    if (error) throw error;
    return data as unknown as InvitationTicket;
  },

  async resendInvitation(invitationId: string): Promise<InvitationTicket> {
    const { data, error } = await supabase.rpc("resend_invitation", {
      _invitation_id: invitationId,
    });
    if (error) throw error;
    return data as unknown as InvitationTicket;
  },

  async revokeInvitation(invitationId: string) {
    const { error } = await supabase.rpc("revoke_invitation", { _invitation_id: invitationId });
    if (error) throw error;
  },

  async previewInvitation(token: string): Promise<InvitationPreview> {
    const { data, error } = await supabase.rpc("preview_invitation", { _token: token });
    if (error) throw error;
    return data as unknown as InvitationPreview;
  },

  async acceptInvitation(token: string): Promise<string> {
    const { data, error } = await supabase.rpc("accept_invitation", { _token: token });
    if (error) throw error;
    return data as string;
  },

  async changeRole(membershipId: string, role: OrgRole) {
    const { error } = await supabase.rpc("change_member_role", {
      _membership_id: membershipId,
      _role: role,
    });
    if (error) throw error;
  },

  async setStatus(membershipId: string, status: Extract<MembershipStatus, "ACTIVE" | "SUSPENDED">) {
    const { error } = await supabase.rpc("set_member_status", {
      _membership_id: membershipId,
      _status: status,
    });
    if (error) throw error;
  },

  async remove(membershipId: string) {
    const { error } = await supabase.rpc("remove_member", { _membership_id: membershipId });
    if (error) throw error;
  },

  /** Requires typing the organization name as confirmation; validated in the database. */
  async transferOwnership(membershipId: string, confirmation: string) {
    const { error } = await supabase.rpc("transfer_ownership", {
      _membership_id: membershipId,
      _confirmation: confirmation,
    });
    if (error) throw error;
  },

  /** Builds the shareable invitation link for the one-time token. */
  inviteLink(token: string): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/invite/${token}`;
  },
};
