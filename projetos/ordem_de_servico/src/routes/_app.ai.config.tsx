import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { aiConfigService } from "@/modules/ai/ai-config";
import { DocButton } from "@/components/doc-button";
import type { AIConfig } from "@/modules/ai/types";
import { Settings, RotateCcw, Save } from "lucide-react";

export const Route = createFileRoute("/_app/ai/config")({
  head: () => ({ meta: [{ title: "AI Config — ServiceForge" }] }),
  component: AIConfigPage,
});

function AIConfigPage() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<AIConfig | null>(null);

  useEffect(() => { aiConfigService.get().then(setConfig); }, []);

  async function handleSave() {
    if (!config) return;
    await aiConfigService.update(config);
  }

  async function handleReset() {
    const reset = await aiConfigService.reset();
    setConfig(reset);
  }

  if (!config) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("ai.config.title")}</h2>
          <DocButton module="ai" page="config" />
        <div className="flex gap-2">
          <button onClick={handleReset} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm"><RotateCcw className="w-4 h-4" /> {t("ai.config.reset")}</button>
          <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"><Save className="w-4 h-4" /> {t("common.save")}</button>
        </div>
      </div>

      <div className="border rounded-lg p-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">{t("ai.config.defaultProvider")}</label>
            <select className="w-full border rounded px-2 py-1.5 text-sm mt-1" value={config.defaultProvider} onChange={(e) => setConfig({ ...config, defaultProvider: e.target.value as AIConfig["defaultProvider"] })}>
              <option value="mock">Mock</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
              <option value="claude">Claude</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t("ai.config.defaultModel")}</label>
            <select className="w-full border rounded px-2 py-1.5 text-sm mt-1" value={config.defaultModel} onChange={(e) => setConfig({ ...config, defaultModel: e.target.value as AIConfig["defaultModel"] })}>
              <option value="mock-model">Mock</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">{t("ai.config.temperature")}</label>
          <input type="number" min="0" max="2" step="0.1" className="w-full border rounded px-2 py-1.5 text-sm mt-1" value={config.defaultTemperature} onChange={(e) => setConfig({ ...config, defaultTemperature: parseFloat(e.target.value) || 0.7 })} />
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm mb-3">{t("ai.ocr.title")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.ocr.enabled} onChange={(e) => setConfig({ ...config, ocr: { ...config.ocr, enabled: e.target.checked } })} /> {t("ai.config.ocr.enabled")}</label>
            <div>
              <label className="text-xs text-muted-foreground">{t("ai.config.ocr.language")}</label>
              <input className="w-full border rounded px-2 py-1.5 text-sm mt-1" value={config.ocr.language} onChange={(e) => setConfig({ ...config, ocr: { ...config.ocr, language: e.target.value } })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t("ai.config.ocr.minConfidence")}</label>
              <input type="number" min="0" max="1" step="0.05" className="w-full border rounded px-2 py-1.5 text-sm mt-1" value={config.ocr.minConfidence} onChange={(e) => setConfig({ ...config, ocr: { ...config.ocr, minConfidence: parseFloat(e.target.value) || 0.6 } })} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.ocr.autoRotate} onChange={(e) => setConfig({ ...config, ocr: { ...config.ocr, autoRotate: e.target.checked } })} /> {t("ai.config.ocr.autoRotate")}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.ocr.perspectiveCorrection} onChange={(e) => setConfig({ ...config, ocr: { ...config.ocr, perspectiveCorrection: e.target.checked } })} /> {t("ai.config.ocr.perspective")}</label>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm mb-3">{t("ai.vision.title")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.vision.enabled} onChange={(e) => setConfig({ ...config, vision: { ...config.vision, enabled: e.target.checked } })} /> {t("ai.config.vision.enabled")}</label>
            <div>
              <label className="text-xs text-muted-foreground">{t("ai.config.vision.minConfidence")}</label>
              <input type="number" min="0" max="1" step="0.05" className="w-full border rounded px-2 py-1.5 text-sm mt-1" value={config.vision.minConfidence} onChange={(e) => setConfig({ ...config, vision: { ...config.vision, minConfidence: parseFloat(e.target.value) || 0.6 } })} />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">{t("ai.config.maxFileSize")} (MB)</label>
            <input type="number" className="w-full border rounded px-2 py-1.5 text-sm mt-1" value={config.maxFileSize / (1024 * 1024)} onChange={(e) => setConfig({ ...config, maxFileSize: (parseFloat(e.target.value) || 10) * 1024 * 1024 })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t("ai.config.maxPages")}</label>
            <input type="number" className="w-full border rounded px-2 py-1.5 text-sm mt-1" value={config.maxPages} onChange={(e) => setConfig({ ...config, maxPages: parseInt(e.target.value) || 20 })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t("ai.config.timeout")} (ms)</label>
            <input type="number" className="w-full border rounded px-2 py-1.5 text-sm mt-1" value={config.timeout} onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) || 30000 })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t("ai.config.retry")}</label>
            <input type="number" className="w-full border rounded px-2 py-1.5 text-sm mt-1" value={config.retryCount} onChange={(e) => setConfig({ ...config, retryCount: parseInt(e.target.value) || 3 })} />
          </div>
        </div>
      </div>
    </div>
  );
}
