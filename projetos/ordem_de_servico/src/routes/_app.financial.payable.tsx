import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { financialService } from "@/modules/financial/service";
import type { AccountPayable } from "@/modules/financial/types";
import { Plus, Check, X } from "lucide-react";

export const Route = createFileRoute("/_app/financial/payable")({
  head: () => ({ meta: [{ title: "Accounts Payable — ServiceForge" }] }),
  component: PayablePage,
});

function PayablePage() {
  const { t } = useTranslation();
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [filter, setFilter] = useState<AccountPayable["status"] | "all">("all");

  useEffect(() => { financialService.listPayables().then(setPayables); }, []);

  const filtered = filter === "all" ? payables : payables.filter(p => p.status === filter);

  const statusColors: Record<string, string> = { pending: "bg-blue-100 text-blue-700", paid: "bg-green-100 text-green-700", overdue: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-500" };

  async function handlePay(id: string) {
    await financialService.updatePayable(id, { status: "paid", paidAt: new Date().toISOString(), paidValue: payables.find(p => p.id === id)?.finalValue });
    setPayables(await financialService.listPayables());
  }

  async function handleCancel(id: string) {
    await financialService.updatePayable(id, { status: "cancelled" });
    setPayables(await financialService.listPayables());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("fin.payable.title")}</h2>
        <div className="flex gap-2">
          {(["all", "pending", "paid", "overdue", "cancelled"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`text-xs px-2 py-1 rounded ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {s === "all" ? "Todos" : t(`fin.status.${s}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">{t("fin.payable.description")}</th>
              <th className="text-left p-3">{t("fin.payable.supplier")}</th>
              <th className="text-left p-3">{t("fin.payable.finalValue")}</th>
              <th className="text-left p-3">{t("fin.payable.dueDate")}</th>
              <th className="text-left p-3">{t("fin.payable.status")}</th>
              <th className="text-left p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.description}</td>
                <td className="p-3">{p.supplierName}</td>
                <td className="p-3 font-semibold">R$ {p.finalValue.toFixed(2)}</td>
                <td className="p-3 text-xs">{new Date(p.dueDate).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[p.status] || ""}`}>{t(`fin.status.${p.status}`)}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    {(p.status === "pending" || p.status === "overdue") && (
                      <>
                        <button onClick={() => handlePay(p.id)} className="p-1 hover:bg-muted rounded text-green-500" title={t("fin.payable.pay")}><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleCancel(p.id)} className="p-1 hover:bg-muted rounded text-red-500" title={t("fin.payable.cancel")}><X className="w-4 h-4" /></button>
                      </>
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
