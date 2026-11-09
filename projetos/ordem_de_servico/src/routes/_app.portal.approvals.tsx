import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { approvalService } from "@/modules/portal/service";
import type { PortalApproval } from "@/modules/portal/types";
import { PORTAL_CONSTANTS } from "@/modules/portal/types";

export const Route = createFileRoute("/_app/portal/approvals")({
  head: () => ({ meta: [{ title: "Aprovações — ServiceForge" }] }),
  component: PortalApprovalsPage,
});

const typeLabels: Record<string, string> = {
  budget: "Orçamento", additionalService: "Serviço Adicional",
  terms: "Termos", signature: "Assinatura", guarantee: "Garantia",
};

const decisionVariants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  approved: "default", rejected: "destructive",
  revision: "outline", pending: "secondary", cancelled: "secondary",
};

const decisionLabels: Record<string, string> = {
  approved: "Aprovado", rejected: "Rejeitado",
  revision: "Revisão", pending: "Pendente", cancelled: "Cancelado",
};

function PortalApprovalsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [decisionFilter, setDecisionFilter] = useState("all");

  const { data: approvals = [] } = useQuery({ queryKey: ["portal", "approvals"], queryFn: () => approvalService.list() });

  const filtered = approvals.filter((a) => {
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    const matchesDecision = decisionFilter === "all" || a.decision === decisionFilter;
    return matchesType && matchesDecision;
  });

  const columns: Column<PortalApproval>[] = [
    { key: "publicCode", header: "Código Público", render: (a) => <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">{a.publicCode}</code> },
    { key: "type", header: "Tipo", render: (a) => <Badge variant="outline">{typeLabels[a.type] || a.type}</Badge> },
    { key: "decision", header: "Decisão", render: (a) => {
      const variant = decisionVariants[a.decision];
      const colorClass = a.decision === "approved" ? "bg-green-500" : a.decision === "rejected" ? "bg-red-500" : a.decision === "revision" ? "bg-amber-500" : a.decision === "pending" ? "bg-gray-400" : "bg-slate-400";
      return <Badge className={`${colorClass} text-white`}>{decisionLabels[a.decision]}</Badge>;
    }},
    { key: "customerName", header: "Cliente", sortable: true, sortFn: (a, b) => a.customerName.localeCompare(b.customerName), render: (a) => <span>{a.customerName}</span> },
    { key: "ip", header: "IP", render: (a) => <span className="text-xs font-mono">{a.ip}</span> },
    { key: "respondedAt", header: "Data/Hora", sortable: true, sortFn: (a, b) => {
      const da = a.respondedAt || a.requestedAt;
      const db = b.respondedAt || b.requestedAt;
      return new Date(da).getTime() - new Date(db).getTime();
    }, render: (a) => <span className="text-sm">{new Date(a.respondedAt || a.requestedAt).toLocaleString("pt-BR")}</span> },
    { key: "comment", header: "Comentário", render: (a) => a.comment ? <span className="text-sm max-w-[200px] truncate block">{a.comment}</span> : <span className="text-muted-foreground">—</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aprovações</h1>
          <p className="text-sm text-muted-foreground">Aprovações e decisões do portal público</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {PORTAL_CONSTANTS.APPROVAL_TYPES.map((t) => <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={decisionFilter} onValueChange={setDecisionFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filtrar por decisão" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as decisões</SelectItem>
              {PORTAL_CONSTANTS.APPROVAL_DECISIONS.map((d) => <SelectItem key={d} value={d}>{decisionLabels[d]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(a) => a.id}
        searchKeys={["customerName", "publicCode", "comment", "ip"]}
        searchPlaceholder="Buscar por cliente ou código público..."
        initialSortColumn="respondedAt"
      />
    </div>
  );
}
