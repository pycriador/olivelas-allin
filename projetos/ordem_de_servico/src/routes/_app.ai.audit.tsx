import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { aiAuditService } from "@/modules/ai/ai-audit";
import { DocButton } from "@/components/doc-button";
import type { AIAuditEntry } from "@/modules/ai/types";
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_app/ai/audit")({
  head: () => ({ meta: [{ title: "AI Audit — ServiceForge" }] }),
  component: AIAuditPage,
});

function AIAuditPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<AIAuditEntry[]>([]);

  useEffect(() => { aiAuditService.list(200).then(setEntries); }, []);

  const statusIcon: Record<string, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("ai.audit.title")}</h2>
        <DocButton module="ai" page="audit" />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">{t("ai.audit.type")}</th>
              <th className="text-left p-2">{t("ai.audit.provider")}</th>
              <th className="text-left p-2">{t("ai.audit.confidence")}</th>
              <th className="text-left p-2">{t("ai.audit.time")}</th>
              <th className="text-left p-2">{t("ai.audit.result")}</th>
              <th className="text-left p-2">{t("status") || "Status"}</th>
              <th className="text-left p-2">{t("common.date") || "Date"}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-2 capitalize">{e.type}</td>
                <td className="p-2 text-muted-foreground">{e.provider}/{e.model}</td>
                <td className="p-2">{(e.confidence * 100).toFixed(1)}%</td>
                <td className="p-2">{e.processingTime}ms</td>
                <td className="p-2 text-xs max-w-xs truncate">{e.result}</td>
                <td className="p-2">{statusIcon[e.status]}</td>
                <td className="p-2 text-xs text-muted-foreground">{e.createdAt ? new Date(e.createdAt).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
