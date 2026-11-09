import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, FileText, Wrench, DollarSign, ShieldCheck, RotateCcw, MessageCircle, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";

export const Route = createFileRoute("/_app/service-orders/customers/$id/history")({
  head: () => ({ meta: [{ title: "Histórico — ServiceForge" }] }),
  component: CustomerHistoryPage,
});

const historyIcons: Record<string, any> = {
  service_order: Wrench, equipment: Wrench, payment: DollarSign, warranty: ShieldCheck,
  return: RotateCcw, document: FileText, communication: MessageCircle, audit: UserCheck,
};

const historyLabels: Record<string, string> = {
  service_order: "Ordem de Serviço", equipment: "Equipamento", payment: "Pagamento",
  warranty: "Garantia", return: "Devolução", document: "Documento", communication: "Comunicação", audit: "Auditoria",
};

const historyColors: Record<string, string> = {
  service_order: "text-blue-500 bg-blue-100", equipment: "text-violet-500 bg-violet-100",
  payment: "text-green-500 bg-green-100", warranty: "text-emerald-500 bg-emerald-100",
  return: "text-orange-500 bg-orange-100", document: "text-rose-500 bg-rose-100",
  communication: "text-sky-500 bg-sky-100", audit: "text-gray-500 bg-gray-100",
};

function CustomerHistoryPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const allEntries = [
    ...(customer?.serviceOrders ?? []).map((so) => ({ id: `so-${so.id}`, type: "service_order" as const, description: `OS ${so.number} - ${so.status}`, date: so.date, user: so.technician })),
    ...(customer?.equipments ?? []).map((eq) => ({ id: `eq-${eq.id}`, type: "equipment" as const, description: `${eq.type} ${eq.brand} ${eq.model}`, date: "", user: "" })),
    ...(customer?.warranties ?? []).map((w) => ({ id: `w-${w.id}`, type: "warranty" as const, description: `Garantia ${w.warrantyType} - ${w.equipmentName ?? ""}`, date: w.startDate, user: "" })),
    ...(customer?.communications ?? []).map((c) => ({ id: `comm-${c.id}`, type: "communication" as const, description: c.subject, date: c.sentAt, user: c.sentByName })),
    ...(customer?.documents ?? []).map((d) => ({ id: `doc-${d.id}`, type: "document" as const, description: d.name, date: d.uploadedAt, user: "" })),
    ...(customer?.timeline ?? []).map((t) => ({ id: `tl-${t.id}`, type: "audit" as const, description: t.description, date: t.createdAt, user: t.userName })),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Histórico Completo</h1>
        <p className="text-sm text-muted-foreground">Todas as atividades relacionadas ao cliente</p>
      </div>

      {allEntries.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhuma atividade registrada</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {allEntries.map((entry, idx) => {
            const Icon = historyIcons[entry.type] || Clock;
            const colorClass = historyColors[entry.type] || "text-gray-500 bg-gray-100";
            const label = historyLabels[entry.type] || entry.type;
            return (
              <div key={entry.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full ${colorClass} flex items-center justify-center`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {idx < allEntries.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{entry.description}</p>
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                    <div className="text-right">
                      {entry.date && <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleString("pt-BR")}</span>}
                      {entry.user && <p className="text-xs text-muted-foreground">{entry.user}</p>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
