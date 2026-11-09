import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { financialService } from "@/modules/financial/service";
import type { CostCenter } from "@/modules/financial/types";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/financial/cost-centers")({
  head: () => ({ meta: [{ title: "Cost Centers — ServiceForge" }] }),
  component: CostCentersPage,
});

function CostCentersPage() {
  const { t } = useTranslation();
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "", active: true });

  useEffect(() => { financialService.listCostCenters().then(setCenters); }, []);

  async function handleCreate() {
    await financialService.createCostCenter(form);
    setShowNew(false);
    setForm({ name: "", code: "", description: "", active: true });
    setCenters(await financialService.listCostCenters());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("fin.costCenters.title")}</h2>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          <Plus className="w-4 h-4" /> {t("fin.costCenters.new")}
        </button>
      </div>

      {showNew && (
        <div className="border rounded-lg p-4 grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("fin.costCenters.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("fin.costCenters.code")} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm col-span-2" placeholder={t("fin.costCenters.description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm w-fit">{t("common.save")}</button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">{t("fin.costCenters.name")}</th>
              <th className="text-left p-3">{t("fin.costCenters.code")}</th>
              <th className="text-left p-3">{t("fin.costCenters.description")}</th>
              <th className="text-left p-3">{t("fin.accounts.active")}</th>
            </tr>
          </thead>
          <tbody>
            {centers.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 font-mono text-xs">{c.code}</td>
                <td className="p-3 text-muted-foreground">{c.description || "-"}</td>
                <td className="p-3">{c.active ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Ativo</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inativo</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
