import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { visionEngine } from "@/modules/ai/vision-engine";
import { DocButton } from "@/components/doc-button";
import type { VisionRequest, VisionType, VisionDetection } from "@/modules/ai/types";
import { Eye, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/ai/vision")({
  head: () => ({ meta: [{ title: "Computer Vision — ServiceForge" }] }),
  component: AIVisionPage,
});

const VISION_TYPES: VisionType[] = ["document-recognition", "device-recognition", "label-reading", "serial-number", "brand-identification", "qr-code", "barcode", "image-quality", "auto-rotate", "perspective-correction", "multi-document"];

function AIVisionPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<VisionRequest[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<VisionRequest | null>(null);

  useEffect(() => { visionEngine.list().then(setRequests); }, []);

  async function handleSimulate() {
    setProcessing(true);
    await visionEngine.process({ type: "document-recognition", sourceId: `demo-${Date.now()}` });
    setRequests(await visionEngine.list());
    setProcessing(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("ai.vision.title")}</h2>
          <DocButton module="ai" page="vision" />
        <button onClick={handleSimulate} disabled={processing} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          {t("ai.vision.process")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">{t("ai.vision.type")}</th>
                <th className="text-left p-2">{t("ai.status") || "Status"}</th>
                <th className="text-left p-2">{t("ai.vision.detections")}</th>
                <th className="text-left p-2">{t("ai.ocr.confidence")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-t cursor-pointer hover:bg-muted/50" onClick={() => setSelected(selected?.id === req.id ? null : req)}>
                  <td className="p-2">{req.type.replace(/-/g, " ")}</td>
                  <td className="p-2">{t(`ai.status.${req.status}`)}</td>
                  <td className="p-2">{req.result?.detections.length ?? "-"}</td>
                  <td className="p-2">{req.result ? `${(req.result.confidence * 100).toFixed(0)}%` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected?.result && (
          <div className="border rounded-lg p-4 flex flex-col gap-3">
            <h3 className="font-semibold">{t("ai.vision.detections")}</h3>
            {selected.result.detections.map((d, i) => (
              <div key={i} className="border rounded p-2 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium capitalize">{d.type.replace(/-/g, " ")}</span>
                  <p className="text-xs text-muted-foreground">{d.value}</p>
                </div>
                <span className={`text-xs ${d.confidence >= 0.7 ? "text-green-500" : "text-amber-500"}`}>
                  {(d.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
