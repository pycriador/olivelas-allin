import { supabase } from "@/integrations/supabase/client";
import { auditService } from "@/services/audit.service";
import type { Setting, SettingValue } from "@/types/settings";

const COLUMNS = "id, category, key, value, description, is_public, created_at, updated_at";

export const settingsService = {
  async list(): Promise<Setting[]> {
    const { data, error } = await supabase
      .from("settings")
      .select(COLUMNS)
      .order("category", { ascending: true })
      .order("key", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as Setting[];
  },

  async updateMany(
    updates: { id: string; key: string; value: SettingValue }[],
    previous: Record<string, SettingValue>,
  ): Promise<void> {
    for (const update of updates) {
      const { error } = await supabase
        .from("settings")
        .update({ value: update.value as never })
        .eq("id", update.id);
      if (error) throw error;
    }

    if (updates.length > 0) {
      await auditService.log({
        action: "UPDATE",
        entity: "setting",
        entityId: updates.map((u) => u.key).join(","),
        oldValue: previous,
        newValue: Object.fromEntries(updates.map((u) => [u.key, u.value])),
      });
    }
  },
};

export function settingsToMap(settings: Setting[]): Record<string, SettingValue> {
  return Object.fromEntries(settings.map((s) => [`${s.category}.${s.key}`, s.value]));
}
