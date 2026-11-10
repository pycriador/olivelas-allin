import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const Route = createFileRoute("/_authenticated/favorites")({ component: Page });

function Page() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("pages.favorites.title")} subtitle={t("pages.favorites.subtitle")} />
      <EmptyState message={t("home.empty")} />
    </div>
  );
}
