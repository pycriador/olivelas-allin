import { NUMBER_STATUS_DOT_CLASSES } from "./number-visuals";
import { CAMPAIGN_NUMBER_STATUS_LABELS } from "@/types/campaign-number";
import type { NumberGridStatus } from "@/types/campaign-number";

const LEGEND_STATUSES: NumberGridStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "PENDING_PAYMENT",
  "PAID",
  "BLOCKED",
  "CANCELLED",
  "WINNER",
];

export function NumberLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Legenda dos números">
      {LEGEND_STATUSES.map((status) => (
        <li key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${NUMBER_STATUS_DOT_CLASSES[status]}`}
          />
          {CAMPAIGN_NUMBER_STATUS_LABELS[status]}
        </li>
      ))}
    </ul>
  );
}
