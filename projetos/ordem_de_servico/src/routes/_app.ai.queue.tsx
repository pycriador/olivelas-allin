import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { aiQueue } from "@/modules/ai/ai-queue";
import { DocButton } from "@/components/doc-button";
import type { AIQueueItem, AIQueueStatus } from "@/modules/ai/types";
import { ListOrdered, XCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_app/ai/queue")({
  head: () => ({ meta: [{ title: "AI Queue — ServiceForge" }] }),
  component: AIQueuePage,
});

const STATUSES: AIQueueStatus[] = ["pending", "processing", "completed", "error", "cancelled", "retry"];

function AIQueuePage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<AIQueueItem[]>([]);
  const [filter, setFilter] = useState<AIQueueStatus | "all">("all");

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setItems(await aiQueue.list(filter === "all" ? undefined : filter));
  }

  async function handleCancel(id: string) {
    await aiQueue.cancel(id);
    load();
  }

  async function handleRetry(id: string) {
    await aiQueue.retry(id);
    load();
  }

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
    retry: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("ai.queue.title")}</h2>
        <DocButton module="ai" page="queue" />
      </div>
        <select className="border rounded px-2 py-1 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as AIQueueStatus | "all")}>
          <option value="all">{t("common.all") || "All"}</option>
          {STATUSES.map((s) => (<option key={s} value={s}>{t(`ai.status.${s}`)}</option>))}
        </select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">{t("ai.queue.type")}</th>
              <th className="text-left p-2">{t("ai.queue.status")}</th>
              <th className="text-left p-2">{t("ai.queue.priority")}</th>
              <th className="text-left p-2">{t("ai.queue.retry")}</th>
              <th className="text-left p-2">{t("common.actions") || "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-2 capitalize">{item.type}</td>
                <td className="p-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[item.status] || ""}`}>
                    {t(`ai.status.${item.status}`)}
                  </span>
                </td>
                <td className="p-2">{item.priority}</td>
                <td className="p-2">{item.retryCount}/{item.maxRetries}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    {(item.status === "pending" || item.status === "retry") && (
                      <button onClick={() => handleCancel(item.id)} title={t("ai.queue.cancel")}><XCircle className="w-4 h-4 text-red-500" /></button>
                    )}
                    {(item.status === "error" || item.status === "cancelled") && (
                      <button onClick={() => handleRetry(item.id)} title={t("ai.queue.retryNow")}><RefreshCw className="w-4 h-4 text-blue-500" /></button>
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
