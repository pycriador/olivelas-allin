import { createFileRoute, notFound } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES } from "@/core/constants";
import { useTranslation } from "@/core/i18n/I18nProvider";

export const Route = createFileRoute("/_app/modules/$moduleId")({
  head: ({ params }) => ({ meta: [{ title: `${params.moduleId} — ServiceForge` }] }),
  loader: ({ params }) => {
    const mod = MODULES.find((m) => m.id === params.moduleId);
    if (!mod) throw notFound();
    return { mod };
  },
  component: ModulePlaceholder,
});

function ModulePlaceholder() {
  const { mod } = Route.useLoaderData() as { mod: (typeof MODULES)[number] };
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t(mod.name)}</h1>
        <p className="text-sm text-muted-foreground capitalize">{mod.category}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Placeholder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("common.placeholder")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
