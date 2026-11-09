import { AlertCircle, CheckCircle2, Circle, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateCampaignPublishStatus } from "@/features/campaigns/hooks/use-campaigns";
import { evaluatePublication } from "@/lib/campaign-publication";
import {
  CAMPAIGN_PUBLISH_STATUS_LABELS,
  CAMPAIGN_PUBLISH_STATUS_VALUES,
  type Campaign,
  type CampaignImage,
  type CampaignPublishStatus,
  type CampaignSettings,
} from "@/types/campaign";

export interface PublicationChecklistProps {
  campaign: Campaign;
  settings: CampaignSettings | null;
  images?: CampaignImage[];
  canPublish: boolean;
}

const STATUS_VARIANT: Record<CampaignPublishStatus, "default" | "secondary" | "outline"> = {
  DRAFT: "outline",
  UNDER_REVIEW: "secondary",
  PUBLISHED: "default",
  PAUSED: "secondary",
  FINISHED: "secondary",
  ARCHIVED: "outline",
};

export function PublicationChecklist({
  campaign,
  settings,
  images = [],
  canPublish,
}: PublicationChecklistProps) {
  const readiness = evaluatePublication(campaign, settings, images);
  const status: CampaignPublishStatus = settings?.publish_status ?? "DRAFT";
  const mutation = useUpdateCampaignPublishStatus();

  const setStatus = (next: CampaignPublishStatus) => {
    if (next === "PUBLISHED" && !readiness.canPublish) {
      toast.error("Complete os itens obrigatórios antes de publicar");
      return;
    }
    mutation.mutate(
      { campaignId: campaign.id, status: next },
      {
        onSuccess: () =>
          toast.success(`Status de publicação: ${CAMPAIGN_PUBLISH_STATUS_LABELS[next]}`),
        onError: (error) =>
          toast.error("Não foi possível alterar o status", { description: error.message }),
      },
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold">Checklist de publicação</h4>
            <p className="text-xs text-muted-foreground">
              {readiness.requiredDone} de {readiness.requiredTotal} itens obrigatórios concluídos.
            </p>
          </div>
          <Badge variant={readiness.canPublish ? "default" : "secondary"}>
            {readiness.score}% completo
          </Badge>
        </div>

        <Progress value={readiness.score} />

        <ul className="divide-y divide-border">
          {readiness.items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-3">
              {item.ok ? (
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              ) : item.required ? (
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-destructive"
                />
              ) : (
                <Circle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
              )}
              <div className="min-w-0 space-y-0.5">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {item.label}
                  {!item.required ? (
                    <span className="text-[10px] uppercase text-muted-foreground">opcional</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-5">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Status de publicação</h4>
          <Badge variant={STATUS_VARIANT[status]}>{CAMPAIGN_PUBLISH_STATUS_LABELS[status]}</Badge>
        </div>

        <Select
          value={status}
          disabled={!canPublish || mutation.isPending}
          onValueChange={(next) => setStatus(next as CampaignPublishStatus)}
        >
          <SelectTrigger aria-label="Alterar status de publicação">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CAMPAIGN_PUBLISH_STATUS_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {CAMPAIGN_PUBLISH_STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          className="w-full"
          disabled={
            !canPublish || mutation.isPending || status === "PUBLISHED" || !readiness.canPublish
          }
          onClick={() => setStatus("PUBLISHED")}
        >
          {mutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Rocket aria-hidden="true" className="size-4" />
          )}
          Publicar campanha
        </Button>

        {!readiness.canPublish ? (
          <p className="text-xs text-muted-foreground">
            Resolva os itens obrigatórios destacados em vermelho para liberar a publicação.
          </p>
        ) : null}
        {!canPublish ? (
          <p className="text-xs text-muted-foreground">
            Você não tem permissão para publicar campanhas.
          </p>
        ) : null}
      </div>
    </div>
  );
}
