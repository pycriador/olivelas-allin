import { useQuery } from "@tanstack/react-query";
import { ScrollText, type LucideIcon } from "lucide-react";
import { auditService } from "@/services/audit";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACTION_TONE: Record<string, string> = {
  login: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  logout: "bg-muted text-muted-foreground",
  create: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  update: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  permission: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
};

function ActionBadge({ action }: { action: string }) {
  const tone = ACTION_TONE[action] ?? "bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={`capitalize ${tone}`}>
      {action}
    </Badge>
  );
}

export function AuditPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const isGlobalAdmin = useAuthStore((s) => s.isGlobalAdmin);
  const workspaceId = isGlobalAdmin ? (workspace?.id ?? null) : (workspace?.id ?? null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit", "logs", workspaceId],
    queryFn: () => auditService.list(workspaceId, 50),
    enabled: !!workspaceId,
  });

  void ScrollText;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Trilha completa de ações: login, logout, CRUD, permissões, convites e configurações."
        actions={<Badge variant="secondary">{logs?.length ?? 0} registros</Badge>}
      />

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="divide-y divide-border/60">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 px-6 py-3.5">
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <ScrollText className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ActionBadge action={log.action} />
                      <span className="text-xs text-muted-foreground">
                        {log.entity ?? "—"}
                        {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {log.actor_email ?? "Sistema"}
                      {log.ip_address ? ` · ${log.ip_address}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ScrollText}
              title="Nenhum registro de auditoria"
              description="As ações da plataforma aparecerão aqui conforme acontecerem."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
