import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { inventoryService } from "@/modules/inventory/service";
import type { StockMovement } from "@/modules/inventory/types";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/inventory/movements")({
  head: () => ({ meta: [{ title: "Stock Movements — ServiceForge" }] }),
  component: MovementsPage,
});

function MovementsPage() {
  const { t } = useTranslation();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ productName: "", warehouseName: "", type: "in" as StockMovement["type"], quantity: 1, unitCost: 0, totalCost: 0, notes: "" });

  useEffect(() => { inventoryService.listMovements().then(setMovements); }, []);

  async function handleCreate() {
    await inventoryService.createMovement({ ...form, productId: "", warehouseId: "", totalCost: form.unitCost * form.quantity, operatorName: "Admin" });
    setShowNew(false);
    setForm({ productName: "", warehouseName: "", type: "in", quantity: 1, unitCost: 0, totalCost: 0, notes: "" });
    setMovements(await inventoryService.listMovements());
  }

  const typeColors: Record<string, string> = { in: "text-green-500", out: "text-red-500", transfer_in: "text-blue-500", transfer_out: "text-orange-500", adjustment: "text-purple-500", return: "text-cyan-500", sale: "text-emerald-500", purchase: "text-violet-500" };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("inv.movements.title")}</h2>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          <Plus className="w-4 h-4" /> {t("inv.movements.new")}
        </button>
      </div>

      {showNew && (
        <div className="border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.movements.product")} value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
          <select className="border rounded px-3 py-1.5 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as StockMovement["type"] })}>
            {(["in", "out", "transfer_in", "transfer_out", "adjustment", "return", "sale", "purchase"] as StockMovement["type"][]).map((mt) => (
              <option key={mt} value={mt}>{t(`inv.movements.type.${mt}` as any)}</option>
            ))}
          </select>
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.movements.quantity")} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.movements.unitCost")} type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })} />
          <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm w-fit">{t("common.save")}</button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">{t("inv.movements.type")}</th>
              <th className="text-left p-3">{t("inv.movements.product")}</th>
              <th className="text-left p-3">{t("inv.movements.quantity")}</th>
              <th className="text-left p-3">{t("inv.movements.totalCost")}</th>
              <th className="text-left p-3">{t("inv.warehouses.title")}</th>
              <th className="text-left p-3">{t("inv.movements.operator")}</th>
              <th className="text-left p-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-3"><span className={`font-medium ${typeColors[m.type] || ""}`}>{t(`inv.movements.type.${m.type}` as any)}</span></td>
                <td className="p-3">{m.productName}</td>
                <td className="p-3 font-semibold">{m.quantity}</td>
                <td className="p-3">R$ {m.totalCost.toFixed(2)}</td>
                <td className="p-3">{m.warehouseName}</td>
                <td className="p-3 text-muted-foreground">{m.operatorName}</td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
