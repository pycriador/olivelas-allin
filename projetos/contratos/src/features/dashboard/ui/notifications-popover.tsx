import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notificationService } from "@/services/notifications";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

export function NotificationsPopover() {
  const user = useAuthStore((s) => s.session?.user ?? null);
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => notificationService.listForUser(user!.id),
    enabled: !!user,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["notifications", user?.id, "unread"],
    queryFn: () => notificationService.unreadCount(user!.id),
    enabled: !!user,
  });

  const markAllRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="size-4" />
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-destructive" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" alignOffset={-8}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Notificações</h3>
            {(unreadCount ?? 0) > 0 && <Badge variant="secondary">{unreadCount}</Badge>}
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAllRead}>
            <CheckCheck className="mr-1 size-3.5" />
            Marcar como lidas
          </Button>
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex animate-pulse gap-3">
                  <div className="size-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-border/60">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    !notification.read_at && "bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      !notification.read_at ? "bg-primary" : "bg-muted-foreground/30",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    {notification.body && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {notification.body}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8">
              <Inbox className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
