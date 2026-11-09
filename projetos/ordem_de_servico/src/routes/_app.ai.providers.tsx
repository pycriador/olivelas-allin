import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { aiService } from "@/modules/ai/service";
import { DocButton } from "@/components/doc-button";
import type { AIProvider, AIProviderType, AIModelType } from "@/modules/ai/types";
import { AI_PROVIDER_CONFIGS, allAIModels } from "@/modules/ai/providers";
import { Plus, Plug, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/ai/providers")({
  head: () => ({ meta: [{ title: "AI Providers — ServiceForge" }] }),
  component: AIProvidersPage,
});

function AIProvidersPage() {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; time: number; error?: string }>>({});
  const [newProvider, setNewProvider] = useState({ name: "", type: "mock" as AIProviderType, models: [] as AIModelType[], defaultModel: "mock-model" as AIModelType, isDefault: false });

  useEffect(() => { aiService.listProviders().then(setProviders); }, []);

  async function handleCreate() {
    await aiService.createProvider(newProvider);
    setShowNew(false);
    setNewProvider({ name: "", type: "mock", models: [], defaultModel: "mock-model", isDefault: false });
    setProviders(await aiService.listProviders());
  }

  async function handleTest(id: string) {
    setTesting(id);
    const result = await aiService.testProvider(id);
    setTestResults((prev) => ({ ...prev, [id]: result }));
    setTesting(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("ai.providers.title")}</h2>
          <DocButton module="ai" page="providers" />
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          <Plus className="w-4 h-4" /> {t("ai.providers.new")}
        </button>
      </div>

      {showNew && (
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("ai.providers.name")} value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} />
          <select className="border rounded px-3 py-1.5 text-sm" value={newProvider.type} onChange={(e) => { const type = e.target.value as AIProviderType; const config = AI_PROVIDER_CONFIGS[type]; setNewProvider({ ...newProvider, type, models: config.models, defaultModel: config.defaultModel }); }}>
            {Object.entries(AI_PROVIDER_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>{config.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={newProvider.isDefault} onChange={(e) => setNewProvider({ ...newProvider, isDefault: e.target.checked })} /> {t("ai.providers.default")}</label>
          <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm w-fit">{t("common.save")}</button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">{t("ai.providers.name")}</th>
              <th className="text-left p-3">{t("ai.providers.type")}</th>
              <th className="text-left p-3">{t("ai.providers.model")}</th>
              <th className="text-left p-3">{t("ai.providers.status")}</th>
              <th className="text-left p-3">{t("ai.providers.default")}</th>
              <th className="text-left p-3">{t("ai.providers.test")}</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.type}</td>
                <td className="p-3">{p.defaultModel}</td>
                <td className="p-3">
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.status === "active" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {t(`ai.status.${p.status}`)}
                  </span>
                </td>
                <td className="p-3">{p.isDefault ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : "-"}</td>
                <td className="p-3">
                  <button onClick={() => handleTest(p.id)} disabled={testing === p.id} className="flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-muted">
                    {testing === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3" />}
                    {testing === p.id ? t("ai.providers.testing") : t("ai.providers.test")}
                  </button>
                  {testResults[p.id] && (
                    <span className={`ml-2 text-xs ${testResults[p.id].success ? "text-green-500" : "text-red-500"}`}>
                      {testResults[p.id].success ? t("ai.providers.testSuccess") : t("ai.providers.testFail")}
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
