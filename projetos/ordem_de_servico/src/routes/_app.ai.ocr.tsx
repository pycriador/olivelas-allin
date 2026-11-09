import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { ocrEngine } from "@/modules/ai/ocr-engine";
import { DocButton } from "@/components/doc-button";
import type { OCRRequest, OCRSource } from "@/modules/ai/types";
import { ScanText, Loader2, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/ai/ocr")({
  head: () => ({ meta: [{ title: "OCR Engine — ServiceForge" }] }),
  component: AIOCRPage,
});

function AIOCRPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<OCRRequest[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<OCRRequest | null>(null);

  useEffect(() => { ocrEngine.list().then(setRequests); }, []);

  async function handleSimulate() {
    setProcessing(true);
    await ocrEngine.simulate(`demo-${Date.now()}`, "image");
    setRequests(await ocrEngine.list());
    setProcessing(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("ai.ocr.title")}</h2>
          <DocButton module="ai" page="ocr" />
        <button onClick={handleSimulate} disabled={processing} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />}
          {t("ai.ocr.process")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">{t("ai.source.type") || "Source"}</th>
                <th className="text-left p-2">{t("ai.ocr.status")}</th>
                <th className="text-left p-2">{t("ai.ocr.confidence")}</th>
                <th className="text-left p-2">{t("ai.ocr.fields")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-t cursor-pointer hover:bg-muted/50" onClick={() => setSelected(selected?.id === req.id ? null : req)}>
                  <td className="p-2 capitalize">{req.sourceType}</td>
                  <td className="p-2">
                    <span className={`flex items-center gap-1 text-xs w-fit px-2 py-0.5 rounded-full ${
                      req.status === "completed" ? "bg-green-100 text-green-700" :
                      req.status === "error" ? "bg-red-100 text-red-700" :
                      req.status === "processing" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {req.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : req.status === "error" ? <XCircle className="w-3 h-3" /> : null}
                      {t(`ai.status.${req.status}`)}
                    </span>
                  </td>
                  <td className="p-2">{req.result ? `${(req.result.confidence * 100).toFixed(0)}%` : "-"}</td>
                  <td className="p-2">{req.result?.fields.length ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected?.result && (
          <div className="border rounded-lg p-4 flex flex-col gap-3">
            <h3 className="font-semibold">{t("ai.ocr.text")}</h3>
            <div className="border rounded p-2 bg-muted/30 text-xs max-h-40 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{selected.result.rawText}</pre>
            </div>
            <h3 className="font-semibold mt-2">{t("ai.ocr.fields")}</h3>
            <div className="flex flex-col gap-1">
              {selected.result.fields.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b pb-1">
                  <span className="font-medium">{f.name}</span>
                  <span>{f.value}</span>
                  <span className={`text-xs ${f.confidence >= 0.7 ? "text-green-500" : "text-amber-500"}`}>
                    {(f.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
