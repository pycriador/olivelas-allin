import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { integrationLogs } from "@/modules/integrations/logs";
import { DocButton } from "@/components/doc-button";
import type { IntegrationLog } from "@/modules/integrations/types";
import { ScrollText, Trash2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_app/integrations/logs")({
  head: () => ({ meta: [{ title: "Integration Logs — ServiceForge" }] }),
  component: LogsPage,
});

function LogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<IntegrationLog[]>([]);

  useEffect(() => { integrationLogs.list(200).then(setLogs); }, []);

  async function handleClear() {
    await integrationLogs.clear();
    setLogs([]);
  }

  const statusIcon: Record<string, React.ReactNode> = {
    success: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
    error: <XCircle className="w-3.5 h-3.5 text-red-500" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("int.logs.title")}</h2>
          <DocButton module="integrations" page="logs" />
        <button onClick={handleClear} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" /> {t("int.logs.clear")}
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="text-left p-2">{t("int.logs.status")}</th>
              <th className="text-left p-2">{t("int.logs.type")}</th>
              <th className="text-left p-2">{t("int.logs.method")}</th>
              <th className="text-left p-2">{t("int.logs.url")}</th>
              <th className="text-left p-2">{t("int.logs.code")}</th>
              <th className="text-left p-2">{t("int.logs.time")}</th>
              <th className="text-left p-2">{t("int.logs.error")}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="p-2">{statusIcon[log.status]}</td>
                <td className="p-2 text-xs">{log.type}</td>
                <td className="p-2 text-xs">{log.method}</td>
                <td className="p-2 text-xs text-muted-foreground max-w-[200px] truncate">{log.url}</td>
                <td className="p-2 text-xs">{log.responseCode}</td>
                <td className="p-2 text-xs">{log.processingTime}ms</td>
                <td className="p-2 text-xs text-red-500 max-w-[150px] truncate">{log.error || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
