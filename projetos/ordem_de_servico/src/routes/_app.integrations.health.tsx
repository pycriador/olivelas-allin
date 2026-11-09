import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { healthCheckService } from "@/modules/integrations/health-check";
import { DocButton } from "@/components/doc-button";
import type { HealthCheckResult } from "@/modules/integrations/types";
import { HeartPulse, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_app/integrations/health")({
  head: () => ({ meta: [{ title: "Health Check — ServiceForge" }] }),
  component: HealthPage,
});

function HealthPage() {
  const { t } = useTranslation();
  const [checks, setChecks] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { healthCheckService.list().then(setChecks); }, []);

  async function handleRun() {
    setLoading(true);
    await healthCheckService.runForConnector("mock-connector");
    setChecks(await healthCheckService.list());
    setLoading(false);
  }

  const statusColor: Record<string, string> = {
    healthy: "bg-green-100 text-green-700",
    degraded: "bg-amber-100 text-amber-700",
    unhealthy: "bg-red-100 text-red-700",
  };

  const statusIcon: Record<string, React.ReactNode> = {
    healthy: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    degraded: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    unhealthy: <XCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("int.health.title")}</h2>
          <DocButton module="integrations" page="health" />
        <button onClick={handleRun} disabled={loading} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HeartPulse className="w-4 h-4" />}
          {t("int.health.run")}
        </button>
      </div>

      {checks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>
      ) : (
        <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="text-left p-2">{t("int.health.status")}</th>
                <th className="text-left p-2">{t("int.health.auth")}</th>
                <th className="text-left p-2">{t("int.health.connectivity")}</th>
                <th className="text-left p-2">{t("int.health.latency")}</th>
                <th className="text-left p-2">{t("int.health.availability")}</th>
                <th className="text-left p-2">{t("int.health.permissions")}</th>
                <th className="text-left p-2">{t("int.health.version")}</th>
                <th className="text-left p-2">{t("int.health.rateLimit")}</th>
              </tr>
            </thead>
            <tbody>
              {checks.slice(0, 20).map((h) => (
                <tr key={h.id} className="border-t">
                  <td className="p-2">
                    <span className={`flex items-center gap-1 text-xs w-fit px-2 py-0.5 rounded-full ${statusColor[h.status] || ""}`}>
                      {statusIcon[h.status]}
                      {t(`int.status.${h.status}`)}
                    </span>
                  </td>
                  <td className="p-2">{h.auth ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}</td>
                  <td className="p-2">{h.connectivity ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}</td>
                  <td className="p-2">{h.latency}ms</td>
                  <td className="p-2">{h.availability}%</td>
                  <td className="p-2">{h.permissions ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}</td>
                  <td className="p-2 text-xs">{h.version}</td>
                  <td className="p-2">{h.rateLimit ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
