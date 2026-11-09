import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import {
  ClipboardList, Share2, Download, Upload, ThumbsUp, ShieldCheck,
} from "lucide-react";
import {
  publicServiceOrderService, shareService, downloadService, uploadService,
  approvalService, guaranteeService, portalAuditService,
} from "@/modules/portal/service";
import type { PortalAudit } from "@/modules/portal/types";

export const Route = createFileRoute("/_app/portal/home")({
  head: () => ({ meta: [{ title: "Portal Público — ServiceForge" }] }),
  component: PortalHomePage,
});

function PortalHomePage() {
  const { data: orders = [] } = useQuery({ queryKey: ["portal", "orders"], queryFn: () => publicServiceOrderService.list() });
  const { data: shares = [] } = useQuery({ queryKey: ["portal", "shares"], queryFn: () => shareService.list() });
  const { data: downloads = [] } = useQuery({ queryKey: ["portal", "downloads"], queryFn: () => downloadService.list() });
  const { data: uploads = [] } = useQuery({ queryKey: ["portal", "uploads"], queryFn: () => uploadService.list() });
  const { data: approvals = [] } = useQuery({ queryKey: ["portal", "approvals"], queryFn: () => approvalService.list() });
  const { data: guarantees = [] } = useQuery({ queryKey: ["portal", "guarantees"], queryFn: () => guaranteeService.list() });
  const { data: audits = [] } = useQuery({ queryKey: ["portal", "audits"], queryFn: () => portalAuditService.list() });

  const activeShares = shares.filter((s) => s.status === "active");

  const cards = [
    { label: "Total Ordens Públicas", value: orders.length, icon: ClipboardList, color: "text-blue-600" },
    { label: "Compartilhamentos Ativos", value: activeShares.length, icon: Share2, color: "text-green-600" },
    { label: "Downloads", value: downloads.length, icon: Download, color: "text-purple-600" },
    { label: "Uploads", value: uploads.length, icon: Upload, color: "text-orange-600" },
    { label: "Aprovações", value: approvals.length, icon: ThumbsUp, color: "text-emerald-600" },
    { label: "Garantias", value: guarantees.length, icon: ShieldCheck, color: "text-rose-600" },
  ];

  const recentAudits = [...audits].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  const auditColumns: Column<PortalAudit>[] = [
    { key: "action", header: "Ação", render: (a) => {
      const labels: Record<string, string> = {
        accessed: "Acesso", downloaded: "Download", uploaded: "Upload",
        approved: "Aprovou", rejected: "Rejeitou", signed: "Assinou",
        shared: "Compartilhou", linkGenerated: "Link Gerado",
        linkExpired: "Link Expirado", linkRevoked: "Link Revogado",
        guaranteeRequested: "Solicitou Garantia", error: "Erro", consulted: "Consultou",
      };
      return <span>{labels[a.action] || a.action}</span>;
    }},
    { key: "entityType", header: "Entidade", render: (a) => {
      const labels: Record<string, string> = {
        serviceOrder: "Ordem", document: "Documento", share: "Compartilhamento",
        approval: "Aprovação", guarantee: "Garantia", upload: "Upload",
        portal: "Portal", branding: "Branding",
      };
      return <span>{labels[a.entityType] || a.entityType}</span>;
    }},
    { key: "description", header: "Descrição", render: (a) => <span className="text-sm">{a.description}</span> },
    { key: "publicCode", header: "Código", render: (a) => a.publicCode ? <code className="text-xs bg-muted px-1 py-0.5 rounded">{a.publicCode}</code> : "—" },
    { key: "success", header: "Status", render: (a) => <Badge variant={a.success ? "default" : "destructive"}>{a.success ? "Sucesso" : "Falha"}</Badge> },
    { key: "timestamp", header: "Data/Hora", render: (a) => <span className="text-sm">{new Date(a.timestamp).toLocaleString("pt-BR")}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portal Público</h1>
        <p className="text-sm text-muted-foreground">Visão geral do portal de atendimento ao cliente</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Auditoria Recente</h2>
        <DataTable
          data={recentAudits}
          columns={auditColumns}
          keyExtractor={(a) => a.id}
          searchKeys={["description", "publicCode", "action", "entityType"]}
          initialSortColumn="timestamp"
        />
      </div>
    </div>
  );
}
