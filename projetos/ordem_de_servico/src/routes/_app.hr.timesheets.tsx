import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { hrService } from "@/modules/hr/service";
import type { HRTimeSheet } from "@/modules/hr/types";

export const Route = createFileRoute("/_app/hr/timesheets")({
  head: () => ({ meta: [{ title: "Time Tracking — ServiceForge" }] }),
  component: TimeSheetsPage,
});

const statusColors: Record<string, string> = { pending: "bg-amber-100 text-amber-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700" };

function TimeSheetsPage() {
  const { t } = useTranslation();
  const [timesheets, setTimesheets] = useState<HRTimeSheet[]>([]);
  useEffect(() => { hrService.listTimeSheets().then(setTimesheets); }, []);

  async function handleApprove(id: string) { await hrService.updateTimeSheet(id, { status: "approved" }); setTimesheets(await hrService.listTimeSheets()); }
  async function handleReject(id: string) { await hrService.updateTimeSheet(id, { status: "rejected" }); setTimesheets(await hrService.listTimeSheets()); }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("hr.timeSheets.title")}</h2>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="text-left p-3">{t("hr.employees")}</th><th className="text-left p-3">{t("hr.timeSheets.date")}</th><th className="text-left p-3">{t("hr.timeSheets.clockIn")}</th><th className="text-left p-3">{t("hr.timeSheets.clockOut")}</th><th className="text-left p-3">{t("hr.timeSheets.totalHours")}</th><th className="text-left p-3">{t("hr.timeSheets.status")}</th><th className="text-left p-3">Ações</th></tr></thead>
          <tbody>
            {timesheets.map((ts) => (
              <tr key={ts.id} className="border-t">
                <td className="p-3">{ts.employeeName}</td>
                <td className="p-3 text-xs">{new Date(ts.date).toLocaleDateString()}</td>
                <td className="p-3">{ts.clockIn}</td>
                <td className="p-3">{ts.clockOut}</td>
                <td className="p-3">{ts.totalHours}h</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[ts.status] || ""}`}>{t(`hr.status.${ts.status}`)}</span></td>
                <td className="p-3">{ts.status === "pending" && <div className="flex gap-1"><button onClick={() => handleApprove(ts.id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Aprovar</button><button onClick={() => handleReject(ts.id)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Rejeitar</button></div>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
