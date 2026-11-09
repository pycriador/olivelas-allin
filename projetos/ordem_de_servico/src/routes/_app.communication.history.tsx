import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  History, Mail, MessageSquare, Bell, User, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { historyService } from "@/modules/communication/service";
import { DocButton } from "@/components/doc-button";
import type { CommHistory } from "@/modules/communication/types";
import { CHANNEL_TYPE_LABELS } from "@/modules/communication/types";

export const Route = createFileRoute("/_app/communication/history")({
  head: () => ({ meta: [{ title: "History — ServiceForge" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const { data: allHistory = [] } = useQuery({
    queryKey: ["comm", "history"],
    queryFn: () => historyService.list(),
  });

  const clients = [...new Set(allHistory.map((h) => h.clientId))].map((id) => {
    const h = allHistory.find((entry) => entry.clientId === id);
    return { clientId: id, clientName: h?.clientName ?? id };
  });

  const timeline = selectedClient
    ? allHistory.filter((h) => h.clientId === selectedClient).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : allHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <DocButton module="communication" page="history" />
        <p className="text-sm text-muted-foreground">Histórico de comunicação por cliente</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={selectedClient === null ? "default" : "outline"} onClick={() => setSelectedClient(null)}>Todos</Button>
        {clients.map((c) => (
          <Button key={c.clientId} size="sm" variant={selectedClient === c.clientId ? "default" : "outline"} onClick={() => setSelectedClient(c.clientId)}>
            <User className="h-3 w-3 mr-1" />{c.clientName}
          </Button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-4">
          {timeline.map((entry) => (
            <TimelineEntry key={entry.id} entry={entry} />
          ))}
          {timeline.length === 0 && (
            <div className="pl-10 text-sm text-muted-foreground">Nenhum histórico encontrado</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineEntry({ entry }: { entry: CommHistory }) {
  const icon = entry.channel === "email" ? <Mail className="h-4 w-4" /> :
    entry.channel === "whatsapp" ? <MessageSquare className="h-4 w-4" /> :
    <Bell className="h-4 w-4" />;

  return (
    <div className="relative pl-10">
      <div className="absolute left-2.5 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border">
        {icon}
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{entry.event}</span>
                <Badge variant="outline" className="text-[10px]">{CHANNEL_TYPE_LABELS[entry.channel]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{entry.description}</p>
              <p className="text-xs text-muted-foreground">{entry.clientName}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock className="h-3 w-3" />
              {new Date(entry.createdAt).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
