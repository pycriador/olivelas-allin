import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, ShieldCheck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { guaranteeService } from "@/modules/portal/service";
import type { PortalGuarantee } from "@/modules/portal/types";

export const Route = createFileRoute("/_app/portal/guarantees")({
  head: () => ({ meta: [{ title: "Garantias — ServiceForge" }] }),
  component: PortalGuaranteesPage,
});

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  expired: "secondary",
  cancelled: "destructive",
  inProgress: "outline",
  completed: "secondary",
};

const statusLabel: Record<string, string> = {
  active: "Ativa",
  expired: "Expirada",
  cancelled: "Cancelada",
  inProgress: "Em Andamento",
  completed: "Concluída",
};

function formatBytes(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PortalGuaranteesPage() {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: items = [] } = useQuery({
    queryKey: ["portal", "guarantees", "list"],
    queryFn: () => guaranteeService.list(),
  });

  const filtered = statusFilter === "all" ? items : items.filter((g) => g.status === statusFilter);

  const detail = detailId ? items.find((g) => g.id === detailId) ?? null : null;

  const columns: Column<PortalGuarantee>[] = [
    {
      key: "publicCode", header: "Código Público", sortable: true,
      sortFn: (a, b) => a.publicCode.localeCompare(b.publicCode),
      render: (g) => <span className="font-mono text-sm font-medium">{g.publicCode}</span>,
    },
    {
      key: "customerName", header: "Cliente", sortable: true,
      sortFn: (a, b) => a.customerName.localeCompare(b.customerName),
      render: (g) => <span className="text-sm">{g.customerName}</span>,
    },
    {
      key: "equipmentInfo", header: "Equipamento",
      render: (g) => <span className="text-sm text-muted-foreground max-w-[200px] truncate block" title={g.equipmentInfo}>{g.equipmentInfo}</span>,
    },
    {
      key: "status", header: "Status",
      render: (g) => <Badge variant={statusVariant[g.status] ?? "secondary"}>{statusLabel[g.status] ?? g.status}</Badge>,
    },
    {
      key: "warrantyStart", header: "Início", sortable: true,
      sortFn: (a, b) => a.warrantyStart.localeCompare(b.warrantyStart),
      render: (g) => <span className="text-sm whitespace-nowrap">{new Date(g.warrantyStart).toLocaleDateString("pt-BR")}</span>,
    },
    {
      key: "warrantyEnd", header: "Fim", sortable: true,
      sortFn: (a, b) => a.warrantyEnd.localeCompare(b.warrantyEnd),
      render: (g) => <span className="text-sm whitespace-nowrap">{new Date(g.warrantyEnd).toLocaleDateString("pt-BR")}</span>,
    },
    {
      key: "remainingDays", header: "Dias Restantes", sortable: true,
      sortFn: (a, b) => (a.remainingDays ?? 0) - (b.remainingDays ?? 0),
      render: (g) => {
        const d = g.remainingDays;
        return (
          <span className={`text-sm font-semibold ${d != null && d <= 0 ? "text-red-500" : ""}`}>
            {d != null ? d : "-"}
          </span>
        );
      },
    },
    {
      key: "actions", header: "Ações",
      render: (g) => (
        <Button variant="ghost" size="icon" onClick={() => setDetailId(g.id)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Garantias</h1>
          <p className="text-sm text-muted-foreground">Garantias do portal</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="expired">Expirada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
              <SelectItem value="inProgress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(g) => g.id}
        searchKeys={["publicCode", "customerName", "equipmentInfo"]}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        searchPlaceholder="Pesquisar garantia..."
      />

      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Detalhes da Garantia
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código Público</p>
                  <p className="font-mono text-sm font-medium">{detail.publicCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusVariant[detail.status] ?? "secondary"}>{statusLabel[detail.status] ?? detail.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="text-sm font-medium">{detail.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Equipamento</p>
                  <p className="text-sm">{detail.equipmentInfo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Início</p>
                  <p className="text-sm">{new Date(detail.warrantyStart).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fim</p>
                  <p className="text-sm">{new Date(detail.warrantyEnd).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dias Restantes</p>
                  <p className={`text-sm font-semibold ${detail.remainingDays != null && detail.remainingDays <= 0 ? "text-red-500" : ""}`}>
                    {detail.remainingDays ?? "-"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Descrição do Serviço</h3>
                <p className="text-sm text-muted-foreground">{detail.serviceDescription}</p>
              </div>

              {detail.repairs.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-1"><Wrench className="h-4 w-4" /> Reparos</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Data</th>
                        <th className="pb-2 font-medium">Descrição</th>
                        <th className="pb-2 font-medium">Peças</th>
                        <th className="pb-2 font-medium">Custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.repairs.map((r) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="py-2 whitespace-nowrap">{new Date(r.date).toLocaleDateString("pt-BR")}</td>
                          <td className="py-2">{r.description}</td>
                          <td className="py-2">{r.parts.join(", ") || "-"}</td>
                          <td className="py-2">R$ {r.cost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detail.evidences.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Evidências</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {detail.evidences.map((e) => (
                      <div key={e.id} className="border rounded p-2 text-sm">
                        <p className="font-medium">{e.type}</p>
                        {e.description && <p className="text-muted-foreground text-xs">{e.description}</p>}
                        <p className="text-xs text-muted-foreground">{new Date(e.uploadedAt).toLocaleDateString("pt-BR")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.documents.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Documentos</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Nome</th>
                        <th className="pb-2 font-medium">Tipo</th>
                        <th className="pb-2 font-medium">Tamanho</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.documents.map((d) => (
                        <tr key={d.id} className="border-b last:border-0">
                          <td className="py-2">{d.name}</td>
                          <td className="py-2"><Badge variant="outline">{d.type}</Badge></td>
                          <td className="py-2 text-muted-foreground">{formatBytes(d.size)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
