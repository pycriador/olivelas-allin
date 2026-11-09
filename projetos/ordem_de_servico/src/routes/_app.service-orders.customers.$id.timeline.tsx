import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History, UserPlus, UserCheck, FileText, MessageSquare, Link2, Upload, Phone, ShieldCheck, Wrench, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";
import type { CustomerTimelineEntry } from "@/modules/customers/types";

export const Route = createFileRoute("/_app/service-orders/customers/$id/timeline")({
  head: () => ({ meta: [{ title: "Timeline — ServiceForge" }] }),
  component: CustomerTimelinePage,
});

const timelineIcons: Record<string, any> = {
  created: UserPlus, updated: UserCheck, comment: MessageSquare, status: UserCheck,
  merge: Link2, link: Link2, import: Upload, export: Upload, upload: Upload, download: Upload,
  shared: Link2, service_order: Wrench, warranty: ShieldCheck, communication: Phone, document: FileText, equipment: Wrench,
};

const timelineColors: Record<string, string> = {
  created: "text-green-500 bg-green-100", updated: "text-blue-500 bg-blue-100", comment: "text-purple-500 bg-purple-100",
  status: "text-amber-500 bg-amber-100", merge: "text-red-500 bg-red-100", link: "text-indigo-500 bg-indigo-100",
  import: "text-teal-500 bg-teal-100", export: "text-teal-500 bg-teal-100", upload: "text-cyan-500 bg-cyan-100", download: "text-cyan-500 bg-cyan-100",
  shared: "text-orange-500 bg-orange-100", service_order: "text-gray-500 bg-gray-100", warranty: "text-emerald-500 bg-emerald-100",
  communication: "text-sky-500 bg-sky-100", document: "text-rose-500 bg-rose-100", equipment: "text-violet-500 bg-violet-100",
};

function CustomerTimelinePage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const entries = [...(customer?.timeline ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
        <p className="text-sm text-muted-foreground">Linha do tempo de eventos do cliente</p>
      </div>

      {entries.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhum evento registrado</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, idx) => {
            const Icon = timelineIcons[entry.type] || Clock;
            const colorClass = timelineColors[entry.type] || "text-gray-500 bg-gray-100";
            return (
              <div key={entry.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full ${colorClass} flex items-center justify-center`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {idx < entries.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{entry.description}</p>
                    <span className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                  {entry.userName && <p className="text-xs text-muted-foreground">por {entry.userName}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
