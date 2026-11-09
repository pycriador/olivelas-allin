import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { getStorage } from "@/core/providers/storage";
import type { ConnectorTemplate, AuthType, ConnectorCategory } from "@/modules/integrations/types";
import { DocButton } from "@/components/doc-button";
import { FileJson, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/integrations/templates")({
  head: () => ({ meta: [{ title: "Templates — ServiceForge" }] }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<ConnectorTemplate[]>([]);

  useEffect(() => { getStorage().findAll<ConnectorTemplate>("int_templates").then(setTemplates); }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("int.templates.title")}</h2>
        <DocButton module="integrations" page="templates" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tmpl) => (
          <div key={tmpl.id} className="border rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full">{t(`int.category.${tmpl.category}`)}</span>
              <span className="text-xs text-muted-foreground">v{tmpl.version}</span>
            </div>
            <h3 className="font-semibold">{tmpl.name}</h3>
            <p className="text-xs text-muted-foreground">{tmpl.description}</p>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">{t(`int.auth.${tmpl.authType}`)}</span>
              {tmpl.isGlobal ? (
                <span className="flex items-center gap-1 text-green-500"><CheckCircle2 className="w-3 h-3" />{t("int.templates.global")}</span>
              ) : (
                <span className="flex items-center gap-1 text-gray-400"><XCircle className="w-3 h-3" />{t("int.templates.global")}</span>
              )}
            </div>
            <div className="mt-2 border-t pt-2">
              <p className="text-xs font-medium mb-1">Config:</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(tmpl.configTemplate).map(([key, val]) => (
                  <span key={key} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{key}: {String(val)}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
