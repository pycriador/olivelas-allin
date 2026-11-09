import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CalendarPlus, CalendarRange, Gauge, TimerReset, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/shared/components/page-header";

import {
  AvailabilityFilters,
  defaultFilters,
  toQuery,
  type FiltersState,
} from "@/availability/components/availability-filters";
import { SuggestionList } from "@/availability/components/suggestion-list";
import { TimelineView } from "@/availability/components/timeline-view";
import { HeatmapView } from "@/availability/components/heatmap-view";
import { RulesPanel } from "@/availability/components/rules-panel";
import { BookingWizard } from "@/availability/components/booking-wizard";
import {
  getAvailabilityStatsFn,
  getHeatmapFn,
  getTimelineFn,
  searchAvailabilityFn,
} from "@/availability/services/availability.functions";
import type { SlotSuggestion } from "@/availability/dto/types";


export const Route = createFileRoute("/_authenticated/disponibilidade")({
  head: () => ({
    meta: [
      { title: "Disponibilidade — ClinicFlow" },
      {
        name: "description",
        content:
          "Motor de disponibilidade: sugestões inteligentes de horários, timeline dos profissionais, mapa de ocupação e regras configuráveis.",
      },
      { property: "og:title", content: "Disponibilidade — ClinicFlow" },
      {
        property: "og:description",
        content:
          "Encontre o melhor horário e profissional com sugestões pontuadas pelo motor de disponibilidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AvailabilityPage,
});

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </Card>
  );
}

function AvailabilityPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FiltersState>(defaultFilters());
  const [suggestions, setSuggestions] = useState<SlotSuggestion[]>([]);
  const [timelineDate, setTimelineDate] = useState(defaultFilters().date);
  const [heatmapFrom, setHeatmapFrom] = useState(defaultFilters().date);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSlot, setWizardSlot] = useState<SlotSuggestion | null>(null);


  const stats = useQuery({
    queryKey: ["availability", "stats"],
    queryFn: () => getAvailabilityStatsFn(),
  });

  const search = useMutation({
    mutationFn: (f: FiltersState) => searchAvailabilityFn({ data: toQuery(f) }),
    onSuccess: (res) => setSuggestions(res.suggestions as SlotSuggestion[]),
  });

  const timeline = useQuery({
    queryKey: ["availability", "timeline", timelineDate],
    queryFn: () => getTimelineFn({ data: { date: timelineDate } }),
  });

  const heatmap = useQuery({
    queryKey: ["availability", "heatmap", heatmapFrom],
    queryFn: () => getHeatmapFn({ data: { from: heatmapFrom, days: 14 } }),
  });

  const schedule = (s: SlotSuggestion) => {
    setWizardSlot(s);
    setWizardOpen(true);
  };

  const startWizard = () => {
    setWizardSlot(null);
    setWizardOpen(true);
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title={t("availability.title")}
        subtitle={t("availability.subtitle")}
        actions={
          <Button onClick={startWizard}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            {t("availability.newBooking")}
          </Button>
        }
      />



      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label={t("availability.stats.freeNow")}
          value={stats.data?.freeNow ?? "—"}
        />
        <StatCard
          icon={Gauge}
          label={t("availability.stats.averageOccupancy")}
          value={stats.data ? `${stats.data.averageOccupancy}%` : "—"}
        />
        <StatCard
          icon={TimerReset}
          label={t("availability.stats.averageFree")}
          value={stats.data ? `${stats.data.averageFreeMinutes} min` : "—"}
        />
        <StatCard
          icon={CalendarRange}
          label={t("availability.stats.overloaded")}
          value={stats.data?.overloaded ?? "—"}
        />
      </div>

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">{t("availability.tabs.search")}</TabsTrigger>
          <TabsTrigger value="timeline">{t("availability.tabs.timeline")}</TabsTrigger>
          <TabsTrigger value="heatmap">{t("availability.tabs.heatmap")}</TabsTrigger>
          <TabsTrigger value="rules">{t("availability.tabs.rules")}</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <AvailabilityFilters
            value={filters}
            onChange={setFilters}
            onSearch={() => search.mutate(filters)}
            loading={search.isPending}
          />
          {search.isSuccess && (
            <p className="text-xs text-muted-foreground">
              {suggestions.length} {t("availability.resultsIn")} {search.data?.durationMs} ms
            </p>
          )}
          <SuggestionList
            suggestions={suggestions}
            loading={search.isPending}
            onSchedule={schedule}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <div className="w-52 space-y-1.5">
            <Label>{t("availability.filters.date")}</Label>
            <Input
              type="date"
              value={timelineDate}
              onChange={(e) => setTimelineDate(e.target.value)}
            />
          </div>
          <TimelineView
            timelines={timeline.data?.timelines ?? []}
            loading={timeline.isLoading}
          />
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <div className="w-52 space-y-1.5">
            <Label>{t("availability.filters.from")}</Label>
            <Input
              type="date"
              value={heatmapFrom}
              onChange={(e) => setHeatmapFrom(e.target.value)}
            />
          </div>
          <HeatmapView cells={heatmap.data?.cells ?? []} loading={heatmap.isLoading} />
        </TabsContent>

        <TabsContent value="rules">
          <RulesPanel />
        </TabsContent>
      </Tabs>

      <BookingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        initialFilters={filters}
        initialSlot={wizardSlot}
        onBooked={() => search.mutate(filters)}
      />

    </div>
  );
}
