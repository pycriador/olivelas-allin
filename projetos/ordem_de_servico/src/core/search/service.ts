import { getStorage } from "@/core/providers/storage";
import type { SavedView, FavoriteRecord, SearchResult, AdvancedSearch, SearchFilter } from "./types";

const VIEWS_COL = "saved_views";
const FAV_COL = "favorites";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const globalSearchService = {
  async quickSearch(query: string, module?: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    const modules = module ? [module] : ["customers", "devices", "technicians", "manufacturers", "brands", "models", "categories", "defects", "services", "parts", "suppliers", "payment-methods", "payment-terms", "warranties", "measurement-units"];

    const searchableModules: Record<string, { list: () => Promise<any[]>; nameField: string; moduleLabel: string; descField?: string }> = {};

    try {
      const { customerService } = await import("@/modules/customers/service");
      searchableModules.customers = { list: customerService.list, nameField: "name", moduleLabel: "Clientes", descField: "email" };
    } catch {}

    try {
      const { deviceService } = await import("@/modules/devices/service");
      searchableModules.devices = { list: deviceService.list, nameField: "serialNumber", moduleLabel: "Aparelhos", descField: "modelId" };
    } catch {}

    try {
      const { technicianService } = await import("@/modules/technicians/service");
      searchableModules.technicians = { list: technicianService.list, nameField: "name", moduleLabel: "Técnicos", descField: "position" };
    } catch {}

    try {
      const { manufacturerService } = await import("@/modules/manufacturers/service");
      searchableModules.manufacturers = { list: manufacturerService.list, nameField: "name", moduleLabel: "Fabricantes", descField: "country" };
    } catch {}

    try {
      const { brandService } = await import("@/modules/brands/service");
      searchableModules.brands = { list: brandService.list, nameField: "name", moduleLabel: "Marcas" };
    } catch {}

    try {
      const { modelService } = await import("@/modules/models/service");
      searchableModules.models = { list: modelService.list, nameField: "name", moduleLabel: "Modelos", descField: "brandId" };
    } catch {}

    try {
      const { categoryService } = await import("@/modules/categories/service");
      searchableModules.categories = { list: categoryService.list, nameField: "name", moduleLabel: "Categorias" };
    } catch {}

    try {
      const { defectService } = await import("@/modules/defects/service");
      searchableModules.defects = { list: defectService.list, nameField: "name", moduleLabel: "Defeitos" };
    } catch {}

    try {
      const { serviceService } = await import("@/modules/services/service");
      searchableModules.services = { list: serviceService.list, nameField: "name", moduleLabel: "Serviços" };
    } catch {}

    try {
      const { partService } = await import("@/modules/parts/service");
      searchableModules.parts = { list: partService.list, nameField: "name", moduleLabel: "Peças", descField: "code" };
    } catch {}

    try {
      const { supplierService } = await import("@/modules/suppliers/service");
      searchableModules.suppliers = { list: supplierService.list, nameField: "company", moduleLabel: "Fornecedores", descField: "contact" };
    } catch {}

    for (const [key, cfg] of Object.entries(searchableModules)) {
      if (module && key !== module) continue;
      try {
        const items = await cfg.list();
        for (const item of items) {
          const nameVal = String(item[cfg.nameField] ?? "").toLowerCase();
          const descVal = cfg.descField ? String(item[cfg.descField] ?? "").toLowerCase() : "";
          if (nameVal.includes(q) || descVal.includes(q)) {
            results.push({
              entityType: key,
              entityId: item.id,
              entityName: String(item[cfg.nameField] ?? ""),
              module: cfg.moduleLabel,
              description: cfg.descField ? String(item[cfg.descField] ?? "") : undefined,
              score: nameVal === q ? 1 : nameVal.startsWith(q) ? 0.8 : nameVal.includes(q) ? 0.5 : 0.3,
            });
          }
        }
      } catch {}
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 50);
  },

  async advancedSearch(params: AdvancedSearch): Promise<{ results: SearchResult[]; total: number }> {
    const results = await this.quickSearch(params.query, params.module);
    let filtered = results;

    if (params.filters.length > 0) {
      filtered = results.filter((r) => {
        return params.filters.every((f) => {
          const val = String((r as any)[f.field] ?? "").toLowerCase();
          const target = String(f.value).toLowerCase();
          switch (f.operator) {
            case "equals": return val === target;
            case "contains": return val.includes(target);
            case "startsWith": return val.startsWith(target);
            case "endsWith": return val.endsWith(target);
            default: return true;
          }
        });
      });
    }

    const start = (params.page - 1) * params.pageSize;
    return {
      results: filtered.slice(start, start + params.pageSize),
      total: filtered.length,
    };
  },

  /* Saved Views */
  async listViews(module: string): Promise<SavedView[]> {
    const all = await getStorage().findAll<SavedView>(VIEWS_COL);
    return all.filter((v) => v.module === module);
  },
  async saveView(data: Omit<SavedView, "id" | "createdAt">): Promise<SavedView> {
    const view: Omit<SavedView, "id"> = { ...data, createdAt: new Date().toISOString() };
    return getStorage().create<SavedView>(VIEWS_COL, view);
  },
  async deleteView(id: string): Promise<void> {
    return getStorage().delete(VIEWS_COL, id);
  },

  /* Favorites */
  async listFavorites(module?: string): Promise<FavoriteRecord[]> {
    const all = await getStorage().findAll<FavoriteRecord>(FAV_COL);
    return module ? all.filter((f) => f.module === module) : all;
  },
  async addFavorite(data: Omit<FavoriteRecord, "id" | "createdAt">): Promise<FavoriteRecord> {
    const fav: Omit<FavoriteRecord, "id"> = { ...data, createdAt: new Date().toISOString() };
    return getStorage().create<FavoriteRecord>(FAV_COL, fav);
  },
  async removeFavorite(id: string): Promise<void> {
    return getStorage().delete(FAV_COL, id);
  },
  async isFavorite(entityType: string, entityId: string): Promise<boolean> {
    const all = await getStorage().findAll<FavoriteRecord>(FAV_COL);
    return all.some((f) => f.entityType === entityType && f.entityId === entityId);
  },
};
