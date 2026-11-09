import { useTranslation } from "react-i18next";
import { CalendarPlus, Clock, Gauge } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SlotSuggestion } from "../dto/types";

function scoreTone(score: number) {
  if (score >= 70) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  if (score >= 40) return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
}

export function SuggestionList({
  suggestions,
  loading,
  onSchedule,
}: {
  suggestions: SlotSuggestion[];
  loading?: boolean;
  onSchedule: (s: SlotSuggestion) => void;
}) {
  const { t } = useTranslation();

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  }
  if (suggestions.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        {t("availability.noSlots")}
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {suggestions.map((s, i) => (
        <Card key={`${s.professionalId}-${s.startMinutes}-${i}`} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                className="mt-1 h-8 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.professionalColor }}
              />
              <div>
                <p className="font-medium leading-tight">{s.professionalName}</p>
                <p className="text-xs text-muted-foreground">
                  {s.specialty ?? t("availability.noSpecialty")}
                </p>
              </div>
            </div>
            <span
              className={`rounded-md px-2 py-1 text-xs font-semibold ${scoreTone(s.score)}`}
            >
              {s.score}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {s.startLabel} – {s.endLabel}
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                {t("availability.workload")}
              </span>
              <span>{s.workloadPercent}%</span>
            </div>
            <Progress value={s.workloadPercent} className="h-1.5" />
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            {s.reasons.map((r) => (
              <Badge key={r.key} variant="secondary" className="text-[11px]">
                {t(`availability.reasons.${r.key}`, r.key)}
                <span className="ml-1 opacity-70">
                  {r.points > 0 ? `+${r.points}` : r.points}
                </span>
              </Badge>
            ))}
            {s.overbooking && (
              <Badge variant="destructive" className="text-[11px]">
                {t("availability.overbooking")}
              </Badge>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full"
            onClick={() => onSchedule(s)}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            {t("availability.schedule")}
          </Button>
        </Card>
      ))}
    </div>
  );
}
