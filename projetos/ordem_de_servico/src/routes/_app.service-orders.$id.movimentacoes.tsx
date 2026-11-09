import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, UserCheck, Wrench, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { serviceOrderService } from "@/modules/service-orders/service";
import type { SOTimelineEntry } from "@/modules/service-orders/types";

export const Route = createFileRoute("/_app/service-orders/$id/movimentacoes")({
  head: () => ({ meta: [{ title: "Movimentações — ServiceForge" }] }),
  component: MovimentacoesTab,
});

const movementTypes = new Set(["status_changed", "assigned", "technician_changed"]);

const typeConfig: Record<string, { icon: typeof History; label: string; color: string }> = {
  status_changed: { icon: ArrowRight, label: "Mudança de Status", color: "text-amber-500 bg-amber-50" },
  assigned: { icon: UserCheck, label: "Atribuição", color: "text-purple-500 bg-purple-50" },
  technician_changed: { icon: Wrench, label: "Troca de Técnico", color: "text-violet-500 bg-violet-50" },
};

function MovimentacoesTab() {
  const { id } = Route.useParams();

  const { data: so, isLoading } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!so) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">OS não encontrada</p></div>;

  const movements = (so.timeline ?? [])
    .filter((entry) => movementTypes.has(entry.type))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Movimentações</h2>
        <Badge variant="secondary">{movements.length}</Badge>
      </div>

      {movements.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhuma movimentação registrada.</p></CardContent></Card>
      ) : (
        <div className="space-y-1">
          {movements.map((entry) => {
            const cfg = typeConfig[entry.type] ?? { icon: History, label: entry.type, color: "text-gray-500 bg-gray-50" };
            const Icon = cfg.icon;
            return (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="w-px flex-1 bg-border" />
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                  <p className="text-sm mt-1">{entry.description}</p>
                  {entry.userName && <p className="text-xs text-muted-foreground mt-1">Responsável: {entry.userName}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
