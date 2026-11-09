import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { financialService } from "@/modules/financial/service";
import type { Invoice } from "@/modules/financial/types";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/financial/invoices")({
  head: () => ({ meta: [{ title: "Invoices — ServiceForge" }] }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { financialService.listInvoices().then(setInvoices); }, []);

  const statusColors: Record<string, string> = { draft: "bg-gray-100 text-gray-500", issued: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700", denied: "bg-amber-100 text-amber-700" };
  const typeColors: Record<string, string> = { entry: "bg-blue-100 text-blue-700", exit: "bg-orange-100 text-orange-700", service: "bg-purple-100 text-purple-700" };

  async function handleIssue(id: string) {
    await financialService.updateInvoice(id, { status: "issued" });
    setInvoices(await financialService.listInvoices());
  }

  async function handleCancel(id: string) {
    await financialService.updateInvoice(id, { status: "cancelled" });
    setInvoices(await financialService.listInvoices());
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("fin.invoices.title")}</h2>
      <div className="flex flex-col gap-2">
        {invoices.map((inv) => (
          <div key={inv.id} className="border rounded-lg">
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-medium">{inv.number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[inv.type] || ""}`}>{t(`fin.invoices.type.${inv.type}`)}</span>
                <span className="text-sm">{inv.receiverName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">R$ {inv.total.toFixed(2)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[inv.status] || ""}`}>{t(`fin.status.${inv.status}`)}</span>
                {(inv.status === "draft") && (
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleIssue(inv.id); }} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">{t("fin.invoices.issue")}</button>
                    <button onClick={(e) => { e.stopPropagation(); handleCancel(inv.id); }} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">{t("fin.invoices.cancel")}</button>
                  </div>
                )}
              </div>
            </div>
            {expanded === inv.id && (
              <div className="border-t p-3">
                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div><span className="text-muted-foreground">{t("fin.invoices.emitter")}:</span> {inv.emitterName} ({inv.emitterDocument})</div>
                  <div><span className="text-muted-foreground">{t("fin.invoices.receiver")}:</span> {inv.receiverName} ({inv.receiverDocument})</div>
                  <div><span className="text-muted-foreground">{t("fin.invoices.issueDate")}:</span> {new Date(inv.issueDate).toLocaleDateString()}</div>
                  {inv.key && <div><span className="text-muted-foreground">{t("fin.invoices.key")}:</span> <span className="font-mono text-xs">{inv.key}</span></div>}
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr><th className="text-left p-2">Item</th><th className="text-left p-2">Qtd</th><th className="text-left p-2">V. Unit</th><th className="text-left p-2">Total</th></tr>
                  </thead>
                  <tbody>
                    {inv.items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">{item.description}</td>
                        <td className="p-2">{item.quantity}</td>
                        <td className="p-2">R$ {item.unitValue.toFixed(2)}</td>
                        <td className="p-2">R$ {item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t font-medium">
                    <tr>
                      <td colSpan={3} className="p-2 text-right">{t("fin.invoices.subtotal")}:</td>
                      <td className="p-2">R$ {inv.subtotal.toFixed(2)}</td>
                    </tr>
                    {inv.discount > 0 && <tr><td colSpan={3} className="p-2 text-right text-red-500">{t("fin.invoices.discount")}:</td><td className="p-2">-{inv.discount}%</td></tr>}
                    <tr><td colSpan={3} className="p-2 text-right">{t("fin.invoices.taxes")}:</td><td className="p-2">R$ {inv.taxes.toFixed(2)}</td></tr>
                    <tr className="text-lg"><td colSpan={3} className="p-2 text-right font-bold">{t("fin.invoices.total")}:</td><td className="p-2 font-bold">R$ {inv.total.toFixed(2)}</td></tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
