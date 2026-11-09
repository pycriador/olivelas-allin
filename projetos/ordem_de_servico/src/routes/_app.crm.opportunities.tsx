import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { crmService } from "@/modules/crm/service";
import type { CRMOpportunity } from "@/modules/crm/types";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/crm/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — ServiceForge" }] }),
  component: OpportunitiesPage,
});

const stageColors: Record<string, string> = { qualification: "bg-blue-100 text-blue-700", proposal: "bg-violet-100 text-violet-700", negotiation: "bg-orange-100 text-orange-700", won: "bg-green-100 text-green-700", lost: "bg-red-100 text-red-700" };

function OpportunitiesPage() {
  const { t } = useTranslation();
  const [opps, setOpps] = useState<CRMOpportunity[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", customerName: "", value: 0, stage: "qualification" as CRMOpportunity["stage"], probability: 20, expectedCloseDate: "", assignedTo: "" });

  useEffect(() => { crmService.listOpportunities().then(setOpps); }, []);

  async function handleCreate() {
    await crmService.createOpportunity(form);
    setShowNew(false); setForm({ name: "", customerName: "", value: 0, stage: "qualification", probability: 20, expectedCloseDate: "", assignedTo: "" });
    setOpps(await crmService.listOpportunities());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("crm.opportunities.title")}</h2>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"><Plus className="w-4 h-4" /> {t("crm.opportunities.new")}</button>
      </div>
      {showNew && (
        <div className="border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("crm.opportunities.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("crm.opportunities.customer")} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("crm.opportunities.value")} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("crm.opportunities.expectedClose")} type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
          <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm w-fit">{t("common.save")}</button>
        </div>
      )}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="text-left p-3">{t("crm.opportunities.name")}</th><th className="text-left p-3">{t("crm.opportunities.customer")}</th><th className="text-left p-3">{t("crm.opportunities.value")}</th><th className="text-left p-3">{t("crm.opportunities.stage")}</th><th className="text-left p-3">{t("crm.opportunities.probability")}</th><th className="text-left p-3">{t("crm.opportunities.expectedClose")}</th></tr></thead>
          <tbody>
            {opps.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3 font-medium">{o.name}</td>
                <td className="p-3">{o.customerName}</td>
                <td className="p-3 font-semibold">R$ {o.value.toFixed(2)}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${stageColors[o.stage] || ""}`}>{t(`crm.status.${o.stage}`)}</span></td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${o.probability}%` }} /></div>
                    <span className="text-xs">{o.probability}%</span>
                  </div>
                </td>
                <td className="p-3 text-xs">{o.expectedCloseDate ? new Date(o.expectedCloseDate).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
