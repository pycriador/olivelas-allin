import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  FilePlus2,
  LogIn,
  LogOut,
  Settings2,
  KeyRound,
  Plug,
  ShieldCheck,
  UserPlus,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { dashboardService } from "@/services/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACTION_ICON: Record<string, LucideIcon> = {
  login: LogIn,
  logout: LogOut,
  create: FilePlus2,
  update: Settings2,
  delete: FilePlus2,
  permission: KeyRound,
  role: ShieldCheck,
  invitation: UserPlus,
  connector: Plug,
  execution: Workflow,
  config: Settings2,
};

const ACTION_LABEL: Record<string, string> = {
  login: "Login realizado",
  logout: "Logout",
  create: "Registro criado",
  update: "Registro atualizado",
  delete: "Registro excluído",
  permission: "Permissão alterada",
  role: "Papel alterado",
  invitation: "Convite enviado",
  connector: "Conector alterado",
  execution: "Execução iniciada",
  config: "Configuração alterada",
};

export function RecentActivityFeed({ workspaceId }: { workspaceId?: string | undefined }) {
  const { data: events, isLoading } = useQuery({
    queryKey: ["dashboard", "activity", workspaceId],
    queryFn: () => dashboardService.getRecentActivity(workspaceId!, 8),
    enabled: !!workspaceId,
  });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-4 text-muted-foreground" />
          Atividade recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="relative space-y-5 before:absolute before:inset-y-1 before:left-[15px] before:w-px before:bg-border">
            {events.map((event) => {
              const Icon = ACTION_ICON[event.action] ?? Activity;
              const label = ACTION_LABEL[event.action] ?? event.action;
              return (
                <div key={event.id} className="relative flex gap-3">
                  <div className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="truncate text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.actor_email ?? "Sistema"} · {event.entity ?? "—"} ·{" "}
                      {formatDistanceToNow(new Date(event.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Sem atividade por aqui"
            description="As ações do time aparecerão aqui conforme acontecerem."
            className="py-8"
          />
        )}
      </CardContent>
    </Card>
  );
}
