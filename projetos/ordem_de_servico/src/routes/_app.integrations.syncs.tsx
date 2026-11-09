import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { syncEngine } from "@/modules/integrations/sync-engine";
import { DocButton } from "@/components/doc-button";
import type { SyncJob } from "@/modules/integrations/types";
import { RefreshCw, Play, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/integrations/syncs")({
  head: () => ({ meta: [{ title: "Syncs — ServiceForge" }] }),
  component: SyncsPage,
});

function SyncsPage() {
  const { t } = useTranslation();
  const [syncs, setSyncs] = useState<SyncJob[]>([]);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => { syncEngine.list().then(setSyncs); }, []);

  async function handleRun(id: string) {
    setRunning(id);
    await syncEngine.execute(id);
    setRunning(null);
    setSyncs(await syncEngine.list());
  }

  const statusColor: Record<string, string> = {
    idle: "bg-gray-100 text-gray-500", running: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700", error: "bg-red-100 text-red-700",
    cancelled: "bg-amber-100 text-amber-700", conflict: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("int.syncs.title")}</h2>
        <DocButton module="integrations" page="syncs" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">{t("int.syncs.name")}</th>
              <th className="text-left p-2">{t("int.syncs.type")}</th>
              <th className="text-left p-2">{t("int.syncs.status")}</th>
              <th className="text-left p-2">{t("int.syncs.progress")}</th>
              <th className="text-left p-2">{t("int.syncs.errors")}</th>
              <th className="text-left p-2">{t("int.syncs.conflict")}</th>
              <th className="text-left p-2">{t("common.actions") || "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {syncs.slice(0, 50).map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2 font-medium">{s.name}</td>
                <td className="p-2 text-xs">{s.type}</td>
                <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[s.status] || ""}`}>{t(`int.status.${s.status}`)}</span></td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.progress}%` }} />
                    </div>
                    <span className="text-xs">{s.progress}%</span>
                  </div>
                </td>
                <td className="p-2 text-xs">{s.errorRecords}</td>
                <td className="p-2 text-xs">{s.conflictResolution.replace(/-/g, " ")}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    {s.status === "idle" && (
                      <button onClick={() => handleRun(s.id)} disabled={running === s.id} className="flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-muted">
                        {running === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        {t("int.syncs.run")}
                      </button>
                    )}
                    {s.status === "running" && (
                      <button onClick={() => syncEngine.cancel(s.id).then(() => syncEngine.list().then(setSyncs))} className="flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-muted">
                        <XCircle className="w-3 h-3" /> {t("int.syncs.cancel")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
