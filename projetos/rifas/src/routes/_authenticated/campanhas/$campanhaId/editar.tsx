import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { CampaignWizard } from "@/features/campaigns/components/campaign-wizard";
import { useCampaign, useUpdateCampaign } from "@/features/campaigns/hooks/use-campaigns";
import type { CampaignFormInput } from "@/schemas/campaign.schema";
import { CAMPAIGN_STATUS_TRANSITIONS } from "@/types/campaign";

export const Route = createFileRoute("/_authenticated/campanhas/$campanhaId/editar")({
  head: () => ({
    meta: [
      { title: "Editar campanha — RaffleHub" },
      { name: "description", content: "Edite os dados da campanha no RaffleHub." },
      { property: "og:title", content: "Editar campanha — RaffleHub" },
      { property: "og:description", content: "Edite os dados da campanha no RaffleHub." },
    ],
  }),
  component: EditCampaignRoute,
});

function EditCampaignRoute() {
  return (
    <PermissionGuard permission="campaigns.manage">
      <EditCampaignPage />
    </PermissionGuard>
  );
}

function EditCampaignPage() {
  const { campanhaId } = useParams({ from: "/_authenticated/campanhas/$campanhaId/editar" });
  const navigate = useNavigate();
  const campaign = useCampaign(campanhaId);
  const updateCampaign = useUpdateCampaign();

  if (campaign.isPending) return <LoadingState label="Carregando campanha…" />;

  if (!campaign.data) {
    return (
      <EmptyState
        title="Campanha não encontrada"
        description="Ela pode ter sido removida ou o link está incorreto."
        actions={
          <Button asChild variant="outline">
            <Link to="/campanhas">Voltar para campanhas</Link>
          </Button>
        }
      />
    );
  }

  const data = campaign.data;
  const allowedStatuses = [data.status, ...CAMPAIGN_STATUS_TRANSITIONS[data.status]];

  const handleSubmit = (values: CampaignFormInput) => {
    updateCampaign.mutate(
      { campaignId: data.id, data: values },
      {
        onSuccess: () => {
          toast.success("Campanha atualizada com sucesso");
          void navigate({ to: "/campanhas/$campanhaId", params: { campanhaId: data.id } });
        },
        onError: (error) => toast.error("Não foi possível salvar", { description: error.message }),
      },
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader title={`Editar — ${data.title}`} description="Atualize os dados da campanha." />
      <CampaignWizard
        mode="edit"
        initialValues={{
          title: data.title,
          slug: data.slug,
          product_name: data.product_name,
          short_description: data.short_description ?? "",
          description: data.description ?? "",
          number_start: data.number_start,
          number_end: data.number_end,
          price_per_number: data.price_per_number,
          max_numbers_per_purchase: data.max_numbers_per_purchase ?? 1,
          reservation_timeout_minutes: data.reservation_timeout_minutes,
          start_date: data.start_date ?? "",
          end_date: data.end_date ?? "",
          visibility: data.visibility,
          allow_random_selection: data.allow_random_selection,
          contact_name: data.contact_name ?? "",
          contact_phone: data.contact_phone ?? "",
          whatsapp_message_template: data.whatsapp_message_template ?? "",
          purchase_mode: data.purchase_mode,
          status: data.status,
        }}
        allowedStatuses={allowedStatuses}
        campaignId={data.id}
        onSubmit={handleSubmit}
        isSubmitting={updateCampaign.isPending}
      />
    </div>
  );
}
