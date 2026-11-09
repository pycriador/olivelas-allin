import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { publicServiceOrderService } from "@/modules/portal/service";
import type { PublicServiceOrder } from "@/modules/portal/types";
import { PORTAL_CONSTANTS } from "@/modules/portal/types";

export const Route = createFileRoute("/_app/portal/orders")({
  head: () => ({ meta: [{ title: "Ordens Públicas — ServiceForge" }] }),
  component: PortalOrdersPage,
});

const statusColors: Record<string, string> = {
  received: "bg-blue-500", diagnosis: "bg-amber-500",
  awaitingApproval: "bg-purple-500", approved: "bg-emerald-500",
  execution: "bg-sky-500", testing: "bg-orange-500",
  completed: "bg-green-500", readyForPickup: "bg-indigo-500",
  delivered: "bg-teal-500", returned: "bg-red-500", warranty: "bg-pink-500",
};

const priorityVariants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  low: "secondary", medium: "default", high: "destructive", urgent: "destructive",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente",
};

function PortalOrdersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: orders = [] } = useQuery({ queryKey: ["portal", "orders"], queryFn: () => publicServiceOrderService.list() });

  const deleteMut = useMutation({
    mutationFn: (id: string) => publicServiceOrderService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portal", "orders"] }); toast.success("Ordem pública excluída"); },
  });

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || o.customerName.toLowerCase().includes(q) || o.publicCode.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<PublicServiceOrder>[] = [
    { key: "publicCode", header: "Código Público", sortable: true, sortFn: (a, b) => a.publicCode.localeCompare(b.publicCode), render: (o) => <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">{o.publicCode}</code> },
    { key: "customerName", header: "Cliente", sortable: true, sortFn: (a, b) => a.customerName.localeCompare(b.customerName), render: (o) => <span>{o.customerName}</span> },
    { key: "equipmentInfo", header: "Equipamento", render: (o) => <span className="text-sm">{o.equipmentInfo}</span> },
    { key: "status", header: "Status", render: (o) => {
      const color = statusColors[o.status] || "bg-gray-400";
      return <Badge className={`${color} text-white`}>{o.statusLabel || PORTAL_CONSTANTS.TIMELINE_LABELS[o.status] || o.status}</Badge>;
    }},
    { key: "priority", header: "Prioridade", render: (o) => <Badge variant={priorityVariants[o.priority] || "secondary"}>{priorityLabels[o.priority] || o.priority}</Badge> },
    { key: "totalValue", header: "Valor", sortable: true, sortFn: (a, b) => a.totalValue - b.totalValue, render: (o) => <span>R$ {o.totalValue.toFixed(2)}</span> },
    { key: "createdAt", header: "Data", sortable: true, sortFn: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(), render: (o) => <span className="text-sm">{new Date(o.createdAt).toLocaleDateString("pt-BR")}</span> },
    { key: "actions", header: "Ações", render: (o) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setViewId(o.id)}><Eye className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  const viewOrder = viewId ? orders.find((o) => o.id === viewId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ordens Públicas</h1>
          <p className="text-sm text-muted-foreground">Gerencie as ordens de serviço públicas</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {PORTAL_CONSTANTS.TIMELINE_STATUS.map((s) => (
                <SelectItem key={s} value={s}>{PORTAL_CONSTANTS.TIMELINE_LABELS[s] || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(o) => o.id}
        searchable
        searchKeys={["customerName", "publicCode"]}
        initialSortColumn="createdAt"
        searchPlaceholder="Buscar por cliente ou código público..."
      />

      <Dialog open={!!viewId} onOpenChange={(o) => { if (!o) setViewId(null); }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Ordem Pública</DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código Público</p>
                  <p className="font-mono text-sm">{viewOrder.publicCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{viewOrder.customerName}</p>
                  {viewOrder.customerEmail && <p className="text-sm">{viewOrder.customerEmail}</p>}
                  {viewOrder.customerPhone && <p className="text-sm">{viewOrder.customerPhone}</p>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Equipamento</p>
                  <p>{viewOrder.equipmentInfo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Defeito Relatado</p>
                  <p>{viewOrder.reportedDefect}</p>
                </div>
                {viewOrder.diagnosis && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Diagnóstico</p>
                    <p>{viewOrder.diagnosis}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`${statusColors[viewOrder.status] || "bg-gray-400"} text-white`}>{viewOrder.statusLabel || PORTAL_CONSTANTS.TIMELINE_LABELS[viewOrder.status] || viewOrder.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prioridade</p>
                  <Badge variant={priorityVariants[viewOrder.priority] || "secondary"}>{priorityLabels[viewOrder.priority] || viewOrder.priority}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-semibold">R$ {viewOrder.totalValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Criação</p>
                  <p>{new Date(viewOrder.createdAt).toLocaleString("pt-BR")}</p>
                </div>
                {viewOrder.estimatedCompletion && (
                  <div>
                    <p className="text-sm text-muted-foreground">Previsão de Conclusão</p>
                    <p>{new Date(viewOrder.estimatedCompletion).toLocaleDateString("pt-BR")}</p>
                  </div>
                )}
                {viewOrder.warrantyEnd && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fim da Garantia</p>
                    <p>{new Date(viewOrder.warrantyEnd).toLocaleDateString("pt-BR")}</p>
                  </div>
                )}
              </div>

              {viewOrder.services.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold mb-2">Serviços</h3>
                  <table className="w-full text-sm border rounded-lg">
                    <thead className="bg-muted">
                      <tr><th className="text-left p-2">Nome</th><th className="text-left p-2">Qtd</th><th className="text-left p-2">Valor Unit.</th><th className="text-left p-2">Total</th></tr>
                    </thead>
                    <tbody>
                      {viewOrder.services.map((s) => (
                        <tr key={s.id} className="border-t">
                          <td className="p-2">{s.name}{s.description ? <span className="text-xs text-muted-foreground ml-1">({s.description})</span> : null}</td>
                          <td className="p-2">{s.quantity}</td>
                          <td className="p-2">R$ {s.unitValue.toFixed(2)}</td>
                          <td className="p-2">R$ {s.totalValue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewOrder.parts.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold mb-2">Peças</h3>
                  <table className="w-full text-sm border rounded-lg">
                    <thead className="bg-muted">
                      <tr><th className="text-left p-2">Nome</th><th className="text-left p-2">Qtd</th><th className="text-left p-2">Valor Unit.</th><th className="text-left p-2">Total</th></tr>
                    </thead>
                    <tbody>
                      {viewOrder.parts.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="p-2">{p.name}</td>
                          <td className="p-2">{p.quantity}</td>
                          <td className="p-2">R$ {p.unitValue.toFixed(2)}</td>
                          <td className="p-2">R$ {p.totalValue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewOrder.timeline.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold mb-2">Linha do Tempo</h3>
                  <div className="space-y-2">
                    {viewOrder.timeline.map((e) => (
                      <div key={e.id} className="flex items-start gap-3 border-l-2 pl-3" style={{ borderColor: e.color }}>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{e.label}</p>
                          <p className="text-xs text-muted-foreground">{e.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString("pt-BR")}{e.showResponsible && e.responsible ? ` - ${e.responsible}` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewOrder.documents.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold mb-2">Documentos</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {viewOrder.documents.map((d) => (
                      <div key={d.id} className="border rounded p-2 text-sm">
                        <p className="font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.type} - {d.format}{d.size ? ` (${(d.size / 1024).toFixed(1)} KB)` : ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
