import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { REGISTRY_CONNECTORS, seedRegistry } from "@/modules/integrations/connector-registry";
import { DocButton } from "@/components/doc-button";
import { connectorManager } from "@/modules/integrations/connector-manager";
import { ShoppingBag, Download, CheckCircle2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_app/integrations/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace — ServiceForge" }] }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const { t } = useTranslation();
  const [installed, setInstalled] = useState<Set<string>>(new Set());

  useEffect(() => {
    connectorManager.listDefinitions().then((defs) => setInstalled(new Set(defs.filter((d) => d.isInstalled).map((d) => d.name))));
  }, []);

  async function handleInstall(name: string) {
    const reg = REGISTRY_CONNECTORS.find((r) => r.name === name);
    if (!reg) return;
    await connectorManager.createInstance({
      definitionId: `marketplace-${Date.now()}`, name, type: reg.type, category: reg.category,
      version: reg.version, environment: "development", status: "active", config: {}, tags: reg.tags,
      isFavorite: false,
    });
    setInstalled(new Set([...installed, name]));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("int.marketplace.title")}</h2>
        <DocButton module="integrations" page="marketplace" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REGISTRY_CONNECTORS.map((c, i) => {
          const isInstalled = installed.has(c.name);
          return (
            <div key={i} className="border rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full">{t(`int.category.${c.category}`)}</span>
                <span className="text-xs text-muted-foreground">v{c.version}</span>
              </div>
              <h3 className="font-semibold">{c.name}</h3>
              <p className="text-xs text-muted-foreground">{c.description}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {c.tags.slice(0, 3).map((tag) => (<span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">#{tag}</span>))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{c.provider}</span>
                {isInstalled ? (
                  <span className="flex items-center gap-1 text-xs text-green-500"><CheckCircle2 className="w-3 h-3" />{t("int.marketplace.installed")}</span>
                ) : (
                  <button onClick={() => handleInstall(c.name)} className="flex items-center gap-1 text-xs px-2 py-1 bg-primary text-primary-foreground rounded">
                    <Download className="w-3 h-3" />{t("int.marketplace.install")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
