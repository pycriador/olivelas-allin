import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { connectionManager } from "@/modules/integrations/connection-manager";
import { DocButton } from "@/components/doc-button";
import type { Connection } from "@/modules/integrations/types";
import { Plug, Star, StarOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/integrations/connections")({
  head: () => ({ meta: [{ title: "Connections — ServiceForge" }] }),
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const { t } = useTranslation();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; latency: number }>>({});

  useEffect(() => { connectionManager.list().then(setConnections); }, []);

  async function handleTest(id: string) {
    setTesting(id);
    const result = await connectionManager.test(id);
    setResults((prev) => ({ ...prev, [id]: result }));
    setTesting(null);
  }

  async function toggleFavorite(id: string) {
    await connectionManager.toggleFavorite(id);
    setConnections(await connectionManager.list());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("int.connections.title")}</h2>
        <DocButton module="integrations" page="connections" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">{t("int.connectors.favorite")}</th>
              <th className="text-left p-2">{t("int.connections.name")}</th>
              <th className="text-left p-2">{t("int.connections.url")}</th>
              <th className="text-left p-2">{t("int.connections.status")}</th>
              <th className="text-left p-2">{t("int.connections.auth")}</th>
              <th className="text-left p-2">{t("int.connections.test")}</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">
                  <button onClick={() => toggleFavorite(c.id)}>
                    {c.isFavorite ? <Star className="w-4 h-4 text-amber-500" /> : <StarOff className="w-4 h-4 text-gray-300" />}
                  </button>
                </td>
                <td className="p-2 font-medium">{c.name}</td>
                <td className="p-2 text-xs text-muted-foreground max-w-[200px] truncate">{c.baseUrl}</td>
                <td className="p-2">
                  <span className={`flex items-center gap-1 text-xs w-fit px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-green-100 text-green-700" : c.status === "error" ? "bg-red-100 text-red-700" : c.status === "testing" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.status === "active" ? <CheckCircle2 className="w-3 h-3" /> : c.status === "error" ? <XCircle className="w-3 h-3" /> : null}
                    {t(`int.status.${c.status}`)}
                  </span>
                </td>
                <td className="p-2 text-xs">{c.auth.type}</td>
                <td className="p-2">
                  <button onClick={() => handleTest(c.id)} disabled={testing === c.id} className="flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-muted">
                    {testing === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3" />}
                    {testing === c.id ? t("int.connections.testing") : t("int.connections.test")}
                  </button>
                  {results[c.id] && (
                    <span className={`ml-2 text-xs ${results[c.id].success ? "text-green-500" : "text-red-500"}`}>
                      {results[c.id].success ? `${results[c.id].latency}ms` : t("int.connections.testFail")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
