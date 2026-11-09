import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { aiPlayground } from "@/modules/ai/ai-playground";
import type { AIProviderType, AIModelType, AIPlaygroundHistory } from "@/modules/ai/types";
import { Play, Trash2, Clock, Braces } from "lucide-react";

export const Route = createFileRoute("/_app/ai/playground")({
  head: () => ({ meta: [{ title: "AI Playground — ServiceForge" }] }),
  component: AIPlaygroundPage,
});

const PROVIDERS: AIProviderType[] = ["mock", "openai", "gemini", "claude", "ollama", "openrouter"];
const MODELS: Record<string, AIModelType[]> = {
  mock: ["mock-model"],
  openai: ["gpt-4o", "gpt-4o-mini"],
  gemini: ["gemini-2.0-flash"],
  claude: ["claude-3.5-sonnet"],
  ollama: ["llama-3.3-70b"],
  openrouter: ["openrouter-gpt-4o"],
};

function AIPlaygroundPage() {
  const { t } = useTranslation();
  const [provider, setProvider] = useState<AIProviderType>("mock");
  const [model, setModel] = useState<AIModelType>("mock-model");
  const [prompt, setPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [history, setHistory] = useState<AIPlaygroundHistory[]>([]);

  useEffect(() => { aiPlayground.history().then(setHistory); }, []);

  async function handleRun() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");
    const result = await aiPlayground.run({ provider, model, prompt, temperature });
    setResponse(result.response);
    setTime(result.processingTime);
    setTokens(result.tokensUsed);
    setLoading(false);
    setHistory(await aiPlayground.history());
  }

  async function handleClear() {
    await aiPlayground.clearHistory();
    setHistory([]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">{t("ai.playground.provider")}</label>
              <select className="w-full border rounded px-2 py-1.5 text-sm mt-1" value={provider} onChange={(e) => { const p = e.target.value as AIProviderType; setProvider(p); setModel(MODELS[p][0]); }}>
                {PROVIDERS.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">{t("ai.playground.model")}</label>
              <select className="w-full border rounded px-2 py-1.5 text-sm mt-1" value={model} onChange={(e) => setModel(e.target.value as AIModelType)}>
                {MODELS[provider]?.map((m) => (<option key={m} value={m}>{m}</option>))}
              </select>
            </div>
            <div className="w-20">
              <label className="text-xs text-muted-foreground">Temp</label>
              <input type="number" min="0" max="2" step="0.1" className="w-full border rounded px-2 py-1.5 text-sm mt-1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.7)} />
            </div>
          </div>

          <label className="text-xs text-muted-foreground">{t("ai.playground.prompt")}</label>
          <textarea className="border rounded p-2 text-sm h-32 resize-none" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Digite seu prompt aqui..." />

          <button onClick={handleRun} disabled={loading || !prompt.trim()} className="flex items-center justify-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
            {loading ? <span className="animate-spin">...</span> : <Play className="w-4 h-4" />}
            {t("ai.playground.run")}
          </button>

          {response && (
            <div className="border rounded p-3 bg-muted/30 mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{t("ai.playground.response")}</span>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{time}ms</span>
                  <span className="flex items-center gap-1"><Braces className="w-3 h-3" />{tokens} {t("ai.playground.tokens")}</span>
                </div>
              </div>
              <pre className="text-xs whitespace-pre-wrap">{response}</pre>
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">{t("ai.playground.history")}</h3>
            <button onClick={handleClear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /> {t("ai.history.clear")}</button>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="border rounded p-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <span>{h.provider}/{h.model}</span>
                    <span>{h.processingTime}ms</span>
                    <span>{h.tokensUsed} tokens</span>
                  </div>
                  <p className="truncate">{h.prompt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
