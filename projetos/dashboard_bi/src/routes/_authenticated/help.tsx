import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/help")({ component: Page });

function Page() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("pages.help.title")} subtitle={t("pages.help.subtitle")} />
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Documentação, tutoriais e suporte estarão disponíveis em breve.
        </CardContent>
      </Card>
    </div>
  );
}
