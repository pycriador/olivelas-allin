import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ScrollText, Download, User, Calendar, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { auditService } from "@/modules/communication/service";
import { DocButton } from "@/components/doc-button";
import type { CommAuditEvent, CommEventType } from "@/modules/communication/types";
import { COMM_EVENT_LABELS } from "@/modules/communication/types";

export const Route = createFileRoute("/_app/communication/audit")({
  head: () => ({ meta: [{ title: "Audit — ServiceForge" }] }),
  component: AuditPage,
});

function AuditPage() {
  const [eventFilter, setEventFilter] = useState<CommEventType | null>(null);

  const { data: events = [] } = useQuery({
    queryKey: ["comm", "audit"],
    queryFn: () => auditService.list(),
  });

  const filtered = eventFilter ? events.filter((e) => e.event === eventFilter) : events;

  const eventTypes = [...new Set(events.map((e) => e.event))] as CommEventType[];

  const handleExport = () => {
    const csv = [
      ["Evento", "Usuário", "Descrição", "Data"].join(","),
      ...filtered.map((e) =>
        [`"${COMM_EVENT_LABELS[e.event]}"`, `"${e.userName}"`, `"${e.description}"`, `"${new Date(e.createdAt).toISOString()}"`].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "communication-audit.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Auditoria exportada");
  };

  const columns: Column<CommAuditEvent>[] = [
    { key: "event", header: "Evento", sortable: true, sortFn: (a, b) => a.event.localeCompare(b.event), render: (e) => (
      <Badge variant="outline" className="gap-1">
        {e.event.includes("template") ? <ScrollText className="h-3 w-3" /> :
         e.event.includes("message") || e.event.includes("retried") ? <Filter className="h-3 w-3" /> :
         <ScrollText className="h-3 w-3" />}
        {COMM_EVENT_LABELS[e.event]}
      </Badge>
    )},
    { key: "description", header: "Descrição", render: (e) => <span className="text-sm">{e.description}</span> },
    { key: "userName", header: "Usuário", render: (e) => (
      <div className="flex items-center gap-1 text-sm"><User className="h-3 w-3 text-muted-foreground" />{e.userName}</div>
    )},
    { key: "createdAt", header: "Data", sortable: true, render: (e) => (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Calendar className="h-3 w-3" />
        {new Date(e.createdAt).toLocaleString()}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit</h1>
          <DocButton module="communication" page="audit" />
          <p className="text-sm text-muted-foreground">Auditoria de comunicação</p>
        </div>
        <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Exportar CSV</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={eventFilter === null ? "default" : "outline"} onClick={() => setEventFilter(null)}>Todos</Button>
        {eventTypes.map((ev) => (
          <Button key={ev} size="sm" variant={eventFilter === ev ? "default" : "outline"} onClick={() => setEventFilter(ev)}>
            {COMM_EVENT_LABELS[ev]}
          </Button>
        ))}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchKeys={["description", "userName"]}
        initialSortColumn="createdAt"
      />
    </div>
  );
}
