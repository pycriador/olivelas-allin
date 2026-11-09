import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { portalAuditService } from "@/modules/portal/service";
import type { PortalAudit } from "@/modules/portal/types";

export const Route = createFileRoute("/_app/portal/audit")({
  head: () => ({ meta: [{ title: "Auditoria do Portal — ServiceForge" }] }),
  component: PortalAuditPage,
});

const actionVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  accessed: "default",
  downloaded: "default",
  uploaded: "outline",
  approved: "default",
  rejected: "destructive",
  signed: "outline",
  shared: "secondary",
  linkGenerated: "secondary",
  linkExpired: "secondary",
  linkRevoked: "destructive",
  guaranteeRequested: "outline",
  error: "destructive",
  consulted: "secondary",
};

const actionClass: Record<string, string> = {
  accessed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  downloaded: "bg-green-100 text-green-800 hover:bg-green-100",
  uploaded: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  approved: "bg-green-100 text-green-800 hover:bg-green-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
  signed: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
  shared: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  linkGenerated: "bg-cyan-100 text-cyan-800 hover:bg-cyan-100",
  linkExpired: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  linkRevoked: "bg-red-100 text-red-800 hover:bg-red-100",
  guaranteeRequested: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  error: "bg-red-100 text-red-800 hover:bg-red-100",
  consulted: "bg-slate-100 text-slate-800 hover:bg-slate-100",
};

const actionLabel: Record<string, string> = {
  accessed: "Acessado",
  downloaded: "Baixado",
  uploaded: "Enviado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  signed: "Assinado",
  shared: "Compartilhado",
  linkGenerated: "Link Gerado",
  linkExpired: "Link Expirado",
  linkRevoked: "Link Revogado",
  guaranteeRequested: "Garantia Solicitada",
  error: "Erro",
  consulted: "Consultado",
};

const entityLabel: Record<string, string> = {
  serviceOrder: "Ordem de Serviço",
  document: "Documento",
  share: "Compartilhamento",
  approval: "Aprovação",
  guarantee: "Garantia",
  upload: "Upload",
  portal: "Portal",
  branding: "Branding",
};

function PortalAuditPage() {
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const { data: items = [] } = useQuery({
    queryKey: ["portal", "audit", "list"],
    queryFn: () => portalAuditService.list(),
  });

  const filtered = items.filter((a) => {
    if (actionFilter !== "all" && a.action !== actionFilter) return false;
    if (entityFilter !== "all" && a.entityType !== entityFilter) return false;
    return true;
  });

  const columns: Column<PortalAudit>[] = [
    {
      key: "action", header: "Ação",
      render: (a) => (
        <Badge className={actionClass[a.action] ?? ""} variant="outline">
          {actionLabel[a.action] ?? a.action}
        </Badge>
      ),
    },
    {
      key: "entityType", header: "Tipo",
      render: (a) => <Badge variant="outline">{entityLabel[a.entityType] ?? a.entityType}</Badge>,
    },
    {
      key: "description", header: "Descrição",
      render: (a) => <span className="text-sm text-muted-foreground max-w-[250px] truncate block" title={a.description}>{a.description}</span>,
    },
    {
      key: "publicCode", header: "Código Público",
      render: (a) => a.publicCode ? <span className="font-mono text-xs">{a.publicCode}</span> : <span className="text-xs text-muted-foreground">-</span>,
    },
    {
      key: "ip", header: "IP",
      render: (a) => <span className="text-xs text-muted-foreground font-mono">{a.ip}</span>,
    },
    {
      key: "success", header: "Sucesso",
      render: (a) => (
        <Badge variant={a.success ? "default" : "destructive"}>
          {a.success ? "Sim" : "Não"}
        </Badge>
      ),
    },
    {
      key: "timestamp", header: "Data/Hora", sortable: true,
      sortFn: (a, b) => a.timestamp.localeCompare(b.timestamp),
      render: (a) => <span className="text-sm whitespace-nowrap">{new Date(a.timestamp).toLocaleString("pt-BR")}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Auditoria do Portal</h1>
        <p className="text-sm text-muted-foreground">Registro de atividades do portal público</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            <SelectItem value="accessed">Acessado</SelectItem>
            <SelectItem value="downloaded">Baixado</SelectItem>
            <SelectItem value="uploaded">Enviado</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
            <SelectItem value="signed">Assinado</SelectItem>
            <SelectItem value="shared">Compartilhado</SelectItem>
            <SelectItem value="linkGenerated">Link Gerado</SelectItem>
            <SelectItem value="linkExpired">Link Expirado</SelectItem>
            <SelectItem value="linkRevoked">Link Revogado</SelectItem>
            <SelectItem value="guaranteeRequested">Garantia Solicitada</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
            <SelectItem value="consulted">Consultado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="serviceOrder">Ordem de Serviço</SelectItem>
            <SelectItem value="document">Documento</SelectItem>
            <SelectItem value="share">Compartilhamento</SelectItem>
            <SelectItem value="approval">Aprovação</SelectItem>
            <SelectItem value="guarantee">Garantia</SelectItem>
            <SelectItem value="upload">Upload</SelectItem>
            <SelectItem value="portal">Portal</SelectItem>
            <SelectItem value="branding">Branding</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(a) => a.id}
        searchKeys={["description", "publicCode", "ip"]}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        searchPlaceholder="Pesquisar por descrição..."
      />
    </div>
  );
}
