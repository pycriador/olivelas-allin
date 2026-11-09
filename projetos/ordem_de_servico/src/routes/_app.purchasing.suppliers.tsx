import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { purchasingService } from "@/modules/purchasing/service";
import type { PurchaseSupplier } from "@/modules/purchasing/types";
import { Plus, Star } from "lucide-react";

export const Route = createFileRoute("/_app/purchasing/suppliers")({
  head: () => ({ meta: [{ title: "Suppliers — ServiceForge" }] }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<PurchaseSupplier[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ companyName: "", tradeName: "", document: "", phone: "", email: "", contactName: "", active: true });

  useEffect(() => { purchasingService.listSuppliers().then(setSuppliers); }, []);

  async function handleCreate() {
    await purchasingService.createSupplier(form);
    setShowNew(false);
    setForm({ companyName: "", tradeName: "", document: "", phone: "", email: "", contactName: "", active: true });
    setSuppliers(await purchasingService.listSuppliers());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("pur.suppliers.title")}</h2>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          <Plus className="w-4 h-4" /> {t("pur.suppliers.new")}
        </button>
      </div>

      {showNew && (
        <div className="border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("pur.suppliers.companyName")} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("pur.suppliers.tradeName")} value={form.tradeName} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("pur.suppliers.document")} value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("pur.suppliers.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("pur.suppliers.email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("pur.suppliers.contact")} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm w-fit">{t("common.save")}</button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">{t("pur.suppliers.companyName")}</th>
              <th className="text-left p-3">{t("pur.suppliers.document")}</th>
              <th className="text-left p-3">{t("pur.suppliers.phone")}</th>
              <th className="text-left p-3">{t("pur.suppliers.email")}</th>
              <th className="text-left p-3">{t("pur.suppliers.rating")}</th>
              <th className="text-left p-3">{t("pur.suppliers.active")}</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">
                  <span className="font-medium">{s.companyName}</span>
                  {s.tradeName && <span className="text-xs text-muted-foreground ml-1">({s.tradeName})</span>}
                </td>
                <td className="p-3 font-mono text-xs">{s.document}</td>
                <td className="p-3">{s.phone}</td>
                <td className="p-3 text-xs">{s.email}</td>
                <td className="p-3">
                  <div className="flex items-center gap-0.5">
                    {s.rating && Array.from({ length: s.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                    {s.rating && Array.from({ length: 5 - s.rating }).map((_, i) => <Star key={i} className="w-3 h-3 text-gray-300" />)}
                  </div>
                </td>
                <td className="p-3">{s.active ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Ativo</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inativo</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
