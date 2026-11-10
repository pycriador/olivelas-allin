import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCheck, Trash2, Loader2, Settings2 } from "lucide-react";
import { listNotifications, markAsRead, markAllAsRead, deleteNotification } from "@/modules/notifications/notifications.functions";
import { CATEGORY_LABELS, type AppNotification, type NotificationCategory } from "@/modules/notifications/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const listFn = useServerFn(listNotifications);
  const markReadFn = useServerFn(markAsRead);
  const markAllFn = useServerFn(markAllAsRead);
  const deleteFn = useServerFn(deleteNotification);
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications-all'],
    queryFn: () => listFn({ data: { limit: 100 } }),
  });

  const markAllMut = useMutation({
    mutationFn: () => markAllFn(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications-all'] }); toast.success('Todas marcadas como lidas'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications-all'] }),
  });

  const notificationsByCategory: Record<string, AppNotification[]> = {};
  for (const n of (notifications ?? []) as unknown as AppNotification[]) {
    const cat = n.category;
    if (!notificationsByCategory[cat]) notificationsByCategory[cat] = [];
    notificationsByCategory[cat].push(n);
  }

  const categories = Object.keys(notificationsByCategory);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Notificações</h1>
          <p className="mt-1 text-sm text-muted-foreground">Central de notificações e alertas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => markAllMut.mutate()}>
            <CheckCheck className="mr-1.5 h-4 w-4" /> Marcar todas
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !notifications || notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Bell className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma notificação.</p>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">Todas ({(notifications as unknown as AppNotification[]).length})</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {CATEGORY_LABELS[cat as NotificationCategory] ?? cat} ({notificationsByCategory[cat].length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-2">
            {(notifications as unknown as AppNotification[]).map((n) => (
              <NotificationItem key={n.id} notification={n} onDelete={() => deleteMut.mutate(n.id)} />
            ))}
          </TabsContent>

          {categories.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-4 space-y-2">
              {notificationsByCategory[cat].map((n) => (
                <NotificationItem key={n.id} notification={n} onDelete={() => deleteMut.mutate(n.id)} />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

function NotificationItem({ notification: n, onDelete }: { notification: AppNotification; onDelete: () => void }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border border-border p-4 transition", !n.isRead && "bg-primary/5 border-primary/20")}>
      <div className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm", !n.isRead ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
        {n.title.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm", !n.isRead && "font-medium")}>{n.title}</p>
          <div className="flex shrink-0 gap-1">
            {!n.isRead && (
              <button type="button" className="rounded p-1 text-muted-foreground hover:text-foreground" title="Marcar como lida">
                <CheckCheck className="h-3 w-3" />
              </button>
            )}
            <button type="button" onClick={onDelete} className="rounded p-1 text-muted-foreground hover:text-destructive" title="Excluir">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
        <p className="mt-1 text-[10px] text-muted-foreground/60">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}</p>
      </div>
    </div>
  );
}
