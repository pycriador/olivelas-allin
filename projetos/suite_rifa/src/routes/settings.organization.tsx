import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app/AppShell";
import { PermissionGate } from "@/components/app/PermissionGate";
import { OrganizationBrandingForm } from "@/components/settings/OrganizationBrandingForm";
import { OrganizationContactForm } from "@/components/settings/OrganizationContactForm";
import { OrganizationDangerZone } from "@/components/settings/OrganizationDangerZone";
import { OrganizationGeneralForm } from "@/components/settings/OrganizationGeneralForm";
import { OrganizationPreferencesForm } from "@/components/settings/OrganizationPreferencesForm";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/hooks/useTenant";
import { OrganizationService } from "@/services/organizations";
import { ORG_STATUS_LABEL } from "@/services/types";

export const Route = createFileRoute("/settings/organization")({
  head: () => ({
    meta: [
      { title: "Organização — RaffleHub" },
      { name: "description", content: "Dados, identidade visual, contato e preferências da organização." },
      { property: "og:title", content: "Organização — RaffleHub" },
      {
        property: "og:description",
        content: "Dados, identidade visual, contato e preferências da organização.",
      },
    ],
  }),
  component: OrgSettings,
});

function OrgSettings() {
  const { organizationId } = useTenant();

  const query = useQuery({
    queryKey: ["organization", organizationId],
    queryFn: () => OrganizationService.get(organizationId as string),
    enabled: Boolean(organizationId),
  });

  const organization = query.data ?? null;

  return (
    <AppShell
      title="Organização"
      description="Configurações da organização ativa. Todas as regras são validadas no banco de dados."
    >
      <PermissionGate permission="organization.view">
        {query.isPending || !organization ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl">{organization.name}</h2>
              <Badge variant={organization.status === "ACTIVE" ? "secondary" : "destructive"}>
                {ORG_STATUS_LABEL[organization.status]}
              </Badge>
            </div>

            <Tabs defaultValue="general">
              <TabsList className="flex-wrap">
                <TabsTrigger value="general">Geral</TabsTrigger>
                <TabsTrigger value="branding">Identidade visual</TabsTrigger>
                <TabsTrigger value="contact">Contato</TabsTrigger>
                <TabsTrigger value="preferences">Preferências</TabsTrigger>
                <TabsTrigger value="danger">Zona de risco</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="mt-4">
                <OrganizationGeneralForm organization={organization} />
              </TabsContent>
              <TabsContent value="branding" className="mt-4">
                <OrganizationBrandingForm organization={organization} />
              </TabsContent>
              <TabsContent value="contact" className="mt-4">
                <OrganizationContactForm organization={organization} />
              </TabsContent>
              <TabsContent value="preferences" className="mt-4">
                <OrganizationPreferencesForm organization={organization} />
              </TabsContent>
              <TabsContent value="danger" className="mt-4">
                <OrganizationDangerZone organization={organization} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </PermissionGate>
    </AppShell>
  );
}
