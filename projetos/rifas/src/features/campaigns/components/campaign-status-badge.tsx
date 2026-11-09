import { Badge } from "@/components/ui/badge";
import { CAMPAIGN_STATUS_LABELS, type CampaignStatus } from "@/types/campaign";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<CampaignStatus, string> = {
  DRAFT: "border-transparent bg-secondary text-secondary-foreground",
  SCHEDULED: "border-transparent bg-accent text-accent-foreground",
  ACTIVE: "border-transparent bg-success text-success-foreground",
  PAUSED: "border-transparent bg-warning text-warning-foreground",
  FINISHED: "border-transparent bg-muted text-muted-foreground",
  CANCELLED: "border-transparent bg-destructive text-destructive-foreground",
  ARCHIVED: "border-transparent bg-muted text-muted-foreground",
};

export function CampaignStatusBadge({
  status,
  className,
}: {
  status: CampaignStatus;
  className?: string;
}) {
  return (
    <Badge className={cn(STATUS_STYLES[status], className)}>{CAMPAIGN_STATUS_LABELS[status]}</Badge>
  );
}
