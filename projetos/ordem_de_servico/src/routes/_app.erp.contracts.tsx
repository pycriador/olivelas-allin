import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { erpService } from "@/modules/erp/service";
import type { ERPContract } from "@/modules/erp/types";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/erp/contracts")({
  head: () => ({ meta: [{ title: "Contracts — ServiceForge" }] }),
  component: ContractsPage,
});

function ContractsPage() {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<ERPContract[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { erpService.listContracts().then(setContracts); }, []);

  const statusColors: Record<string, string> = { draft: "bg-gray-100 text-gray-500", active: "bg-green-100 text-green-700", suspended: "bg-amber-100 text-amber-700", expired: "bg-red-100 text-red-700" };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("erp.contracts.title")}</h2>
      <div className="flex flex-col gap-2">
        {contracts.map((c) => (
          <div key={c.id} className="border rounded-lg">
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-medium">{c.number}</span>
                <span className="text-sm">{c.clientName}</span>
                <span className="text-xs text-muted-foreground">{c.type}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">R$ {c.value.toFixed(2)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status] || ""}`}>{t(`erp.status.${c.status}`)}</span>
              </div>
            </div>
            {expanded === c.id && (
              <div className="border-t p-3 text-sm grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">{t("erp.contracts.period")}:</span> {new Date(c.startDate).toLocaleDateString()} — {new Date(c.endDate).toLocaleDateString()}</div>
                <div><span className="text-muted-foreground">Faturamento:</span> {c.billingPeriod}</div>
                {c.slaHours && <div><span className="text-muted-foreground">SLA:</span> {c.slaHours}h</div>}
                {c.notes && <div className="col-span-2"><span className="text-muted-foreground">Obs:</span> {c.notes}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
