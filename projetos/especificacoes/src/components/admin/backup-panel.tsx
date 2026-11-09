import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload, HeartPulse, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { backupService } from "@/services/backup.service";
import { useHealthCheck, useLastBackup, useStorageEstimate } from "@/hooks/iam";

function mb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function BackupPanel() {
  const storage = useStorageEstimate();
  const lastBackup = useLastBackup();
  const health = useHealthCheck();
  const fileRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState("");
  const [incremental, setIncremental] = useState(false);
  const [importPassword, setImportPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const doExport = async () => {
    setBusy(true);
    try {
      const blob = await backupService.exportEncrypted(password, incremental);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `specforge-${new Date().toISOString().slice(0, 10)}.specforge`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Encrypted backup exported");
      await lastBackup.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  };

  const doImport = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const { restored } = await backupService.importEncrypted(text, importPassword);
      toast.success(`Restored ${restored} records — reloading`);
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4" /> Encrypted export</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Master password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min. 8 characters" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={incremental} onCheckedChange={setIncremental} id="incremental" />
            <Label htmlFor="incremental" className="text-sm font-normal">Incremental (only changes since last backup)</Label>
          </div>
          <Button onClick={doExport} disabled={busy || password.length < 8} className="gap-1">
            <Download className="h-4 w-4" /> Export .specforge
          </Button>
          <p className="text-xs text-muted-foreground">
            Last backup: {lastBackup.data ? new Date(lastBackup.data).toLocaleString() : "never"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" /> Restore</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Master password of the file</Label>
            <Input type="password" value={importPassword} onChange={(e) => setImportPassword(e.target.value)} />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".specforge,application/octet-stream,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void doImport(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            className="gap-1"
            disabled={busy || importPassword.length < 8}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" /> Choose .specforge file
          </Button>
          <p className="text-xs text-muted-foreground">Records are merged by id; the page reloads afterwards.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><HeartPulse className="h-4 w-4" /> Integrity</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            disabled={health.isPending}
            onClick={() =>
              health.mutate(undefined, {
                onSuccess: (r) =>
                  r.ok ? toast.success("Database healthy") : toast.error(`${r.issues.length} issue(s) found`),
                onError: (e) => toast.error(e instanceof Error ? e.message : "Health check failed"),
              })
            }
          >
            Run health check
          </Button>
          {health.data && (
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Duration: {health.data.durationMs} ms</p>
              {health.data.issues.length === 0 ? (
                <p className="text-emerald-500">No integrity issues found.</p>
              ) : (
                health.data.issues.map((i) => <p key={i} className="text-destructive">{i}</p>)
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-4 w-4" /> Local storage</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Used {mb(storage.data?.usage ?? 0)} of {mb(storage.data?.quota ?? 0)} available.
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{
                width: `${Math.min(100, ((storage.data?.usage ?? 0) / Math.max(1, storage.data?.quota ?? 1)) * 100)}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
