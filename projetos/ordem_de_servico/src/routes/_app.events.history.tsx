import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Activity, Clock, CheckCircle2, AlertCircle,
  Calendar, User, Radio, Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { eventBus, eventStoreService } from "@/modules/events/service";
import { DocButton } from "@/components/doc-button";
import { EVENT_STATUS_LABELS, EVENT_CATEGORIES, EVENT_CATEGORY_LABELS } from "@/modules/events/types";

export const Route = createFileRoute("/_app/events/history")({
  head: () => ({ meta: [{ title: "Event History — ServiceForge" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: events = [] } = useQuery({
    queryKey: ["evt", "events"],
    queryFn: () => eventBus.history(),
  });

  const { data: stored = [] } = useQuery({
    queryKey: ["evt", "store"],
    queryFn: () => eventStoreService.list(),
  });

  const filtered = events.filter((e) => {
    if (categoryFilter && e.category !== categoryFilter) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.source.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStoreEntry = (eventId: string) => stored.find((s) => s.eventId === eventId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Event History</h1>
          <DocButton module="events" page="history" />
        <p className="text-sm text-muted-foreground">Timeline completa de eventos</p>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar eventos..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={categoryFilter === null ? "default" : "outline"} onClick={() => setCategoryFilter(null)}>Todas Categorias</Button>
        {EVENT_CATEGORIES.map((cat) => (
          <Button key={cat} size="sm" variant={categoryFilter === cat ? "default" : "outline"} onClick={() => setCategoryFilter(cat)}>
            {EVENT_CATEGORY_LABELS[cat]}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={statusFilter === null ? "default" : "outline"} onClick={() => setStatusFilter(null)}>Todos Status</Button>
        {(["completed", "failed", "processing", "created"] as const).map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
            {EVENT_STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-4">
          {filtered.map((ev) => {
            const store = getStoreEntry(ev.id);
            return (
              <div key={ev.id} className="relative pl-12">
                <div className="absolute left-3 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border">
                  {ev.status === "completed" ? <CheckCircle2 className="h-3 w-3 text-green-500" /> :
                   ev.status === "failed" ? <AlertCircle className="h-3 w-3 text-red-500" /> :
                   <Clock className="h-3 w-3 text-yellow-500" />}
                </div>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm font-medium bg-muted px-1.5 py-0.5 rounded">{ev.name}</code>
                          <Badge variant="outline" className="text-[10px]">{EVENT_CATEGORY_LABELS[ev.category]}</Badge>
                          <Badge variant={
                            ev.status === "completed" ? "default" :
                            ev.status === "failed" ? "destructive" : "outline"
                          } className="text-[10px]">{EVENT_STATUS_LABELS[ev.status]}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Radio className="h-3 w-3" />{ev.source}</span>
                          {ev.userId && <span className="flex items-center gap-1"><User className="h-3 w-3" />{ev.userId}</span>}
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(ev.createdAt).toLocaleString()}</span>
                          {store?.duration != null && <span>{store.duration}ms</span>}
                        </div>
                        {store?.error && <p className="text-xs text-destructive mt-1">{store.error}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="pl-12 text-sm text-muted-foreground">Nenhum evento encontrado</div>
          )}
        </div>
      </div>
    </div>
  );
}
