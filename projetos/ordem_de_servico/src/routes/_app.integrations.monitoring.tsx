import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { monitoring } from "@/modules/integrations/monitoring";
import { DocButton } from "@/components/doc-button";
import type { MonitoringStats } from "@/modules/integrations/types";
import { Activity, Cable, RefreshCw, AlertCircle, Clock, HeartPulse, ScrollText, RotateCw } from "lucide-react";

export const Route = createFileRoute("/_app/integrations/monitoring")({
  head: () => ({ meta: [{ title: "Monitoring — ServiceForge" }] }),
  component: MonitoringPage,
});

function MonitoringPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<MonitoringStats | null>(null);

  useEffect(() => { monitoring.getStats().then(setStats); }, []);

  if (!stats) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const indicators = [
    { icon: Cable, label: t("int.activeConnectors"), value: stats.activeConnectors, max: stats.activeConnectors + stats.errorConnectors, color: "text-green-500" },
    { icon: AlertCircle, label: t("int.errorConnectors"), value: stats.errorConnectors, color: "text-red-500" },
    { icon: RefreshCw, label: t("int.completedSyncs"), value: stats.completedSyncs, max: stats.totalSyncs, color: "text-blue-500" },
    { icon: AlertCircle, label: t("int.failedSyncs"), value: stats.failedSyncs, color: "text-red-500" },
    { icon: Clock, label: t("int.avgLatency"), value: `${Math.round(stats.avgLatency)}ms`, color: "text-cyan-500" },
    { icon: HeartPulse, label: t("int.availability"), value: `${stats.availability.toFixed(1)}%`, color: "text-green-500" },
    { icon: ScrollText, label: t("int.totalVolume"), value: stats.totalVolume, color: "text-amber-500" },
    { icon: RotateCw, label: t("int.totalRetries"), value: stats.totalRetries, color: "text-purple-500" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("int.monitoring.title")}</h2>
        <DocButton module="integrations" page="monitoring" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicators.map((ind, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <ind.icon className={`w-8 h-8 ${ind.color}`} />
              <div>
                <p className="text-2xl font-bold">{ind.value}</p>
                <p className="text-xs text-muted-foreground">{ind.label}</p>
              </div>
            </div>
            {ind.max !== undefined && (
              <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${ind.max > 0 ? (ind.value as number / ind.max) * 100 : 0}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Última atualização: {new Date(stats.lastUpdated).toLocaleString()}</p>
    </div>
  );
}
