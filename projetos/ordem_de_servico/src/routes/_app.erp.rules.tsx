import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { erpService } from "@/modules/erp/service";
import type { ERPBusinessRule } from "@/modules/erp/types";

export const Route = createFileRoute("/_app/erp/rules")({
  head: () => ({ meta: [{ title: "Business Rules — ServiceForge" }] }),
  component: RulesPage,
});

const catColors: Record<string, string> = { fiscal: "bg-blue-100 text-blue-700", operational: "bg-green-100 text-green-700", financial: "bg-amber-100 text-amber-700" };

function RulesPage() {
  const { t } = useTranslation();
  const [rules, setRules] = useState<ERPBusinessRule[]>([]);
  useEffect(() => { erpService.listRules().then(setRules); }, []);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("erp.rules.title")}</h2>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr><th className="text-left p-3">{t("erp.rules.key")}</th><th className="text-left p-3">{t("erp.rules.name")}</th><th className="text-left p-3">{t("erp.rules.value")}</th><th className="text-left p-3">{t("erp.rules.category")}</th><th className="text-left p-3">Descrição</th></tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-mono text-xs">{r.key}</td>
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3"><code className="bg-muted px-2 py-0.5 rounded text-xs">{r.value}</code></td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${catColors[r.category] || ""}`}>{r.category}</span></td>
                <td className="p-3 text-xs text-muted-foreground">{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
