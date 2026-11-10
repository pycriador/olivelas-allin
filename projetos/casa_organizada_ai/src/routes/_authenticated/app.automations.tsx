import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Plus, Loader2 } from "lucide-react";
import { listAutomations } from "@/modules/automation/automation.functions";
import { AutomationCard } from "@/modules/automation/components/AutomationCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/automations")({
  component: AutomationsPage,
});

function AutomationsPage() {
  const listFn = useServerFn(listAutomations);
  const { data: automations, isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: () => listFn(),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Automações</h1>
          <p className="mt-1 text-sm text-muted-foreground">Automatize tarefas e processos com blocos visuais.</p>
        </div>
        <Button className="bg-gradient-brand text-primary-foreground shadow-elegant">
          <Plus className="mr-1.5 h-4 w-4" /> Nova automação
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
        </div>
      ) : !automations || automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Bot className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma automação criada ainda.</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Crie sua primeira automação para simplificar tarefas repetitivas.</p>
          <Button className="mt-4" size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Criar automação
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(automations as any[]).map((a) => (
            <AutomationCard key={a.id} automation={a} />
          ))}
        </div>
      )}
    </div>
  );
}
