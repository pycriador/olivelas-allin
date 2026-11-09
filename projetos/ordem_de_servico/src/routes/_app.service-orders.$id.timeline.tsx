import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  History, Plus, Edit, ArrowRight, User, Smartphone, Wrench, MessageCircle,
  Paperclip, FileText, Send, UserCheck, Stethoscope, Play, Pause, CheckCircle,
  Package, Nut, ShieldCheck, Undo2, Camera, RotateCcw, Truck, XCircle, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import type { SOTimelineEntry } from "@/modules/service-orders/types";

export const Route = createFileRoute("/_app/service-orders/$id/timeline")({
  head: () => ({ meta: [{ title: "Timeline — ServiceForge" }] }),
  component: TimelineTab,
});

const typeIcons: Record<string, typeof History> = {
  created: Plus, updated: Edit, status_changed: ArrowRight, assigned: User,
  customer_changed: User, device_changed: Smartphone, technician_changed: Wrench,
  comment: MessageCircle, attachment: Paperclip, document_generated: FileText,
  message_sent: Send, diagnostic_created: Stethoscope, diagnostic_updated: Stethoscope,
  checklist_completed: CheckCircle, execution_started: Play, execution_paused: Pause,
  execution_resumed: RefreshCw, execution_completed: CheckCircle,
  service_added: Package, part_added: Nut, warranty_created: ShieldCheck,
  return_created: Undo2, photo_added: Camera, reopened: RotateCcw,
  delivered: Truck, cancelled: XCircle, return_delivered: Undo2,
};

const typeColors: Record<string, string> = {
  created: "text-green-500 bg-green-50", updated: "text-blue-500 bg-blue-50",
  status_changed: "text-amber-500 bg-amber-50", assigned: "text-purple-500 bg-purple-50",
  customer_changed: "text-indigo-500 bg-indigo-50", device_changed: "text-cyan-500 bg-cyan-50",
  technician_changed: "text-violet-500 bg-violet-50", comment: "text-gray-500 bg-gray-50",
  attachment: "text-orange-500 bg-orange-50", document_generated: "text-emerald-500 bg-emerald-50",
  message_sent: "text-sky-500 bg-sky-50", diagnostic_created: "text-rose-500 bg-rose-50",
  diagnostic_updated: "text-rose-500 bg-rose-50", checklist_completed: "text-green-500 bg-green-50",
  execution_started: "text-blue-500 bg-blue-50", execution_paused: "text-amber-500 bg-amber-50",
  execution_resumed: "text-blue-500 bg-blue-50", execution_completed: "text-green-500 bg-green-50",
  service_added: "text-teal-500 bg-teal-50", part_added: "text-cyan-500 bg-cyan-50",
  warranty_created: "text-yellow-500 bg-yellow-50", return_created: "text-red-500 bg-red-50",
  photo_added: "text-pink-500 bg-pink-50", reopened: "text-orange-500 bg-orange-50",
  delivered: "text-green-500 bg-green-50", cancelled: "text-red-500 bg-red-50",
  return_delivered: "text-red-500 bg-red-50",
};

const typeLabels: Record<string, string> = {
  created: "Criação", updated: "Atualização", status_changed: "Mudança de Status",
  assigned: "Atribuição", customer_changed: "Cliente Alterado", device_changed: "Aparelho Alterado",
  technician_changed: "Técnico Alterado", comment: "Comentário", attachment: "Anexo",
  document_generated: "Documento Gerado", message_sent: "Mensagem Enviada",
  diagnostic_created: "Diagnóstico Criado", diagnostic_updated: "Diagnóstico Atualizado",
  checklist_completed: "Checklist Concluído", execution_started: "Execução Iniciada",
  execution_paused: "Execução Pausada", execution_resumed: "Execução Retomada",
  execution_completed: "Execução Concluída", service_added: "Serviço Adicionado",
  part_added: "Peça Adicionada", warranty_created: "Garantia Criada",
  return_created: "Retorno Criado", photo_added: "Foto Adicionada",
  reopened: "Reaberta", delivered: "Entregue", cancelled: "Cancelada",
  return_delivered: "Retorno Entregue",
};

function TimelineTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: so, isLoading } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  const allTypes = Array.from(new Set((so?.timeline ?? []).map((e) => e.type)));
  const filtered = typeFilter === "all"
    ? (so?.timeline ?? [])
    : (so?.timeline ?? []).filter((e) => e.type === typeFilter);
  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t("so.timeline")}</h2>
      </div>

      <div className="flex items-center gap-2">
        <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">Todos os tipos</option>
          {allTypes.map((type) => (
            <option key={type} value={type}>{typeLabels[type] ?? type}</option>
          ))}
        </select>
        <Badge variant="secondary">{sorted.length} eventos</Badge>
      </div>

      {sorted.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento na timeline.</p></CardContent></Card>
      ) : (
        <div className="space-y-1">
          {sorted.map((entry) => {
            const Icon = typeIcons[entry.type] ?? History;
            const colorClass = typeColors[entry.type] ?? "text-gray-500 bg-gray-50";
            return (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="w-px flex-1 bg-border" />
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{typeLabels[entry.type] ?? entry.type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                  <p className="text-sm mt-1">{entry.description}</p>
                  {entry.userName && <p className="text-xs text-muted-foreground mt-1">Por: {entry.userName}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
