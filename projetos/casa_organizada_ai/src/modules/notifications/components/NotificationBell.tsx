import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Bell, BellDot, CheckCheck, Trash2, Loader2, ExternalLink } from "lucide-react";
import { listNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from "@/modules/notifications/notifications.functions";
import type { AppNotification } from "@/modules/notifications/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const listFn = useServerFn(listNotifications);
  const unreadFn = useServerFn(getUnreadCount);
  const markReadFn = useServerFn(markAsRead);
  const markAllFn = useServerFn(markAllAsRead);
  const deleteFn = useServerFn(deleteNotification);
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listFn({ data: { limit: 20 } }),
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => unreadFn(),
    refetchInterval: 30000,
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}` },
        () => {
          qc.invalidateQueries({ queryKey: ['notifications'] });
          qc.invalidateQueries({ queryKey: ['notifications-unread'] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const markReadMut = useMutation({
    mutationFn: (id: string) => markReadFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: () => markAllFn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
      toast.success('Notificações marcadas como lidas');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          {(unreadCount ?? 0) > 0 ? (
            <>
              <BellDot className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                {unreadCount}
              </span>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Notificações</span>
          {(unreadCount ?? 0) > 0 && (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={() => markAllMut.mutate()}>
              <CheckCheck className="mr-1 h-3 w-3" /> Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[350px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-30" />
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(notifications as unknown as AppNotification[]).map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "group relative flex gap-3 px-4 py-3 transition hover:bg-muted/50",
                    !n.isRead && "bg-primary/5",
                  )}
                >
                  <div className="mt-0.5 shrink-0 text-lg">{n.title.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm", !n.isRead && "font-medium")}>{n.title}</p>
                      <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition">
                        {!n.isRead && (
                          <button type="button" onClick={() => markReadMut.mutate(n.id)}
                            className="rounded p-1 text-muted-foreground hover:text-foreground">
                            <CheckCheck className="h-3 w-3" />
                          </button>
                        )}
                        <button type="button" onClick={() => deleteMut.mutate(n.id)}
                          className="rounded p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
