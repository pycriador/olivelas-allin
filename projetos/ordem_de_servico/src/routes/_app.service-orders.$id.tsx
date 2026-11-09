import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft, FileText, ClipboardList, Wrench, Package, RotateCcw,
  ShieldCheck, History, MessageCircle, FileSpreadsheet, MessageSquare,
  Paperclip, ScrollText, Radio, Camera, User, DollarSign, ThumbsUp,
  CreditCard, Truck, Receipt, PenSquare, Landmark, Globe,
  ArrowLeftRight, FlaskConical, BarChart3, Calculator, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import { Link as RouterLink } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/service-orders/$id")({
  head: () => ({ meta: [{ title: "OS — ServiceForge" }] }),
  component: SOWorkspaceLayout,
});

const tabs = [
  { id: "summary", label: "Resumo", labelKey: "so.tab.summary", path: "/service-orders/$id", icon: FileText, exact: true },
  { id: "diagnostic", label: "Diagnóstico", labelKey: "so.tab.diagnostic", path: "/service-orders/$id/diagnostic", icon: ClipboardList },
  { id: "execution", label: "Execução", labelKey: "so.tab.execution", path: "/service-orders/$id/execution", icon: Wrench },
  { id: "budget", label: "Orçamento", labelKey: "so.tab.budget", path: "/service-orders/$id/budget", icon: DollarSign },
  { id: "approval", label: "Aprovação", labelKey: "so.tab.approval", path: "/service-orders/$id/approval", icon: ThumbsUp },
  { id: "payments", label: "Pagamentos", labelKey: "so.tab.payments", path: "/service-orders/$id/payments", icon: CreditCard },
  { id: "delivery", label: "Entrega", labelKey: "so.tab.delivery", path: "/service-orders/$id/delivery", icon: Truck },
  { id: "receipts", label: "Recibos", labelKey: "so.tab.receipts", path: "/service-orders/$id/receipts", icon: Receipt },
  { id: "signatures", label: "Assinaturas", labelKey: "so.tab.signatures", path: "/service-orders/$id/signatures", icon: PenSquare },
  { id: "financialHistory", label: "Histórico Financeiro", labelKey: "so.tab.financialHistory", path: "/service-orders/$id/financialHistory", icon: Landmark },
  { id: "portal", label: "Portal", labelKey: "so.tab.portal", path: "/service-orders/$id/portal", icon: Globe },
  { id: "services", label: "Serviços", labelKey: "so.tab.services", path: "/service-orders/$id/services", icon: Package },
  { id: "parts", label: "Peças", labelKey: "so.tab.parts", path: "/service-orders/$id/parts", icon: Package },
  { id: "returns", label: "Retornos", labelKey: "so.tab.returns", path: "/service-orders/$id/returns", icon: RotateCcw },
  { id: "warranty", label: "Garantia", labelKey: "so.tab.warranty", path: "/service-orders/$id/warranty", icon: ShieldCheck },
  { id: "timeline", label: "Timeline", labelKey: "so.tab.timeline", path: "/service-orders/$id/timeline", icon: History },
  { id: "comments", label: "Comentários", labelKey: "so.tab.comments", path: "/service-orders/$id/comments", icon: MessageCircle },
  { id: "documents", label: "Documentos", labelKey: "so.tab.documents", path: "/service-orders/$id/documents", icon: FileSpreadsheet },
  { id: "communications", label: "Comunicações", labelKey: "so.tab.communications", path: "/service-orders/$id/communications", icon: MessageSquare },
  { id: "attachments", label: "Anexos", labelKey: "so.tab.attachments", path: "/service-orders/$id/attachments", icon: Paperclip },
  { id: "audit", label: "Auditoria", labelKey: "so.tab.audit", path: "/service-orders/$id/audit", icon: ScrollText },
  { id: "events", label: "Eventos", labelKey: "so.tab.events", path: "/service-orders/$id/events", icon: Radio },
  { id: "photos", label: "Fotos", labelKey: "so.tab.photos", path: "/service-orders/$id/photos", icon: Camera },
  { id: "technician", label: "Técnico", labelKey: "so.tab.technician", path: "/service-orders/$id/technician", icon: User },
  { id: "recebimento", label: "Recebimento", labelKey: "so.tab.recebimento", path: "/service-orders/$id/recebimento", icon: ClipboardList },
  { id: "movimentacoes", label: "Movimentações", labelKey: "so.tab.movimentacoes", path: "/service-orders/$id/movimentacoes", icon: ArrowLeftRight },
  { id: "observacoes", label: "Observações", labelKey: "so.tab.observacoes", path: "/service-orders/$id/observacoes", icon: MessageSquare },
  { id: "tests", label: "Testes", labelKey: "so.tab.tests", path: "/service-orders/$id/tests", icon: FlaskConical },
  { id: "quality", label: "Qualidade", labelKey: "so.tab.quality", path: "/service-orders/$id/quality", icon: ShieldCheck },
  { id: "costs", label: "Custos", labelKey: "so.tab.costs", path: "/service-orders/$id/costs", icon: Calculator },
  { id: "analytics", label: "Indicadores", labelKey: "so.tab.analytics", path: "/service-orders/$id/analytics", icon: BarChart3 },
  { id: "knowledge", label: "Conhecimento", labelKey: "so.tab.knowledge", path: "/service-orders/$id/knowledge", icon: Brain },
];

