import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { inventoryService } from "@/modules/inventory/service";
import type { Warehouse } from "@/modules/inventory/types";
import { Plus, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/inventory/warehouses")({
  head: () => ({ meta: [{ title: "Warehouses — ServiceForge" }] }),
  component: WarehousesPage,
});

function WarehousesPage() {
  const { t } = useTranslation();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", city: "", state: "", active: true });

  useEffect(() => { inventoryService.listWarehouses().then(setWarehouses); }, []);

  async function handleCreate() {
    await inventoryService.createWarehouse(form);
    setShowNew(false);
    setForm({ name: "", code: "", city: "", state: "", active: true });
    setWarehouses(await inventoryService.listWarehouses());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("inv.warehouses.title")}</h2>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          <Plus className="w-4 h-4" /> {t("inv.warehouses.new")}
        </button>
      </div>

      {showNew && (
        <div className="border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.warehouses.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.warehouses.code")} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.warehouses.city")} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.warehouses.state")} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm w-fit">{t("common.save")}</button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">{t("inv.warehouses.name")}</th>
              <th className="text-left p-3">{t("inv.warehouses.code")}</th>
              <th className="text-left p-3">{t("inv.warehouses.city")}</th>
              <th className="text-left p-3">{t("inv.warehouses.state")}</th>
              <th className="text-left p-3">{t("inv.warehouses.active")}</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="p-3 font-medium">{w.name}</td>
                <td className="p-3 font-mono text-xs">{w.code}</td>
                <td className="p-3">{w.city}</td>
                <td className="p-3">{w.state}</td>
                <td className="p-3">{w.active ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
