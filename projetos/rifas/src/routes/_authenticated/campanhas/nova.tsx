import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { CampaignWizard } from "@/features/campaigns/components/campaign-wizard";
import { useCreateCampaign } from "@/features/campaigns/hooks/use-campaigns";
import type { CampaignFormInput } from "@/schemas/campaign.schema";

export const Route = createFileRoute("/_authenticated/campanhas/nova")({
  head: () => ({
    meta: [
      { title: "Nova campanha — RaffleHub" },
      { name: "description", content: "Crie uma nova campanha de rifas no RaffleHub." },
      { property: "og:title", content: "Nova campanha — RaffleHub" },
      { property: "og:description", content: "Crie uma nova campanha de rifas no RaffleHub." },
    ],
  }),
  component: NewCampaignRoute,
});

function NewCampaignRoute() {
  return (
    <PermissionGuard permission="campaigns.manage">
      <NewCampaignPage />
    </PermissionGuard>
  );
}

function NewCampaignPage() {
  const navigate = useNavigate();
  const createCampaign = useCreateCampaign();

  const handleSubmit = (values: CampaignFormInput) => {
    createCampaign.mutate(values, {
      onSuccess: (created) => {
        toast.success("Campanha criada com sucesso");
        void navigate({ to: "/campanhas/$campanhaId", params: { campanhaId: created.id } });
      },
      onError: (error) =>
        toast.error("Não foi possível criar a campanha", { description: error.message }),
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nova campanha"
        description="Preencha as informações da rifa em 4 passos."
      />
      <CampaignWizard
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createCampaign.isPending}
      />
    </div>
  );
}
