import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { erpService } from "@/modules/erp/service";
import type { ERPDepartment } from "@/modules/erp/types";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/erp/departments")({
  head: () => ({ meta: [{ title: "Departments — ServiceForge" }] }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<ERPDepartment[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", managerName: "", budgetLimit: 0, active: true });

  useEffect(() => { erpService.listDepartments().then(setDepartments); }, []);

  async function handleCreate() {
    await erpService.createDepartment(form);
    setShowNew(false);
    setForm({ name: "", code: "", managerName: "", budgetLimit: 0, active: true });
    setDepartments(await erpService.listDepartments());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("erp.departments.title")}</h2>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"><Plus className="w-4 h-4" /> {t("erp.departments.new")}</button>
      </div>
      {showNew && (
        <div className="border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("erp.departments.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("erp.departments.code")} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("erp.departments.manager")} value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("erp.departments.budget")} type="number" value={form.budgetLimit} onChange={(e) => setForm({ ...form, budgetLimit: Number(e.target.value) })} />
          <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm w-fit">{t("common.save")}</button>
        </div>
      )}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr><th className="text-left p-3">{t("erp.departments.name")}</th><th className="text-left p-3">{t("erp.departments.code")}</th><th className="text-left p-3">{t("erp.departments.manager")}</th><th className="text-left p-3">{t("erp.departments.budget")}</th><th className="text-left p-3">{t("erp.companies.active")}</th></tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-3 font-medium">{d.name}</td>
                <td className="p-3 font-mono text-xs">{d.code}</td>
                <td className="p-3">{d.managerName || "-"}</td>
                <td className="p-3">{d.budgetLimit ? `R$ ${d.budgetLimit.toFixed(2)}` : "-"}</td>
                <td className="p-3">{d.active ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Sim</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Não</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
