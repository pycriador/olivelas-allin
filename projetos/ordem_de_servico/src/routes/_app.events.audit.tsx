import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ScrollText, Download, Calendar, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { workflowHistoryService } from "@/modules/events/service";
import { DocButton } from "@/components/doc-button";
import type { WorkflowHistory } from "@/modules/events/types";

export const Route = createFileRoute("/_app/events/audit")({
  head: () => ({ meta: [{ title: "Event Audit — ServiceForge" }] }),
  component: AuditPage,
});

function AuditPage() {
  const [eventFilter, setEventFilter] = useState<string | null>(null);

  const { data: history = [] } = useQuery({
    queryKey: ["evt", "history"],
    queryFn: () => workflowHistoryService.list(),
  });

  const filtered = eventFilter ? history.filter((h) => h.event === eventFilter) : history;
  const eventTypes = [...new Set(history.map((h) => h.event))];

  const handleExport = () => {
    const csv = [
      ["Evento", "Descrição", "Workflow", "Data"].join(","),
      ...filtered.map((h) =>
        [`"${h.event}"`, `"${h.description}"`, `"${h.workflowId}"`, `"${new Date(h.createdAt).toISOString()}"`].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "events-audit.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Auditoria exportada");
  };

  const columns: Column<WorkflowHistory>[] = [
    { key: "event", header: "Evento", render: (e) => (
      <Badge variant="outline" className="gap-1">
        <Activity className="h-3 w-3" />
        {e.event}
      </Badge>
    )},
    { key: "description", header: "Descrição", render: (e) => <span className="text-sm">{e.description}</span> },
    { key: "workflowId", header: "Workflow", render: (e) => <code className="text-[10px] bg-muted px-1 rounded">{e.workflowId}</code> },
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
          <h1 className="text-2xl font-semibold tracking-tight">Event Audit</h1>
          <DocButton module="events" page="audit" />
          <p className="text-sm text-muted-foreground">Auditoria de eventos e workflows</p>
        </div>
        <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Exportar CSV</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={eventFilter === null ? "default" : "outline"} onClick={() => setEventFilter(null)}>Todos</Button>
        {eventTypes.map((ev) => (
          <Button key={ev} size="sm" variant={eventFilter === ev ? "default" : "outline"} onClick={() => setEventFilter(ev)}>
            {ev}
          </Button>
        ))}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchKeys={["description", "event", "workflowId"]}
        initialSortColumn="createdAt"
      />
    </div>
  );
}
