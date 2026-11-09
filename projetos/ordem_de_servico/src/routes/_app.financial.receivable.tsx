import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { financialService } from "@/modules/financial/service";
import type { AccountReceivable } from "@/modules/financial/types";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/_app/financial/receivable")({
  head: () => ({ meta: [{ title: "Accounts Receivable — ServiceForge" }] }),
  component: ReceivablePage,
});

function ReceivablePage() {
  const { t } = useTranslation();
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [filter, setFilter] = useState<AccountReceivable["status"] | "all">("all");

  useEffect(() => { financialService.listReceivables().then(setReceivables); }, []);

  const filtered = filter === "all" ? receivables : receivables.filter(r => r.status === filter);

  const statusColors: Record<string, string> = { pending: "bg-blue-100 text-blue-700", received: "bg-green-100 text-green-700", overdue: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-500" };

  async function handleReceive(id: string) {
    await financialService.updateReceivable(id, { status: "received", receivedAt: new Date().toISOString(), receivedValue: receivables.find(r => r.id === id)?.finalValue });
    setReceivables(await financialService.listReceivables());
  }

  async function handleCancel(id: string) {
    await financialService.updateReceivable(id, { status: "cancelled" });
    setReceivables(await financialService.listReceivables());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("fin.receivable.title")}</h2>
        <div className="flex gap-2">
          {(["all", "pending", "received", "overdue", "cancelled"] as const).map(s => (
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
              <th className="text-left p-3">{t("fin.receivable.description")}</th>
              <th className="text-left p-3">{t("fin.receivable.customer")}</th>
              <th className="text-left p-3">{t("fin.receivable.finalValue")}</th>
              <th className="text-left p-3">{t("fin.receivable.dueDate")}</th>
              <th className="text-left p-3">{t("fin.receivable.status")}</th>
              <th className="text-left p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.description}</td>
                <td className="p-3">{r.customerName}</td>
                <td className="p-3 font-semibold">R$ {r.finalValue.toFixed(2)}</td>
                <td className="p-3 text-xs">{new Date(r.dueDate).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[r.status] || ""}`}>{t(`fin.status.${r.status}`)}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    {(r.status === "pending" || r.status === "overdue") && (
                      <>
                        <button onClick={() => handleReceive(r.id)} className="p-1 hover:bg-muted rounded text-green-500" title={t("fin.receivable.receive")}><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleCancel(r.id)} className="p-1 hover:bg-muted rounded text-red-500" title={t("fin.receivable.cancel")}><X className="w-4 h-4" /></button>
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
