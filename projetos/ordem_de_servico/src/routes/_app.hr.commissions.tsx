import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { hrService } from "@/modules/hr/service";
import type { HRCommission } from "@/modules/hr/types";

export const Route = createFileRoute("/_app/hr/commissions")({
  head: () => ({ meta: [{ title: "Commissions — ServiceForge" }] }),
  component: CommissionsPage,
});

function CommissionsPage() {
  const { t } = useTranslation();
  const [commissions, setCommissions] = useState<HRCommission[]>([]);
  useEffect(() => { hrService.listCommissions().then(setCommissions); }, []);

  async function handlePay(id: string) { await hrService.updateCommission(id, { status: "paid", paidAt: new Date().toISOString() }); setCommissions(await hrService.listCommissions()); }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("hr.commissions.title")}</h2>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="text-left p-3">{t("hr.commissions.employee")}</th><th className="text-left p-3">{t("hr.commissions.serviceOrder")}</th><th className="text-left p-3">{t("hr.commissions.rate")}</th><th className="text-left p-3">{t("hr.commissions.value")}</th><th className="text-left p-3">Data</th><th className="text-left p-3">{t("hr.commissions.status")}</th></tr></thead>
          <tbody>
            {commissions.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.employeeName}</td>
                <td className="p-3 font-mono text-xs">{c.serviceOrderNumber}</td>
                <td className="p-3">{c.percentage}%</td>
                <td className="p-3 font-semibold">R$ {c.value.toFixed(2)}</td>
                <td className="p-3 text-xs">{new Date(c.date).toLocaleDateString()}</td>
                <td className="p-3">{c.status === "paid" ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{t("hr.status.paid")}</span> : <button onClick={() => handlePay(c.id)} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">{t("hr.payroll.pay")}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
