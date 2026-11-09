import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { getStorage } from "@/core/providers/storage";
import { Brain, ScanText, Eye, ListOrdered, Clock, ShieldCheck, BarChart3, Sparkles } from "lucide-react";
import type { AIHistoryEntry, AIQueueItem, AIAuditEntry } from "@/modules/ai/types";

export const Route = createFileRoute("/_app/ai/")({
  head: () => ({ meta: [{ title: "AI Dashboard — ServiceForge" }] }),
  component: AIDashboard,
});

function AIDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalProcessed: 0, totalOcr: 0, totalVision: 0, queuePending: 0, avgConfidence: 0 });
  const [recent, setRecent] = useState<AIHistoryEntry[]>([]);

  useEffect(() => {
    async function load() {
      const history = await getStorage().findAll<AIHistoryEntry>("ai_history");
      const queue = await getStorage().findAll<AIQueueItem>("ai_queue");
      const audit = await getStorage().findAll<AIAuditEntry>("ai_audit");
      const completed = history.filter((h) => h.status === "success");
      const totalConfidence = completed.reduce((s, h) => s + h.confidence, 0);
      setStats({
        totalProcessed: history.length,
        totalOcr: history.filter((h) => h.type === "ocr").length,
        totalVision: history.filter((h) => h.type === "vision").length,
        queuePending: queue.filter((q) => q.status === "pending").length,
        avgConfidence: completed.length > 0 ? totalConfidence / completed.length : 0,
      });
      setRecent(history.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5));
    }
    load();
  }, []);

  const cards = [
    { icon: BarChart3, label: t("ai.totalProcessed"), value: stats.totalProcessed, color: "text-blue-500" },
    { icon: ScanText, label: t("ai.totalProcessed") + " OCR", value: stats.totalOcr, color: "text-green-500" },
    { icon: Eye, label: t("ai.totalProcessed") + " Vision", value: stats.totalVision, color: "text-cyan-500" },
    { icon: Sparkles, label: t("ai.avgConfidence"), value: `${(stats.avgConfidence * 100).toFixed(1)}%`, color: "text-purple-500" },
    { icon: ListOrdered, label: t("ai.queue.title"), value: stats.queuePending, color: "text-amber-500" },
  ];

  const quickLinks = [
    { path: "/ai/providers", icon: Brain, label: t("ai.providers.title") },
    { path: "/ai/prompts", icon: ShieldCheck, label: t("ai.prompts.title") },
    { path: "/ai/playground", icon: Sparkles, label: t("ai.playground.title") },
    { path: "/ai/ocr", icon: ScanText, label: t("ai.ocr.title") },
    { path: "/ai/conference", icon: Clock, label: t("ai.conference.title") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="border rounded-lg p-4 flex items-center gap-3">
            <card.icon className={`w-8 h-8 ${card.color}`} />
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">{t("ai.recentActivity")}</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm border-b pb-1">
                  <span className="capitalize">{entry.type}</span>
                  <span className="text-muted-foreground">{entry.provider}</span>
                  <span className="text-xs text-muted-foreground">{(entry.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">{t("common.title") || "Quick Access"}</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-2 p-3 border rounded-md hover:bg-muted transition-colors"
              >
                <link.icon className="w-5 h-5 text-purple-500" />
                <span className="text-sm">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
