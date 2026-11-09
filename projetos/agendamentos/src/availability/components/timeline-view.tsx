import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { formatHm } from "../calculators/intervals";
import type { ProfessionalTimeline, TimelineState } from "../dto/types";

const DAY_START = 7 * 60;
const DAY_END = 22 * 60;

const STATE_CLASS: Record<TimelineState, string> = {
  available: "bg-emerald-500/70",
  partial: "bg-emerald-500/30",
  block: "bg-destructive/60",
  lunch: "bg-amber-500/50",
  vacation: "bg-purple-500/50",
  event: "bg-primary/70",
  google: "bg-sky-500/60",
  appointment: "bg-primary/70",
  off: "bg-muted",
};

export function TimelineView({
  timelines,
  loading,
}: {
  timelines: ProfessionalTimeline[];
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const span = DAY_END - DAY_START;

  if (loading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  if (timelines.length === 0)
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        {t("common.empty")}
      </Card>
    );

  const hours = Array.from({ length: Math.floor(span / 60) + 1 }, (_, i) => DAY_START + i * 60);

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(["available", "event", "google", "lunch", "block", "vacation"] as TimelineState[]).map(
          (s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${STATE_CLASS[s]}`} />
              {t(`availability.states.${s}`, s)}
            </span>
          ),
        )}
      </div>

      <div className="hidden pl-48 text-[10px] text-muted-foreground sm:flex">
        {hours.slice(0, -1).map((h) => (
          <span key={h} className="flex-1">
            {formatHm(h)}
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {timelines.map((tl) => (
          <div key={tl.professionalId} className="flex flex-col gap-1 sm:flex-row sm:items-center">
            <div className="flex w-48 shrink-0 items-center gap-2">
              <span
                className="h-6 w-1.5 rounded-full"
                style={{ backgroundColor: tl.professionalColor }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{tl.professionalName}</p>
                <p className="text-xs text-muted-foreground">
                  {tl.workloadPercent}% · {tl.appointments} {t("availability.appointments")}
                </p>
              </div>
            </div>
            <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-muted">
              {tl.segments.map((seg, i) => {
                const left = ((seg.start - DAY_START) / span) * 100;
                const width = ((seg.end - seg.start) / span) * 100;
                if (width <= 0 || left >= 100) return null;
                return (
                  <div
                    key={`${seg.start}-${seg.state}-${i}`}
                    className={`absolute top-0 h-full ${STATE_CLASS[seg.state]}`}
                    style={{ left: `${Math.max(0, left)}%`, width: `${Math.min(100, width)}%` }}
                    title={`${formatHm(seg.start)}–${formatHm(seg.end)} · ${t(
                      `availability.states.${seg.state}`,
                      seg.state,
                    )}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
