import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Skeleton } from "@/components/ui/skeleton";
import { FormRunner } from "@/components/forms/form-runner";
import { formsApi } from "@/services/forms-service";

export const Route = createFileRoute("/f/$slug")({
  head: () => ({
    meta: [
      { title: "Responder formulário — IAM Pro Forms" },
      {
        name: "description",
        content: "Responda a este formulário publicado com a plataforma IAM Pro Forms.",
      },
      { property: "og:title", content: "Responder formulário — IAM Pro Forms" },
      {
        property: "og:description",
        content: "Formulário publicado com o builder visual do IAM Pro Forms.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicFormPage,
});

function PublicFormPage() {
  const { slug } = Route.useParams();
  const { t } = useTranslation();
  const formQ = useQuery({
    queryKey: ["public-form", slug],
    queryFn: () => formsApi.getBySlug(slug),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="flex items-center gap-3 border-b bg-background px-4 py-3 md:px-8">
        <Link to="/">
          <Logo size="sm" />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher compact />
          <ThemeToggle />
        </div>
      </header>

      <main className="px-4 py-10 md:py-16">
        {formQ.isLoading ? (
          <Skeleton className="mx-auto h-96 max-w-2xl rounded-xl" />
        ) : formQ.isError || !formQ.data ? (
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-xl font-semibold">{t("forms.public.notFound")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("forms.public.notFoundDesc")}
            </p>
          </div>
        ) : formQ.data.status !== "published" ? (
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-xl font-semibold">{t("forms.public.unavailable")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("forms.public.unavailableDesc")}
            </p>
          </div>
        ) : (
          <FormRunner form={formQ.data} />
        )}
      </main>
    </div>
  );
}
