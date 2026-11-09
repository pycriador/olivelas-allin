import { CalendarDays, Hash, Ticket, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CampaignStatusBadge } from "@/features/campaigns/components/campaign-status-badge";
import { campaignMediaPublicUrl } from "@/services/campaign.service";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { Campaign, CampaignImage, CampaignSettings, CampaignStatus } from "@/types/campaign";

export interface CampaignPreviewProps {
  campaign: Pick<
    Campaign,
    | "title"
    | "short_description"
    | "description"
    | "product_name"
    | "price_per_number"
    | "number_start"
    | "number_end"
    | "start_date"
    | "end_date"
  > &
    Partial<Pick<Campaign, "cover_image">> & {
      status?: CampaignStatus | undefined;
      total_numbers?: number | undefined;
    };
  settings?: CampaignSettings | null;
  images?: CampaignImage[];
  soldCount?: number;
}

export function CampaignPreview({ campaign, settings, soldCount = 0 }: CampaignPreviewProps) {
  const coverUrl = campaignMediaPublicUrl(campaign.cover_image);
  const showProgress = settings?.show_progress ?? true;
  const showRemaining = settings?.show_remaining_numbers ?? true;
  const showValue = settings?.show_product_value ?? true;
  const total =
    campaign.total_numbers ?? Math.max(0, campaign.number_end - campaign.number_start + 1);
  const available = total - soldCount;
  const progressPercent = total > 0 ? Math.min(100, (soldCount / total) * 100) : 0;
  const descriptionHtml = campaign.description ? renderMarkdownToHtml(campaign.description) : "";

  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-background shadow-card">
      <div className="border-b border-border bg-muted/40 px-4 py-3">
        <span className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Ticket aria-hidden="true" className="size-3.5" />
          </span>
          <span className="text-sm font-semibold tracking-tight">RaffleHub</span>
        </span>
      </div>

      {coverUrl ? <img src={coverUrl} alt="" className="aspect-video w-full object-cover" /> : null}

      <div className="space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {campaign.status ? <CampaignStatusBadge status={campaign.status} /> : null}
          <span className="text-xs text-muted-foreground">{campaign.product_name}</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{campaign.title}</h1>
          {campaign.short_description ? (
            <p className="text-muted-foreground">{campaign.short_description}</p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <dl className="surface-card space-y-3 p-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Hash aria-hidden="true" className="size-4" />
                Faixa de números
              </dt>
              <dd className="font-medium tabular-nums">
                {formatNumber(campaign.number_start)} a {formatNumber(campaign.number_end)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Timer aria-hidden="true" className="size-4" />
                Início
              </dt>
              <dd className="tabular-nums">{formatDate(campaign.start_date)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-4" />
                Sorteio
              </dt>
              <dd className="tabular-nums">{formatDate(campaign.end_date)}</dd>
            </div>
          </dl>

          <div className="surface-card flex flex-col justify-center gap-3 p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Valor por número</p>
              {showValue ? (
                <p className="text-3xl font-semibold tracking-tight">
                  {formatCurrency(campaign.price_per_number)}
                </p>
              ) : (
                <p className="text-lg font-medium">Confidencial</p>
              )}
            </div>
            {showRemaining ? (
              <p className="text-xs text-muted-foreground">
                {formatNumber(available)} números disponíveis de {formatNumber(total)}
              </p>
            ) : null}
          </div>
        </div>

        {showProgress ? (
          <div className="space-y-1.5">
            <Progress value={progressPercent} />
            <p className="text-xs text-muted-foreground">{Math.round(progressPercent)}% vendido</p>
          </div>
        ) : null}

        {descriptionHtml ? (
          <div
            className="markdown-content text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        ) : null}

        <Button size="lg" className="w-full sm:w-auto" disabled>
          Comprar números — em breve
        </Button>
      </div>
    </div>
  );
}
