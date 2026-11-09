import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SettingsRow = Database["public"]["Tables"]["settings"]["Row"];
export type SettingsUpdate = Database["public"]["Tables"]["settings"]["Update"];

export const settingsRepo = {
  async get() {
    const { data, error } = await supabase.from("settings").select("*").limit(1).maybeSingle();
    if (error) throw error;
    return data;
  },
  async upsert(input: SettingsUpdate & { id?: string }) {
    const existing = await settingsRepo.get();
    if (existing) {
      const { data, error } = await supabase.from("settings").update(input).eq("id", existing.id).select().single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase
      .from("settings")
      .insert({ ...input, singleton: true })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
