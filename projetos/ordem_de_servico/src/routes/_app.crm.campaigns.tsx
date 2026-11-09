import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { crmService } from "@/modules/crm/service";
import type { CRMMarketingCampaign } from "@/modules/crm/types";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/crm/campaigns")({
  head: () => ({ meta: [{ title: "Campaigns — ServiceForge" }] }),
  component: CampaignsPage,
});

const statusColors: Record<string, string> = { draft: "bg-gray-100 text-gray-500", active: "bg-green-100 text-green-700", completed: "bg-blue-100 text-blue-700", cancelled: "bg-red-100 text-red-700" };

function CampaignsPage() {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<CRMMarketingCampaign[]>([]);

  useEffect(() => { crmService.listCampaigns().then(setCampaigns); }, []);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("crm.campaigns.title")}</h2>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="text-left p-3">{t("crm.campaigns.name")}</th><th className="text-left p-3">{t("crm.campaigns.type")}</th><th className="text-left p-3">{t("crm.campaigns.budget")}</th><th className="text-left p-3">{t("crm.campaigns.spent")}</th><th className="text-left p-3">{t("crm.campaigns.roi")}</th><th className="text-left p-3">{t("crm.campaigns.leads")}</th><th className="text-left p-3">{t("crm.campaigns.status")}</th></tr></thead>
          <tbody>
            {campaigns.map((c) => {
              const roi = c.spent > 0 ? ((c.revenue - c.spent) / c.spent * 100).toFixed(0) : "-";
              return (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{c.type}</span></td>
                  <td className="p-3">R$ {c.budget.toFixed(2)}</td>
                  <td className="p-3">R$ {c.spent.toFixed(2)}</td>
                  <td className="p-3 font-semibold">{roi !== "-" ? `${roi}%` : "-"}</td>
                  <td className="p-3">{c.leadsGenerated}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status] || ""}`}>{t(`crm.status.${c.status}`)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