function SOWorkspaceLayout() {
  const { id } = Route.useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const { data: so, isLoading } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  const updateStatus = useMutation({
    mutationFn: () => serviceOrderService.update(id, { status: newStatus, statusLabel: newStatus }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["service-order", id] }); setEditingStatus(false); },
  });

  const togglePin = useMutation({
    mutationFn: () => serviceOrderService.togglePin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-order", id] }),
  });

  const reopenMut = useMutation({
    mutationFn: () => serviceOrderService.reopen(id, "Admin"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["service-order", id] }); },
  });

  const priorityColor: Record<string, string> = { low: "bg-gray-100 text-gray-700", medium: "bg-blue-100 text-blue-700", high: "bg-amber-100 text-amber-700", urgent: "bg-red-100 text-red-700" };

  const currentTab = tabs.find((tab) => tab.exact ? location.pathname === `/service-orders/${id}` : location.pathname.startsWith(`/service-orders/${id}/${tab.id}`)) ?? tabs[0];

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;
  if (!so) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.noResults")}</p></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link to="/service-orders"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="min-w-0 truncate">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{so.number}</h1>
              <Badge className={priorityColor[so.priority] ?? ""} variant="outline">{t(`so.priority.${so.priority}`)}</Badge>
              <Badge variant={so.pinned ? "default" : "secondary"} className="cursor-pointer" onClick={() => togglePin.mutate()}>
                {so.pinned ? t("so.unpin") : t("so.pin")}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("so.customer")}: {so.customerName} {so.deviceInfo ? `| ${so.deviceInfo}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {["Entregue", "Cancelada"].includes(so.status) ? (
            <Button size="sm" variant="outline" onClick={() => reopenMut.mutate()}>{t("so.communication.reopen")}</Button>
          ) : editingStatus ? (
            <div className="flex items-center gap-2">
              <select className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs sm:text-sm" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                {["Em Aberto", "Em Diagnóstico", "Aguardando Aprovação", "Aprovada", "Em Execução", "Aguardando Peça", "Pronta", "Aguardando Retirada", "Entregue", "Cancelada"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Button size="sm" onClick={() => updateStatus.mutate()}>{t("common.save")}</Button>
              <Button size="sm" variant="outline" onClick={() => setEditingStatus(false)}>{t("common.cancel")}</Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => { setNewStatus(so.status); setEditingStatus(true); }}>{so.statusLabel}</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b overflow-x-auto min-w-0 w-full custom-scrollbar">
        <nav className="flex gap-1 min-w-max pb-1">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? location.pathname === `/service-orders/${id}`
              : location.pathname.startsWith(`/service-orders/${id}/${tab.id}`);
            const Icon = tab.icon;
            const translated = tab.labelKey ? t(tab.labelKey) : null;
            const label = translated && translated !== tab.labelKey ? translated : (tab.label || tab.id);
            return (
              <Link
                key={tab.id}
                to={tab.path as any}
                params={{ id } as never}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <Outlet />
    </div>
  );
}
