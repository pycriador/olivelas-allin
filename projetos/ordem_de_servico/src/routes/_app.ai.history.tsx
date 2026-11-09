import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { aiHistoryService } from "@/modules/ai/ai-history";
import { DocButton } from "@/components/doc-button";
import type { AIHistoryEntry } from "@/modules/ai/types";
import { Clock, Trash2, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/ai/history")({
  head: () => ({ meta: [{ title: "AI History — ServiceForge" }] }),
  component: AIHistoryPage,
});

function AIHistoryPage() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<AIHistoryEntry[]>([]);

  useEffect(() => { aiHistoryService.list(200).then(setHistory); }, []);

  async function handleClear() {
    await aiHistoryService.clear();
    setHistory([]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("ai.history.title")}</h2>
          <DocButton module="ai" page="history" />
        <button onClick={handleClear} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" /> {t("ai.history.clear")}
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">{t("ai.history.type") || "Type"}</th>
              <th className="text-left p-2">{t("ai.history.provider")}</th>
              <th className="text-left p-2">{t("ai.audit.confidence")}</th>
              <th className="text-left p-2">{t("ai.history.time")}</th>
              <th className="text-left p-2">{t("ai.history.tokens")}</th>
              <th className="text-left p-2">{t("ai.status") || "Status"}</th>
              <th className="text-left p-2">{t("common.date") || "Date"}</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-t">
                <td className="p-2 capitalize">{h.type}</td>
                <td className="p-2 text-muted-foreground">{h.provider}/{h.model}</td>
                <td className="p-2">{(h.confidence * 100).toFixed(1)}%</td>
                <td className="p-2">{h.processingTime}ms</td>
                <td className="p-2">{h.tokensUsed}</td>
                <td className="p-2">
                  {h.status === "success" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                </td>
                <td className="p-2 text-xs text-muted-foreground">{h.createdAt ? new Date(h.createdAt).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
