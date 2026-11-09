import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  FileText, Circle, History, User, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { documentService, historyService } from "@/modules/documents/service";
import { DocButton } from "@/components/doc-button";
import type { DocHistory, Document } from "@/modules/documents/types";
import { DOC_EVENT_LABELS } from "@/modules/documents/types";

export const Route = createFileRoute("/_app/documents/history")({
  head: () => ({ meta: [{ title: "Document History — ServiceForge" }] }),
  component: DocumentHistoryPage,
});

const EVENT_ICONS: Record<string, React.ReactNode> = {
  created: <FileText className="h-4 w-4" />,
  edited: <FileText className="h-4 w-4" />,
  duplicated: <FileText className="h-4 w-4" />,
  generated: <FileText className="h-4 w-4" />,
  exported: <FileText className="h-4 w-4" />,
  printed: <FileText className="h-4 w-4" />,
  signed: <FileText className="h-4 w-4" />,
  archived: <FileText className="h-4 w-4" />,
  restored: <FileText className="h-4 w-4" />,
  deleted: <FileText className="h-4 w-4" />,
  viewed: <FileText className="h-4 w-4" />,
  shared: <FileText className="h-4 w-4" />,
};

const EVENT_COLORS: Record<string, string> = {
  created: "bg-blue-500", edited: "bg-amber-500", duplicated: "bg-purple-500",
  generated: "bg-green-500", exported: "bg-cyan-500", printed: "bg-slate-500",
  signed: "bg-emerald-500", archived: "bg-orange-500", restored: "bg-teal-500",
  deleted: "bg-red-500", viewed: "bg-gray-500", shared: "bg-indigo-500",
};

function DocumentHistoryPage() {
  const [selectedDocId, setSelectedDocId] = useState<string>("");

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", "storage"],
    queryFn: () => documentService.list(),
  });

  const { data: history = [] } = useQuery({
    queryKey: ["documents", "history", selectedDocId],
    queryFn: () => historyService.list(selectedDocId || undefined),
    enabled: !!selectedDocId,
  });

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Document History</h1>
          <DocButton module="documents" page="history" />
        <p className="text-sm text-muted-foreground">Histórico de eventos por documento</p>
      </div>

      <div className="max-w-md">
        <Select value={selectedDocId} onValueChange={setSelectedDocId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um documento..." />
          </SelectTrigger>
          <SelectContent>
            {documents.map((doc) => (
              <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedDocId && (
        <Card className="flex items-center justify-center h-[300px] text-muted-foreground">
          <div className="text-center space-y-2">
            <History className="h-12 w-12 mx-auto opacity-20" />
            <p className="text-sm">Selecione um documento acima para visualizar o histórico</p>
          </div>
        </Card>
      )}

      {selectedDocId && sortedHistory.length === 0 && (
        <Card className="flex items-center justify-center h-[300px] text-muted-foreground">
          <div className="text-center space-y-2">
            <History className="h-12 w-12 mx-auto opacity-20" />
            <p className="text-sm">Nenhum evento encontrado para este documento</p>
          </div>
        </Card>
      )}

      {selectedDocId && sortedHistory.length > 0 && (
        <div className="relative">
          <div className="absolute left-[23px] top-3 bottom-3 w-0.5 bg-border" />

          <div className="space-y-0">
            {sortedHistory.map((event, idx) => (
              <div key={event.id} className="relative flex gap-4 pb-6">
                <div className="relative z-10 flex items-center justify-center w-12 h-8">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white ${EVENT_COLORS[event.event] ?? "bg-gray-500"}`}>
                    {EVENT_ICONS[event.event] ?? <Circle className="h-4 w-4" />}
                  </div>
                </div>

                <Card className="flex-1 p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {DOC_EVENT_LABELS[event.event] ?? event.event}
                        </Badge>
                        <span className="text-sm font-medium">{event.description}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {event.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                      {Object.entries(event.metadata).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="font-medium">{k}:</span>
                          <span>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
