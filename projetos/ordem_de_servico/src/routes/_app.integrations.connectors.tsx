import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { connectorManager } from "@/modules/integrations/connector-manager";
import { DocButton } from "@/components/doc-button";
import type { ConnectorInstance, ConnectorCategory, EnvironmentType } from "@/modules/integrations/types";
import { Puzzle, Plus, Star, StarOff } from "lucide-react";

export const Route = createFileRoute("/_app/integrations/connectors")({
  head: () => ({ meta: [{ title: "Connectors — ServiceForge" }] }),
  component: ConnectorsPage,
});

function ConnectorsPage() {
  const { t } = useTranslation();
  const [instances, setInstances] = useState<ConnectorInstance[]>([]);

  useEffect(() => { connectorManager.listInstances().then(setInstances); }, []);

  async function toggleFavorite(id: string) {
    await connectorManager.toggleFavorite(id);
    setInstances(await connectorManager.listInstances());
  }

  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-700", inactive: "bg-gray-100 text-gray-500",
    error: "bg-red-100 text-red-700", installing: "bg-blue-100 text-blue-700", uninstalled: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("int.connectors.title")}</h2>
        <DocButton module="integrations" page="connectors" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">{t("int.connectors.favorite")}</th>
              <th className="text-left p-2">{t("int.connectors.name")}</th>
              <th className="text-left p-2">{t("int.connectors.type")}</th>
              <th className="text-left p-2">{t("int.connectors.category")}</th>
              <th className="text-left p-2">{t("int.connectors.status")}</th>
              <th className="text-left p-2">{t("int.connectors.environment")}</th>
              <th className="text-left p-2">{t("int.connectors.version")}</th>
            </tr>
          </thead>
          <tbody>
            {instances.map((inst) => (
              <tr key={inst.id} className="border-t">
                <td className="p-2">
                  <button onClick={() => toggleFavorite(inst.id)}>
                    {inst.isFavorite ? <Star className="w-4 h-4 text-amber-500" /> : <StarOff className="w-4 h-4 text-gray-300" />}
                  </button>
                </td>
                <td className="p-2 font-medium">{inst.name}</td>
                <td className="p-2 text-muted-foreground">{inst.type}</td>
                <td className="p-2">{t(`int.category.${inst.category}`)}</td>
                <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[inst.status] || ""}`}>{t(`int.status.${inst.status}`)}</span></td>
                <td className="p-2">{t(`int.env.${inst.environment}`)}</td>
                <td className="p-2 text-xs">v{inst.version}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
