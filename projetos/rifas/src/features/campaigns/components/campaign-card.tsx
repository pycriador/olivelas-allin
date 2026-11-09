import { Link } from "@tanstack/react-router";
import { CalendarDays, Hash, ImageOff, Tag } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CampaignStatusBadge } from "@/features/campaigns/components/campaign-status-badge";
import { campaignMediaPublicUrl } from "@/services/campaign.service";
import { formatCurrency, formatDate, formatNumberRange } from "@/lib/format";
import type { CampaignWithRelations } from "@/types/campaign";

export function CampaignCard({
  campaign,
  soldCount,
}: {
  campaign: CampaignWithRelations;
  soldCount?: number;
}) {
  const coverUrl = campaignMediaPublicUrl(campaign.cover_image);
  const total = campaign.total_numbers;
  const pct = total > 0 && soldCount != null ? Math.round((soldCount / total) * 100) : 0;

  return (
    <Card className="surface-card overflow-hidden">
      <Link to="/campanhas/$campanhaId" params={{ campanhaId: campaign.id }} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`Capa da campanha ${campaign.title}`}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageOff aria-hidden="true" className="size-8" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <CampaignStatusBadge status={campaign.status} />
          </div>
        </div>
      </Link>

      <CardContent className="space-y-3 pt-4">
        <div>
          <Link
            to="/campanhas/$campanhaId"
            params={{ campanhaId: campaign.id }}
            className="line-clamp-1 text-sm font-semibold hover:underline"
          >
            {campaign.title}
          </Link>
          <p className="line-clamp-2 text-xs text-muted-foreground">{campaign.short_description}</p>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Hash aria-hidden="true" className="size-3.5" />
            <span>{formatNumberRange(campaign.number_start, campaign.number_end)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            <span>{formatDate(campaign.end_date)}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Tag aria-hidden="true" className="size-3.5" />
            <span>{formatCurrency(campaign.price_per_number)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span>{campaign.total_numbers} números</span>
          </div>
        </dl>

        <div className="space-y-1.5">
          <Progress value={pct} />
          <p className="text-right text-[10px] text-muted-foreground">
            {soldCount != null ? `${soldCount}/${total} · ${pct}%` : `${pct}% vendido`}
          </p>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-3 text-xs text-muted-foreground">
        Criada em {formatDate(campaign.created_at)}
      </CardFooter>
    </Card>
  );
}
