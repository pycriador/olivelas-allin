import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { erpService } from "@/modules/erp/service";
import type { ERPCompany } from "@/modules/erp/types";
import { Plus, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/erp/companies")({
  head: () => ({ meta: [{ title: "Companies — ServiceForge" }] }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<ERPCompany[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", document: "", city: "", state: "", taxRegime: "simple" as ERPCompany["taxRegime"], active: true });

  useEffect(() => { erpService.listCompanies().then(setCompanies); }, []);

  async function handleCreate() {
    await erpService.createCompany({ ...form, phone: "", email: "", address: "", tradeName: "", defaultTaxRate: 0, ie: "", im: "" });
    setShowNew(false);
    setForm({ name: "", document: "", city: "", state: "", taxRegime: "simple", active: true });
    setCompanies(await erpService.listCompanies());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("erp.companies.title")}</h2>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"><Plus className="w-4 h-4" /> {t("erp.companies.new")}</button>
      </div>
      {showNew && (
        <div className="border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("erp.companies.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("erp.companies.document")} value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("erp.companies.city")} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <select className="border rounded px-3 py-1.5 text-sm" value={form.taxRegime} onChange={(e) => setForm({ ...form, taxRegime: e.target.value as ERPCompany["taxRegime"] })}>
            <option value="simple">Simples Nacional</option><option value="presumed">Lucro Presumido</option><option value="real">Lucro Real</option>
          </select>
          <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm w-fit">{t("common.save")}</button>
        </div>
      )}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr><th className="text-left p-3">{t("erp.companies.name")}</th><th className="text-left p-3">{t("erp.companies.document")}</th><th className="text-left p-3">{t("erp.companies.city")}</th><th className="text-left p-3">{t("erp.companies.taxRegime")}</th><th className="text-left p-3">{t("erp.companies.active")}</th></tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 font-mono text-xs">{c.document}</td>
                <td className="p-3">{c.city}/{c.state}</td>
                <td className="p-3 text-xs">{c.taxRegime === "simple" ? "Simples Nacional" : c.taxRegime === "presumed" ? "Lucro Presumido" : "Lucro Real"}</td>
                <td className="p-3">{c.active ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
