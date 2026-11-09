import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { inventoryService } from "@/modules/inventory/service";
import type { InventoryProduct } from "@/modules/inventory/types";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/_app/inventory/products")({
  head: () => ({ meta: [{ title: "Products — ServiceForge" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ sku: "", name: "", categoryName: "", brandName: "", unitName: "un", costPrice: 0, sellingPrice: 0, minStock: 5, currentStock: 0, status: "active" as const });

  useEffect(() => { inventoryService.listProducts().then(setProducts); }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  async function handleCreate() {
    await inventoryService.createProduct({ ...form, partId: undefined, barcode: undefined, description: undefined, categoryId: undefined, brandId: undefined, unitId: undefined, maxStock: undefined });
    setShowNew(false);
    setForm({ sku: "", name: "", categoryName: "", brandName: "", unitName: "un", costPrice: 0, sellingPrice: 0, minStock: 5, currentStock: 0, status: "active" });
    setProducts(await inventoryService.listProducts());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("inv.products.title")}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded px-2 py-1">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input className="text-sm outline-none w-40" placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
            <Plus className="w-4 h-4" /> {t("inv.products.new")}
          </button>
        </div>
      </div>

      {showNew && (
        <div className="border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.products.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.products.category")} value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.products.brand")} value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.products.costPrice")} type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.products.sellingPrice")} type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.products.minStock")} type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("inv.products.currentStock")} type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })} />
          <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm w-fit">{t("common.save")}</button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">{t("inv.products.name")}</th>
              <th className="text-left p-3">{t("inv.products.sku")}</th>
              <th className="text-left p-3">{t("inv.products.category")}</th>
              <th className="text-left p-3">{t("inv.products.costPrice")}</th>
              <th className="text-left p-3">{t("inv.products.sellingPrice")}</th>
              <th className="text-left p-3">{t("inv.products.currentStock")}</th>
              <th className="text-left p-3">{t("inv.products.minStock")}</th>
              <th className="text-left p-3">{t("inv.products.status")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.name}</td>
                <td className="p-3 font-mono text-xs">{p.sku}</td>
                <td className="p-3">{p.categoryName}</td>
                <td className="p-3">R$ {(Number(p.costPrice) || 0).toFixed(2)}</td>
                <td className="p-3">R$ {(Number(p.sellingPrice ?? (p as any).salePrice) || 0).toFixed(2)}</td>
                <td className="p-3">
                  <span className={`font-semibold ${(p.currentStock ?? 0) <= (p.minStock ?? 0) ? "text-red-500" : (p.currentStock ?? 0) === 0 ? "text-gray-400" : "text-green-500"}`}>
                    {p.currentStock ?? 0}
                  </span>
                </td>
                <td className="p-3">{p.minStock ?? 0}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.status ? t(`inv.status.${p.status}`) : "Ativo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
