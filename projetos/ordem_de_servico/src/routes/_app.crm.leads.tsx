import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { crmService } from "@/modules/crm/service";
import type { CRMLead } from "@/modules/crm/types";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/crm/leads")({
  head: () => ({ meta: [{ title: "Leads — ServiceForge" }] }),
  component: LeadsPage,
});

const statusColors: Record<string, string> = { new: "bg-blue-100 text-blue-700", contacted: "bg-amber-100 text-amber-700", qualified: "bg-purple-100 text-purple-700", proposal: "bg-violet-100 text-violet-700", negotiation: "bg-orange-100 text-orange-700", lost: "bg-red-100 text-red-700", converted: "bg-green-100 text-green-700" };

function LeadsPage() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", companyName: "", phone: "", email: "", source: "website" as CRMLead["source"], status: "new" as CRMLead["status"] });

  useEffect(() => { crmService.listLeads().then(setLeads); }, []);

  async function handleCreate() {
    await crmService.createLead(form);
    setShowNew(false); setForm({ name: "", companyName: "", phone: "", email: "", source: "website", status: "new" });
    setLeads(await crmService.listLeads());
  }

  async function handleConvert(id: string) {
    await crmService.updateLead(id, { status: "converted" });
    setLeads(await crmService.listLeads());
  }

  const sources = ["website", "referral", "ads", "event", "outbound", "other"] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("crm.leads.title")}</h2>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"><Plus className="w-4 h-4" /> {t("crm.leads.new")}</button>
      </div>
      {showNew && (
        <div className="border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("crm.leads.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("crm.leads.company")} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("crm.leads.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("crm.leads.email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm w-fit">{t("common.save")}</button>
        </div>
      )}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="text-left p-3">{t("crm.leads.name")}</th><th className="text-left p-3">{t("crm.leads.company")}</th><th className="text-left p-3">{t("crm.leads.phone")}</th><th className="text-left p-3">{t("crm.leads.source")}</th><th className="text-left p-3">{t("crm.leads.status")}</th><th className="text-left p-3">Ações</th></tr></thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-3 font-medium">{l.name}</td>
                <td className="p-3 text-sm">{l.companyName}</td>
                <td className="p-3">{l.phone}</td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{t(`crm.source.${l.source}`)}</span></td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[l.status] || ""}`}>{t(`crm.status.${l.status}`)}</span></td>
                <td className="p-3">{l.status !== "converted" && l.status !== "lost" && <button onClick={() => handleConvert(l.id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">{t("crm.leads.convert")}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
