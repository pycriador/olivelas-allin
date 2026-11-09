import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { webhookManager } from "@/modules/integrations/webhook-manager";
import { DocButton } from "@/components/doc-button";
import type { Webhook, WebhookLog } from "@/modules/integrations/types";
import { Webhook as WebhookIcon, Plus, Copy, Activity, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/integrations/webhooks")({
  head: () => ({ meta: [{ title: "Webhooks — ServiceForge" }] }),
  component: WebhooksPage,
});

function WebhooksPage() {
  const { t } = useTranslation();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);

  useEffect(() => { webhookManager.list().then(setWebhooks); }, []);

  async function handleDuplicate(id: string) {
    await webhookManager.duplicate(id);
    setWebhooks(await webhookManager.list());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("int.webhooks.title")}</h2>
        <DocButton module="integrations" page="webhooks" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">{t("int.webhooks.name")}</th>
              <th className="text-left p-2">{t("int.webhooks.url")}</th>
              <th className="text-left p-2">{t("int.webhooks.method")}</th>
              <th className="text-left p-2">{t("int.webhooks.event")}</th>
              <th className="text-left p-2">{t("int.webhooks.status")}</th>
              <th className="text-left p-2">{t("int.webhooks.version")}</th>
              <th className="text-left p-2">{t("common.actions") || "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map((wh) => (
              <tr key={wh.id} className="border-t">
                <td className="p-2 font-medium">{wh.name}</td>
                <td className="p-2 text-xs text-muted-foreground max-w-[200px] truncate">{wh.url}</td>
                <td className="p-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${wh.method === "POST" ? "bg-green-100 text-green-700" : wh.method === "GET" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{wh.method}</span>
                </td>
                <td className="p-2 text-xs">{wh.eventType}</td>
                <td className="p-2">
                  <span className={`flex items-center gap-1 text-xs w-fit px-2 py-0.5 rounded-full ${wh.status === "active" ? "bg-green-100 text-green-700" : wh.status === "error" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                    {wh.status === "active" ? <CheckCircle2 className="w-3 h-3" /> : wh.status === "error" ? <XCircle className="w-3 h-3" /> : null}
                    {t(`int.status.${wh.status}`)}
                  </span>
                </td>
                <td className="p-2 text-xs">v{wh.version}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <button onClick={() => handleDuplicate(wh.id)} title={t("int.webhooks.duplicate")}><Copy className="w-3.5 h-3.5" /></button>
                    <details className="relative">
                      <summary className="cursor-pointer list-none"><Activity className="w-3.5 h-3.5" /></summary>
                      <div className="absolute right-0 top-6 bg-white border rounded shadow-lg p-2 w-80 z-10 max-h-60 overflow-y-auto">
                        <p className="text-xs font-medium mb-1">{t("int.webhooks.logs")} ({wh.history.length})</p>
                        {wh.history.length === 0 ? <p className="text-xs text-muted-foreground">No logs</p> : wh.history.slice(-5).reverse().map((log) => (
                          <div key={log.id} className="text-xs border-b pb-1 mb-1">
                            <span className={`${log.status === "completed" ? "text-green-500" : log.status === "error" ? "text-red-500" : "text-amber-500"}`}>{log.status}</span>
                            <span className="ml-2 text-muted-foreground">{log.processingTime}ms</span>
                            {log.responseCode && <span className="ml-2">HTTP {log.responseCode}</span>}
                          </div>
                        ))}
                      </div>
                    </details>
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
