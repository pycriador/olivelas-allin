import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { apiGateway } from "@/modules/integrations/api-gateway";
import { DocButton } from "@/components/doc-button";
import type { APIEndpoint } from "@/modules/integrations/types";
import { Globe, Play, Loader2, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/integrations/apis")({
  head: () => ({ meta: [{ title: "API Gateway — ServiceForge" }] }),
  component: APIsPage,
});

function APIsPage() {
  const { t } = useTranslation();
  const [apis, setApis] = useState<APIEndpoint[]>([]);
  const [executing, setExecuting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; data?: unknown }>>({});

  useEffect(() => { apiGateway.list().then(setApis); }, []);

  async function handleExecute(id: string) {
    setExecuting(id);
    const result = await apiGateway.execute(id);
    setResults((prev) => ({ ...prev, [id]: result }));
    setExecuting(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("int.apis.title")}</h2>
        <DocButton module="integrations" page="apis" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">{t("int.apis.name")}</th>
              <th className="text-left p-2">{t("int.apis.url")}</th>
              <th className="text-left p-2">{t("int.apis.method")}</th>
              <th className="text-left p-2">{t("int.apis.path")}</th>
              <th className="text-left p-2">{t("int.apis.status")}</th>
              <th className="text-left p-2">{t("int.apis.monitoring")}</th>
              <th className="text-left p-2">{t("int.apis.execute")}</th>
            </tr>
          </thead>
          <tbody>
            {apis.slice(0, 50).map((api) => (
              <tr key={api.id} className="border-t">
                <td className="p-2 font-medium">{api.name}</td>
                <td className="p-2 text-xs text-muted-foreground max-w-[150px] truncate">{api.baseUrl}</td>
                <td className="p-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${api.method === "POST" ? "bg-green-100 text-green-700" : api.method === "GET" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{api.method}</span>
                </td>
                <td className="p-2 text-xs font-mono">{api.path}</td>
                <td className="p-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${api.status === "active" ? "bg-green-100 text-green-700" : api.status === "error" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>{t(`int.status.${api.status}`)}</span>
                </td>
                <td className="p-2">{api.monitoring ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}</td>
                <td className="p-2">
                  <button onClick={() => handleExecute(api.id)} disabled={executing === api.id} className="flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-muted">
                    {executing === api.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    {t("int.apis.execute")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
