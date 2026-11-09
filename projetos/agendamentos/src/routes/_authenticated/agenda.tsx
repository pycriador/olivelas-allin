import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, CalendarRange, Ban } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useTenantId } from "@/shared/hooks/use-tenant-id";
import { useProfessionalsList } from "@/shared/hooks/use-agenda-data";
import { dayjs } from "@/shared/lib/dayjs";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/shared/components/page-header";
import { EventDialog, type EventDialogInitial, type EventRow } from "@/shared/components/event-dialog";
import { BlockDialog, type BlockDialogInitial, type BlockRow } from "@/shared/components/block-dialog";

type ViewMode = "day" | "week";

const HOUR_START = 7;
const HOUR_END = 22;
const SLOT_MIN = 30;
const PX_PER_MIN = 1.2; // ~72px per hour
const ALL_PROS = "__all__";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: AgendaPage,
});

function AgendaPage() {
  const { t, i18n } = useTranslation();
  const tenantId = useTenantId();
  const pros = useProfessionalsList();
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState(() => dayjs());
  const [proFilter, setProFilter] = useState<string>(ALL_PROS);
  const [eventOpen, setEventOpen] = useState(false);
  const [eventInitial, setEventInitial] = useState<EventDialogInitial | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockInitial, setBlockInitial] = useState<BlockDialogInitial | null>(null);

  const locale = i18n.language.toLowerCase().startsWith("pt")
    ? "pt-br" : i18n.language.toLowerCase().startsWith("es") ? "es" : "en";
  const c = cursor.locale(locale);

  const range = useMemo(() => {
    if (view === "day") {
      return { start: c.startOf("day"), end: c.endOf("day"), days: [c.startOf("day")] };
    }
    const start = c.startOf("week");
    const days = Array.from({ length: 7 }, (_, i) => start.add(i, "day"));
    return { start, end: start.add(7, "day"), days };
  }, [view, c]);

  const events = useQuery({
    queryKey: ["agenda", "events", tenantId, range.start.toISOString(), range.end.toISOString(), proFilter],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase.from("events").select("*")
        .gte("starts_at", range.start.toISOString())
        .lt("starts_at", range.end.toISOString());
      if (proFilter !== ALL_PROS) q = q.eq("professional_id", proFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  const blocks = useQuery({
    queryKey: ["agenda", "blocks", tenantId, range.start.toISOString(), range.end.toISOString(), proFilter],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase.from("blocks").select("*")
        .lt("starts_at", range.end.toISOString())
        .gt("ends_at", range.start.toISOString());
      const { data, error } = await q;
      if (error) throw error;
      let list = (data ?? []) as BlockRow[];
      if (proFilter !== ALL_PROS) {
        list = list.filter((b) => !b.professional_id || b.professional_id === proFilter);
      }
      return list;
    },
  });

  const proById = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    (pros.data ?? []).forEach((p) => m.set(p.id, { name: p.full_name, color: p.agenda_color }));
    return m;
  }, [pros.data]);

  function openNewEventAt(day: dayjs.Dayjs, minutesFromStart: number) {
    const start = day.startOf("day").add(HOUR_START * 60 + Math.floor(minutesFromStart / SLOT_MIN) * SLOT_MIN, "minute");
    const end = start.add(50, "minute");
    setEventInitial({
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      professional_id: proFilter !== ALL_PROS ? proFilter : null,
      title: "",
      status: "scheduled",
    });
    setEventOpen(true);
  }

  function openEditEvent(ev: EventRow) {
    setEventInitial(ev);
    setEventOpen(true);
  }
  function openEditBlock(b: BlockRow) {
    setBlockInitial(b);
    setBlockOpen(true);
  }

  const label = view === "day"
    ? c.format("dddd, LL")
    : `${range.days[0].format("DD MMM")} — ${range.days[6].format("DD MMM YYYY")}`;

  const hourRows: number[] = [];
  for (let h = HOUR_START; h < HOUR_END; h++) hourRows.push(h);
  const totalMinutes = (HOUR_END - HOUR_START) * 60;
  const gridHeight = totalMinutes * PX_PER_MIN;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("nav.agenda")}
        subtitle={t("agenda.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setBlockInitial(null); setBlockOpen(true); }}>
              <Ban className="h-4 w-4" /> {t("blocks.new")}
            </Button>
            <Button size="sm" onClick={() => { setEventInitial(null); setEventOpen(true); }}>
              <Plus className="h-4 w-4" /> {t("events.new")}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor(cursor.subtract(1, view))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(dayjs())}>{t("agenda.today")}</Button>
          <Button variant="outline" size="icon" onClick={() => setCursor(cursor.add(1, view))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm font-medium capitalize">{label}</div>
        <div className="ml-auto flex items-center gap-2">
          <Select value={proFilter} onValueChange={setProFilter}>
            <SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PROS}>{t("agenda.allProfessionals")}</SelectItem>
              {(pros.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as ViewMode)}>
            <ToggleGroupItem value="day" aria-label="day"><CalendarDays className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="week"><CalendarRange className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: `56px repeat(${range.days.length}, minmax(0, 1fr))` }}>
          <div className="border-b border-r bg-muted/40" />
          {range.days.map((d) => {
            const isToday = d.isSame(dayjs(), "day");
            return (
              <div key={d.toString()} className={`border-b border-r px-2 py-2 text-center ${isToday ? "bg-primary/5" : ""}`}>
                <div className="text-[11px] uppercase text-muted-foreground">{d.format("ddd")}</div>
                <div className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{d.format("DD/MM")}</div>
              </div>
            );
          })}

          <div className="relative border-r bg-muted/20" style={{ height: gridHeight }}>
            {hourRows.map((h, i) => (
              <div key={h} className="absolute w-full pr-1 text-right text-[10px] text-muted-foreground"
                style={{ top: i * 60 * PX_PER_MIN, transform: "translateY(-6px)" }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {range.days.map((day) => {
            const dayStart = day.startOf("day").add(HOUR_START, "hour");
            const dayEnd = day.startOf("day").add(HOUR_END, "hour");
            const dayEvents = (events.data ?? []).filter((e) =>
              dayjs(e.starts_at).isSame(day, "day"),
            );
            const dayBlocks = (blocks.data ?? []).filter((b) => {
              const s = dayjs(b.starts_at);
              const e = dayjs(b.ends_at);
              return s.isBefore(dayEnd) && e.isAfter(dayStart);
            });

            return (
              <div
                key={day.toString()}
                className="relative border-r"
                style={{ height: gridHeight }}
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const minutes = Math.max(0, y / PX_PER_MIN);
                  openNewEventAt(day, minutes);
                }}
              >
                {hourRows.map((h, i) => (
                  <div key={h} className="absolute w-full border-t border-dashed border-border/50"
                    style={{ top: i * 60 * PX_PER_MIN }} />
                ))}

                {dayBlocks.map((b) => {
                  const bs = dayjs(b.starts_at);
                  const be = dayjs(b.ends_at);
                  const s = bs.isBefore(dayStart) ? dayStart : bs;
                  const en = be.isAfter(dayEnd) ? dayEnd : be;
                  const top = s.diff(dayStart, "minute") * PX_PER_MIN;
                  const height = Math.max(18, en.diff(s, "minute") * PX_PER_MIN);
                  return (
                    <div key={b.id}
                      onClick={(e) => { e.stopPropagation(); openEditBlock(b); }}
                      className="absolute left-1 right-1 cursor-pointer rounded-md border border-dashed border-destructive/50 bg-destructive/10 p-1 text-[11px] text-destructive-foreground"
                      style={{ top, height, backgroundImage: "repeating-linear-gradient(45deg, transparent 0 6px, hsl(var(--destructive)/0.08) 6px 12px)" }}
                      title={b.title ?? t(`blocks.reasons.${b.reason}`)}>
                      <div className="truncate font-medium text-destructive">
                        {b.title ?? t(`blocks.reasons.${b.reason}`)}
                      </div>
                    </div>
                  );
                })}

                {dayEvents.map((ev) => {
                  const s = dayjs(ev.starts_at);
                  const en = dayjs(ev.ends_at);
                  const top = s.diff(dayStart, "minute") * PX_PER_MIN;
                  const height = Math.max(24, en.diff(s, "minute") * PX_PER_MIN);
                  const color = ev.color
                    ?? (ev.professional_id ? proById.get(ev.professional_id)?.color : null)
                    ?? "#3b82f6";
                  const dim = ev.status === "cancelled" || ev.status === "no_show";
                  return (
                    <div key={ev.id}
                      onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}
                      className={`absolute left-1 right-1 cursor-pointer overflow-hidden rounded-md border p-1 text-[11px] text-white shadow-sm transition hover:z-10 hover:shadow-md ${dim ? "opacity-60 line-through" : ""}`}
                      style={{ top, height, backgroundColor: color, borderColor: color }}
                      title={ev.title}>
                      <div className="truncate font-semibold">{s.format("HH:mm")} · {ev.title}</div>
                      {height > 34 && ev.professional_id && (
                        <div className="truncate opacity-90">{proById.get(ev.professional_id)?.name}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>

      <EventDialog open={eventOpen} onOpenChange={setEventOpen} initial={eventInitial} />
      <BlockDialog open={blockOpen} onOpenChange={setBlockOpen} initial={blockInitial} />
    </div>
  );
}
