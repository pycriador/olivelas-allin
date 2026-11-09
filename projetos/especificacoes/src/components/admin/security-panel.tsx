import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppSettings, useSaveSettings } from "@/hooks/iam";
import { ListSkeleton } from "@/components/common/skeletons";
import type { AppSettings } from "@/types/iam";

export function SecurityPanel() {
  const settings = useAppSettings();
  const save = useSaveSettings();

  if (settings.isLoading || !settings.data) return <ListSkeleton rows={4} />;
  const s = settings.data;

  const patch = (p: Partial<AppSettings>) =>
    save.mutate(p, {
      onSuccess: () => toast.success("Settings saved"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
    });

  const numbers: Array<{ key: keyof AppSettings; label: string; hint: string }> = [
    { key: "sessionMinutes", label: "Session timeout (minutes)", hint: "Idle sessions lock automatically." },
    { key: "maxFailedAttempts", label: "Max failed login attempts", hint: "Account locks for 15 minutes." },
    { key: "logRetentionDays", label: "Audit log retention (days)", hint: "Older entries can be purged." },
    { key: "autoBackupDays", label: "Auto backup reminder (days)", hint: "Interval between reminders." },
  ];

  const toggles: Array<{ key: keyof AppSettings; label: string }> = [
    { key: "autoBackup", label: "Remind me to back up" },
    { key: "singleSession", label: "Single active session per user" },
    { key: "reauthForCritical", label: "Require password for critical actions" },
  ];

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Security policy</CardTitle></CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          {numbers.map((n) => (
            <div key={n.key} className="space-y-1">
              <Label>{n.label}</Label>
              <Input
                type="number"
                min={1}
                defaultValue={s[n.key] as number}
                onBlur={(e) => patch({ [n.key]: Number(e.target.value) } as Partial<AppSettings>)}
              />
              <p className="text-xs text-muted-foreground">{n.hint}</p>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {toggles.map((t) => (
            <div key={t.key} className="flex items-center justify-between rounded-md border border-border p-3">
              <Label htmlFor={t.key} className="text-sm font-normal">{t.label}</Label>
              <Switch
                id={t.key}
                checked={s[t.key] as boolean}
                onCheckedChange={(v) => patch({ [t.key]: v } as Partial<AppSettings>)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
