import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listThreads, createThread, deleteThread } from "@/modules/ai/threads.functions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/assistant")({
  component: AssistantLayout,
});

function AssistantLayout() {
  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const deleteFn = useServerFn(deleteThread);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: threads, isLoading } = useQuery({
    queryKey: ["ai-threads"],
    queryFn: () => listFn(),
  });

  const createMut = useMutation({
    mutationFn: () => createFn({ data: {} }),
    onSuccess: async (row) => {
      await qc.invalidateQueries({ queryKey: ["ai-threads"] });
      navigate({ to: "/app/assistant/$threadId", params: { threadId: row.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha"),
  });

  const deleteMut = useMutation({
    mutationFn: (threadId: string) => deleteFn({ data: { threadId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-threads"] }),
  });

  const currentPath = window.location.pathname;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-muted/30 md:flex">
        <div className="flex items-center justify-between border-b border-border p-3">
          <div className="text-sm font-semibold">Conversas</div>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending}
            title="Nova conversa"
          >
            {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <ul className="space-y-0.5 p-2">
            {isLoading && <li className="p-2 text-xs text-muted-foreground">Carregando...</li>}
            {!isLoading && (!threads || threads.length === 0) && (
              <li className="p-2 text-xs text-muted-foreground">Nenhuma conversa ainda.</li>
            )}
            {threads?.map((t) => {
              const active = currentPath.endsWith(t.id);
              return (
                <li key={t.id} className="group flex items-stretch gap-1">
                  <Link
                    to="/app/assistant/$threadId"
                    params={{ threadId: t.id }}
                    className={cn(
                      "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                      active && "bg-accent font-medium",
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{t.title}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label="Excluir conversa"
                    className="rounded-md px-2 opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    onClick={() => {
                      if (confirm("Excluir esta conversa?")) deleteMut.mutate(t.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}