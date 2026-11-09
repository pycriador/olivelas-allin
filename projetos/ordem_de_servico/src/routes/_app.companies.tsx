import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { companyService } from "@/modules/company/service";
import { configurationService } from "@/core/services/configuration";
import { useTranslation } from "@/core/i18n/I18nProvider";

export const Route = createFileRoute("/_app/companies")({
  head: () => ({
    meta: [
      { title: "Empresas — ServiceForge" },
      { name: "description", content: "Gestão multiempresa." },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: companies = [], isLoading } = useQuery({ queryKey: ["company", "list"], queryFn: () => companyService.list() });
  const { data: cfg } = useQuery({ queryKey: ["config"], queryFn: () => configurationService.get() });

  const setActive = useMutation({
    mutationFn: (id: string) => companyService.setActive(id),
    onSuccess: () => qc.invalidateQueries(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("companies.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("companies.subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">{t("companies.empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => {
          const active = cfg?.activeCompanyId === c.id;
          return (
            <Card key={c.id} className={active ? "border-primary" : ""}>
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{c.tradeName}</CardTitle>
                  <p className="text-xs text-muted-foreground">{c.cnpj}</p>
                </div>
                {active && <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />{t("database.active")}</Badge>}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("companies.phone")}: </span>
                  {c.phone}
                </div>
                <div>
                  <span className="text-muted-foreground">{t("companies.address")}: </span>
                  {c.address}
                </div>
                {!active && (
                  <Button size="sm" className="w-full mt-2" onClick={() => setActive.mutate(c.id)}>
                    {t("database.activate")}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    )}
  </div>
  );
}
