import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/shared/hooks/use-tenant-id";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface RuleRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  priority: number;
  enabled: boolean;
}

const WEIGHT_KEYS = [
  "weight_available",
  "weight_same_professional",
  "weight_lower_workload",
  "weight_preferred_period",
  "weight_almost_full",
  "weight_near_lunch",
  "weight_overbooking",
  "weight_conflict",
  "weight_specialty",
] as const;

const LIMIT_KEYS = [
  "min_minutes_between_appointments",
  "max_daily_minutes",
  "max_weekly_minutes",
  "max_daily_appointments",
  "overbooking_margin_minutes",
  "slot_granularity_minutes",
] as const;

type SettingsRow = Record<string, number | string>;

export function RulesPanel() {
  const { t } = useTranslation();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<SettingsRow>({});

  const rules = useQuery({
    queryKey: ["availability_rules", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_rules")
        .select("id, name, description, type, priority, enabled")
        .order("priority");
      if (error) throw error;
      return (data ?? []) as RuleRow[];
    },
  });

  const settings = useQuery({
    queryKey: ["availability_settings", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as SettingsRow | null;
    },
  });

  useEffect(() => {
    if (settings.data) setDraft(settings.data);
  }, [settings.data]);

  const toggleRule = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("availability_rules")
        .update({ enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("common.updated"));
      qc.invalidateQueries({ queryKey: ["availability_rules"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      const payload: Record<string, number> = {};
      for (const key of [...WEIGHT_KEYS, ...LIMIT_KEYS]) {
        payload[key] = Number(draft[key] ?? 0);
      }
      const { error } = await supabase
        .from("availability_settings")
        .update(payload as never)
        .eq("tenant_id", tenantId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("common.updated"));
      qc.invalidateQueries({ queryKey: ["availability_settings"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">{t("availability.rules.title")}</h3>
        <div className="space-y-1">
          {(rules.data ?? []).map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {t(`availability.ruleTypes.${r.type}`, r.name)}
                </p>
                {r.description && (
                  <p className="truncate text-xs text-muted-foreground">{r.description}</p>
                )}
              </div>
              <Switch
                checked={r.enabled}
                onCheckedChange={(enabled) => toggleRule.mutate({ id: r.id, enabled })}
              />
            </div>
          ))}
          {rules.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
          )}
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <h3 className="text-sm font-semibold">{t("availability.rules.weights")}</h3>
        <div className="grid grid-cols-2 gap-3">
          {WEIGHT_KEYS.map((k) => (
            <div key={k} className="space-y-1.5">
              <Label className="text-xs">{t(`availability.weights.${k}`, k)}</Label>
              <Input
                type="number"
                value={String(draft[k] ?? "")}
                onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold">{t("availability.rules.limits")}</h3>
        <div className="grid grid-cols-2 gap-3">
          {LIMIT_KEYS.map((k) => (
            <div key={k} className="space-y-1.5">
              <Label className="text-xs">{t(`availability.limits.${k}`, k)}</Label>
              <Input
                type="number"
                value={String(draft[k] ?? "")}
                onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>

        <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
          {t("common.save")}
        </Button>
      </Card>
    </div>
  );
}
