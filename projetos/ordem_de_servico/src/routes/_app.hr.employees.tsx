import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { hrService } from "@/modules/hr/service";
import type { HREmployee } from "@/modules/hr/types";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/hr/employees")({
  head: () => ({ meta: [{ title: "Employees — ServiceForge" }] }),
  component: EmployeesPage,
});

const statusColors: Record<string, string> = { active: "bg-green-100 text-green-700", inactive: "bg-gray-100 text-gray-500", vacation: "bg-blue-100 text-blue-700", leave: "bg-amber-100 text-amber-700" };

function EmployeesPage() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<HREmployee[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", document: "", email: "", role: "", departmentName: "", salary: 0, commissionRate: 0, status: "active" as const, admissionDate: new Date().toISOString().split("T")[0], phone: "" });

  useEffect(() => { hrService.listEmployees().then(setEmployees); }, []);

  async function handleCreate() {
    await hrService.createEmployee(form);
    setShowNew(false); setForm({ name: "", document: "", email: "", role: "", departmentName: "", salary: 0, commissionRate: 0, status: "active", admissionDate: new Date().toISOString().split("T")[0], phone: "" });
    setEmployees(await hrService.listEmployees());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("hr.employees.title")}</h2>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"><Plus className="w-4 h-4" /> {t("hr.employees.new")}</button>
      </div>
      {showNew && (
        <div className="border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("hr.employees.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("hr.employees.document")} value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("hr.employees.role")} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("hr.employees.salary")} type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} />
          <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm w-fit">{t("common.save")}</button>
        </div>
      )}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="text-left p-3">{t("hr.employees.name")}</th><th className="text-left p-3">{t("hr.employees.role")}</th><th className="text-left p-3">{t("hr.employees.department")}</th><th className="text-left p-3">{t("hr.employees.salary")}</th><th className="text-left p-3">{t("hr.employees.commissionRate")}</th><th className="text-left p-3">{t("hr.employees.status")}</th></tr></thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3 font-medium">{e.name}</td>
                <td className="p-3">{e.role}</td>
                <td className="p-3 text-xs text-muted-foreground">{e.departmentName || "-"}</td>
                <td className="p-3">R$ {e.salary.toFixed(2)}</td>
                <td className="p-3">{e.commissionRate > 0 ? `${e.commissionRate}%` : "-"}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[e.status] || ""}`}>{t(`hr.status.${e.status}`)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
