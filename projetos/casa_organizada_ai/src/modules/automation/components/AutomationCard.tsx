import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Play, Square, Trash2, Clock, Activity, AlertCircle } from "lucide-react";
import { toggleAutomation, deleteAutomation, type Automation, TRIGGER_LABELS, ACTION_LABELS } from "@/modules/automation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface AutomationCardProps {
  automation: Automation & { triggers?: { trigger_type: string }[]; actions?: { action_type: string }[] };
}

export function AutomationCard({ automation }: AutomationCardProps) {
  const toggleFn = useServerFn(toggleAutomation);
  const deleteFn = useServerFn(deleteAutomation);
  const qc = useQueryClient();

  const toggleMut = useMutation({
    mutationFn: () => toggleFn({ data: { id: automation.id, active: !automation.isActive } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['automations'] }); toast.success(automation.isActive ? 'Automação pausada' : 'Automação ativada'); },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteFn({ data: { id: automation.id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['automations'] }); toast.success('Automação excluída'); },
  });

  const hasError = automation.errorCount > 0;
  const triggerLabels = (automation.triggers ?? []).map(t => TRIGGER_LABELS[t.trigger_type as keyof typeof TRIGGER_LABELS] ?? t.trigger_type);
  const actionLabels = (automation.actions ?? []).map(a => ACTION_LABELS[a.action_type as keyof typeof ACTION_LABELS] ?? a.action_type);

  return (
    <Card className={cn("transition", !automation.isActive && "opacity-60")}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{automation.name}</CardTitle>
          {automation.description && <CardDescription>{automation.description}</CardDescription>}
        </div>
        <Switch checked={automation.isActive} onCheckedChange={() => toggleMut.mutate()} disabled={toggleMut.isPending} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {triggerLabels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-muted-foreground">Quando:</span>
              {triggerLabels.map((l, i) => <Badge key={i} variant="outline" className="text-xs">{l}</Badge>)}
            </div>
          )}
          {actionLabels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-muted-foreground">Ação:</span>
              {actionLabels.map((l, i) => <Badge key={i} variant="secondary" className="text-xs">{l}</Badge>)}
            </div>
          )}
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {automation.runCount} execuções</span>
            {automation.lastRunAt && (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(automation.lastRunAt), { addSuffix: true, locale: ptBR })}</span>
            )}
            {hasError && (
              <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-3 w-3" /> {automation.errorCount} erros</span>
            )}
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => deleteMut.mutate()}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
