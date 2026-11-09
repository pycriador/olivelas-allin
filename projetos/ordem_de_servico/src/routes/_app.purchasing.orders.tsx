import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { purchasingService } from "@/modules/purchasing/service";
import type { PurchaseOrder } from "@/modules/purchasing/types";
import { Plus, Send, Check, X, Printer } from "lucide-react";

export const Route = createFileRoute("/_app/purchasing/orders")({
  head: () => ({ meta: [{ title: "Purchase Orders — ServiceForge" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => { purchasingService.listOrders().then(setOrders); }, []);

  const statusColors: Record<string, string> = { draft: "bg-gray-100 text-gray-500", sent: "bg-blue-100 text-blue-700", confirmed: "bg-green-100 text-green-700", partial: "bg-amber-100 text-amber-700", received: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700" };

  async function handleStatus(id: string, status: PurchaseOrder["status"]) {
    await purchasingService.updateOrder(id, { status });
    setOrders(await purchasingService.listOrders());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("pur.orders.title")}</h2>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          <Plus className="w-4 h-4" /> {t("pur.orders.new")}
        </button>
      </div>

      {showNew && (
        <div className="border rounded-lg p-4 text-sm text-muted-foreground">
          Formulário de criação de pedido (implementação futura)
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">{t("pur.orders.number")}</th>
              <th className="text-left p-3">{t("pur.orders.supplier")}</th>
              <th className="text-left p-3">{t("pur.orders.total")}</th>
              <th className="text-left p-3">{t("pur.orders.status")}</th>
              <th className="text-left p-3">{t("pur.orders.expectedDate")}</th>
              <th className="text-left p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3 font-mono text-xs font-medium">{o.number}</td>
                <td className="p-3">{o.supplierName}</td>
                <td className="p-3 font-semibold">R$ {o.total.toFixed(2)}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[o.status] || ""}`}>
                    {t(`pur.status.${o.status}`)}
                  </span>
                </td>
                <td className="p-3 text-xs">{o.expectedDate ? new Date(o.expectedDate).toLocaleDateString() : "-"}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    {o.status === "draft" && <button onClick={() => handleStatus(o.id, "sent")} className="p-1 hover:bg-muted rounded" title={t("pur.orders.send")}><Send className="w-4 h-4" /></button>}
                    {o.status === "sent" && <button onClick={() => handleStatus(o.id, "confirmed")} className="p-1 hover:bg-muted rounded text-green-500" title={t("pur.orders.confirm")}><Check className="w-4 h-4" /></button>}
                    {(o.status === "draft" || o.status === "sent") && <button onClick={() => handleStatus(o.id, "cancelled")} className="p-1 hover:bg-muted rounded text-red-500" title={t("pur.orders.cancel")}><X className="w-4 h-4" /></button>}
                    <button className="p-1 hover:bg-muted rounded" title={t("pur.orders.print")}><Printer className="w-4 h-4" /></button>
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
