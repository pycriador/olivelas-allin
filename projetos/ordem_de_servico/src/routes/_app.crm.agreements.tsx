import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { crmService } from "@/modules/crm/service";
import type { CRMCustomerAgreement } from "@/modules/crm/types";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/crm/agreements")({
  head: () => ({ meta: [{ title: "SLA Agreements — ServiceForge" }] }),
  component: AgreementsPage,
});

const priorityColors: Record<string, string> = { low: "bg-gray-100 text-gray-500", medium: "bg-blue-100 text-blue-700", high: "bg-amber-100 text-amber-700", critical: "bg-red-100 text-red-700" };

function AgreementsPage() {
  const { t } = useTranslation();
  const [agreements, setAgreements] = useState<CRMCustomerAgreement[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ customerName: "", slaHours: 8, priority: "medium" as CRMCustomerAgreement["priority"], active: true, startDate: "", endDate: "" });

  useEffect(() => { crmService.listAgreements().then(setAgreements); }, []);

  async function handleCreate() {
    await crmService.createAgreement({ ...form, customerId: "" });
    setShowNew(false); setForm({ customerName: "", slaHours: 8, priority: "medium", active: true, startDate: "", endDate: "" });
    setAgreements(await crmService.listAgreements());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("crm.agreements.title")}</h2>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"><Plus className="w-4 h-4" /> {t("crm.agreements.new")}</button>
      </div>
      {showNew && (
        <div className="border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("crm.agreements.customer")} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("crm.agreements.slaHours")} type="number" value={form.slaHours} onChange={(e) => setForm({ ...form, slaHours: Number(e.target.value) })} />
          <select className="border rounded px-3 py-1.5 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as CRMCustomerAgreement["priority"] })}>
            <option value="low">{t("crm.priority.low")}</option><option value="medium">{t("crm.priority.medium")}</option><option value="high">{t("crm.priority.high")}</option><option value="critical">{t("crm.priority.critical")}</option>
          </select>
          <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm w-fit">{t("common.save")}</button>
        </div>
      )}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="text-left p-3">{t("crm.agreements.customer")}</th><th className="text-left p-3">{t("crm.agreements.slaHours")}</th><th className="text-left p-3">{t("crm.agreements.priority")}</th><th className="text-left p-3">{t("crm.agreements.period")}</th><th className="text-left p-3">{t("crm.agreements.active")}</th></tr></thead>
          <tbody>
            {agreements.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3 font-medium">{a.customerName}</td>
                <td className="p-3">{a.slaHours}h</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[a.priority] || ""}`}>{t(`crm.priority.${a.priority}`)}</span></td>
                <td className="p-3 text-xs">{new Date(a.startDate).toLocaleDateString()} — {new Date(a.endDate).toLocaleDateString()}</td>
                <td className="p-3">{a.active ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Sim</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Não</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
