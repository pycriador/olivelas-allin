import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { hrService } from "@/modules/hr/service";
import type { HRPayroll } from "@/modules/hr/types";

export const Route = createFileRoute("/_app/hr/payroll")({
  head: () => ({ meta: [{ title: "Payroll — ServiceForge" }] }),
  component: PayrollPage,
});

function PayrollPage() {
  const { t } = useTranslation();
  const [payrolls, setPayrolls] = useState<HRPayroll[]>([]);
  useEffect(() => { hrService.listPayrolls().then(setPayrolls); }, []);

  async function handlePay(id: string) { await hrService.updatePayroll(id, { paymentStatus: "paid", paidAt: new Date().toISOString() }); setPayrolls(await hrService.listPayrolls()); }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("hr.payroll.title")}</h2>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="text-left p-3">{t("hr.employees")}</th><th className="text-left p-3">{t("hr.payroll.month")}</th><th className="text-left p-3">{t("hr.payroll.baseSalary")}</th><th className="text-left p-3">{t("hr.payroll.commissions")}</th><th className="text-left p-3">{t("hr.payroll.deductions")}</th><th className="text-left p-3">{t("hr.payroll.netSalary")}</th><th className="text-left p-3">{t("hr.payroll.status")}</th></tr></thead>
          <tbody>
            {payrolls.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.employeeName}</td>
                <td className="p-3 text-xs">{p.monthYear}</td>
                <td className="p-3">R$ {p.baseSalary.toFixed(2)}</td>
                <td className="p-3">R$ {p.commissions.toFixed(2)}</td>
                <td className="p-3 text-red-500">-R$ {p.deductions.toFixed(2)}</td>
                <td className="p-3 font-semibold">R$ {p.netSalary.toFixed(2)}</td>
                <td className="p-3">
                  {p.paymentStatus === "paid" ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{t("hr.status.paid")}</span> : <button onClick={() => handlePay(p.id)} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">{t("hr.payroll.pay")}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
