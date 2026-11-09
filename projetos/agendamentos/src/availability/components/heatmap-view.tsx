import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import type { HeatmapCell } from "../dto/types";

function tone(p: number) {
  if (p >= 85) return "bg-destructive/80 text-destructive-foreground";
  if (p >= 60) return "bg-amber-500/70 text-foreground";
  if (p >= 30) return "bg-emerald-500/60 text-foreground";
  if (p > 0) return "bg-emerald-500/25 text-foreground";
  return "bg-muted text-muted-foreground";
}

export function HeatmapView({
  cells,
  loading,
}: {
  cells: HeatmapCell[];
  loading?: boolean;
}) {
  const { t } = useTranslation();

  if (loading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  return (
    <Card className="space-y-4 p-4">
      <p className="text-sm text-muted-foreground">{t("availability.heatmapHint")}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
        {cells.map((c) => (
          <div
            key={c.date}
            className={`rounded-md p-3 text-center ${tone(c.occupancyPercent)}`}
            title={`${c.date} · ${c.occupancyPercent}%`}
          >
            <p className="text-[11px] opacity-80">{c.date.slice(5)}</p>
            <p className="text-lg font-semibold">{c.occupancyPercent}%</p>
            <p className="text-[11px] opacity-80">
              {c.appointments} {t("availability.appointments")}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
