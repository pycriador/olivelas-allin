import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createThread } from "@/modules/ai/threads.functions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import assistantAvatar from "@/assets/assistant-avatar.png";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/assistant/")({
  component: AssistantHome,
});

function AssistantHome() {
  const createFn = useServerFn(createThread);
  const navigate = useNavigate();
  const startMut = useMutation({
    mutationFn: (title?: string) => createFn({ data: title ? { title } : {} }),
    onSuccess: (row) =>
      navigate({ to: "/app/assistant/$threadId", params: { threadId: row.id } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha"),
  });

  const suggestions = [
    "Monte uma rotina semanal para uma criança de 8 anos.",
    "Crie uma rotina diária para dois cachorros.",
    "Organize minhas tarefas da semana.",
    "Transforme essa lista em um planner mensal.",
  ];

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-6 p-8 text-center">
      <img
        src={assistantAvatar}
        alt="HomeFlow"
        width={96}
        height={96}
        className="h-24 w-24"
        loading="lazy"
      />
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Assistente HomeFlow
        </h1>
        <p className="mt-2 text-muted-foreground">
          Peça rotinas, checklists, planners e organização em linguagem natural.
        </p>
      </div>
      <div className="grid w-full gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => startMut.mutate(s)}
            disabled={startMut.isPending}
            className="rounded-lg border border-border bg-card p-3 text-left text-sm text-card-foreground shadow-sm transition hover:border-primary/50 hover:shadow"
          >
            {s}
          </button>
        ))}
      </div>
      <Button
        size="lg"
        onClick={() => startMut.mutate(undefined)}
        disabled={startMut.isPending}
        className="bg-gradient-brand text-primary-foreground shadow-elegant"
      >
        {startMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Iniciar nova conversa
      </Button>
    </div>
  );
}