import { supabase } from "@/integrations/supabase/client";
import type { Participant, ParticipantWithStats } from "./types";

export interface PaginatedParticipants {
  items: ParticipantWithStats[];
  total: number;
  limit: number;
  offset: number;
}

export const ParticipantService = {
  async create(
    campaignId: string,
    data: { name: string; phone?: string; email?: string; document?: string; notes?: string },
  ): Promise<string> {
    const { data: result, error } = await supabase.rpc("create_participant" as never, {
      _campaign: campaignId,
      _name: data.name,
      _phone: data.phone ?? null,
      _email: data.email ?? null,
      _document: data.document ?? null,
      _notes: data.notes ?? null,
    } as never);
    if (error) throw error;
    return result as unknown as string;
  },

  async update(
    participantId: string,
    data: { name?: string; phone?: string; email?: string; document?: string; notes?: string },
  ): Promise<void> {
    const { error } = await supabase.rpc("update_participant" as never, {
      _participant: participantId,
      _name: data.name ?? null,
      _phone: data.phone ?? null,
      _email: data.email ?? null,
      _document: data.document ?? null,
      _notes: data.notes ?? null,
    } as never);
    if (error) throw error;
  },

  async list(
    campaignId: string,
    opts?: { search?: string; limit?: number; offset?: number },
  ): Promise<PaginatedParticipants> {
    const { data, error } = await supabase.rpc("list_participants" as never, {
      _campaign: campaignId,
      _search: opts?.search ?? null,
      _limit: opts?.limit ?? 50,
      _offset: opts?.offset ?? 0,
    } as never);
    if (error) throw error;
    return (data as unknown as PaginatedParticipants) ?? { items: [], total: 0, limit: 50, offset: 0 };
  },

  async history(participantId: string): Promise<{ participant: Participant; sales: unknown[] }> {
    const { data, error } = await supabase.rpc("get_participant_history" as never, {
      _participant: participantId,
    } as never);
    if (error) throw error;
    return data as unknown as { participant: Participant; sales: unknown[] };
  },

  async exportCsv(campaignId: string): Promise<string> {
    const { data, error } = await supabase.rpc("export_participants_csv" as never, {
      _campaign: campaignId,
    } as never);
    if (error) throw error;
    return (data as unknown as string) ?? "";
  },
};
