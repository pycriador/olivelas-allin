import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { getStorage } from "@/core/providers/storage";
import type { ConnectorInstance, IntegrationLog, SyncJob } from "@/modules/integrations/types";
import { monitoring } from "@/modules/integrations/monitoring";
import { Cable, Activity, RefreshCw, ScrollText, HeartPulse, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/integrations/")({
  head: () => ({ meta: [{ title: "Integration Dashboard — ServiceForge" }] }),
  component: IntegrationDashboard,
});

function IntegrationDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ activeConnectors: 0, errorConnectors: 0, totalSyncs: 0, completedSyncs: 0, failedSyncs: 0, avgLatency: 0, availability: 0, totalVolume: 0, totalRetries: 0 });

  useEffect(() => {
    monitoring.getStats().then(setStats);
  }, []);

  const cards = [
    { icon: Cable, label: t("int.activeConnectors"), value: stats.activeConnectors, color: "text-green-500" },
    { icon: AlertCircle, label: t("int.errorConnectors"), value: stats.errorConnectors, color: "text-red-500" },
    { icon: RefreshCw, label: t("int.totalSyncs"), value: stats.totalSyncs, color: "text-blue-500" },
    { icon: CheckCircle2, label: t("int.completedSyncs"), value: stats.completedSyncs, color: "text-green-500" },
    { icon: AlertCircle, label: t("int.failedSyncs"), value: stats.failedSyncs, color: "text-red-500" },
    { icon: Activity, label: t("int.avgLatency"), value: `${Math.round(stats.avgLatency)}ms`, color: "text-cyan-500" },
    { icon: HeartPulse, label: t("int.availability"), value: `${stats.availability.toFixed(1)}%`, color: "text-purple-500" },
    { icon: ScrollText, label: t("int.totalVolume"), value: stats.totalVolume, color: "text-amber-500" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
