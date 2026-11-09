import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  GitBranch, Plus, Save, Eye, Archive, CheckCircle2,
  Clock, Copy, Play, ListTodo, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  workflowService, executionService, workflowHistoryService,
  addWorkflowHistory, eventBus,
} from "@/modules/events/service";
import { DocButton } from "@/components/doc-button";
import type { Workflow, WorkflowExecution, Action, TriggerType, ActionType, EventCategory, Condition } from "@/modules/events/types";
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS, TRIGGER_TYPE_LABELS, ACTION_TYPE_LABELS, EXECUTION_STATUS_LABELS } from "@/modules/events/types";

export const Route = createFileRoute("/_app/events/workflows")({
  head: () => ({ meta: [{ title: "Workflows — ServiceForge" }] }),
  component: WorkflowsPage,
});

function WorkflowsPage() {
  const qc = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editWf, setEditWf] = useState<Workflow | null>(null);
  const [selectedWf, setSelectedWf] = useState<Workflow | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [publishId, setPublishId] = useState<string | null>(null);

  const { data: workflows = [] } = useQuery({
    queryKey: ["evt", "workflows"],
    queryFn: () => workflowService.list(),
  });

  const { data: executions = [] } = useQuery({
    queryKey: ["evt", "executions"],
    queryFn: () => executionService.list(),
  });

  const { data: history = [] } = useQuery({
    queryKey: ["evt", "history"],
    queryFn: () => workflowHistoryService.list(),
  });

  const archiveMut = useMutation({
    mutationFn: (id: string) => workflowService.update(id, { status: "archived" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["evt", "workflows"] }); toast.success("Workflow arquivado"); },
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => workflowService.update(id, { status: "published" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["evt", "workflows"] }); toast.success("Workflow publicado"); },
  });

  const duplicateMut = useMutation({
    mutationFn: async (wf: Workflow) => {
      const { id, createdAt, updatedAt, ...rest } = wf;
      return workflowService.create({ ...rest, name: `${wf.name} (cópia)`, status: "draft", version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["evt", "workflows"] }); toast.success("Workflow duplicado"); },
  });

  const saveMut = useMutation({
    mutationFn: async (data: {
      id?: string; name: string; description: string; category: EventCategory;
      triggerType: TriggerType; eventName: string; conditions: Condition[]; actions: Action[];
    }) => {
      const now = new Date().toISOString();
      const trigger = { type: data.triggerType, eventName: data.eventName || undefined };
      if (data.id) {
        return workflowService.update(data.id, { name: data.name, description: data.description, category: data.category, trigger, conditions: data.conditions, actions: data.actions, updatedBy: "admin", updatedAt: now });
      }
      return workflowService.create({
        name: data.name, description: data.description, category: data.category,
        trigger, conditions: data.conditions, actions: data.actions,
        status: "draft", version: 1, companyId: null,
        createdBy: "admin", updatedBy: "admin", createdAt: now, updatedAt: now,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["evt", "workflows"] }); setShowEditor(false); setEditWf(null); toast.success("Workflow salvo"); },
  });

  const testMut = useMutation({
    mutationFn: async (wf: Workflow) => {
      const ev = await eventBus.publish(wf.trigger.eventName ?? "test.event", wf.category, "workflow-engine", { status: "active", _test: true }, { companyId: "company-1" });
      await addWorkflowHistory(wf.id, null, "workflow-started", `Teste manual do workflow ${wf.name}`, { testEventId: ev.id });
      return ev;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["evt", "executions"] }); qc.invalidateQueries({ queryKey: ["evt", "history"] }); toast.success("Workflow testado"); },
  });

  const wfExecutions = (wfId: string) => executions.filter((e) => e.workflowId === wfId).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const columns: Column<Workflow>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (e) => (
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedWf(selectedWf?.id === e.id ? null : e)}>
        <GitBranch className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{e.name}</div>
          <div className="text-xs text-muted-foreground">{EVENT_CATEGORY_LABELS[e.category]}</div>
        </div>
      </div>
    )},
    { key: "trigger", header: "Trigger", render: (e) => <Badge variant="outline">{TRIGGER_TYPE_LABELS[e.trigger.type]}</Badge> },
    { key: "actions", header: "Ações", render: (e) => <span className="text-sm">{e.actions.length} ações</span> },
    { key: "status", header: "Status", render: (e) => (
      <Badge variant={e.status === "published" ? "default" : e.status === "archived" ? "secondary" : "outline"} className="gap-1">
        {e.status === "published" ? <CheckCircle2 className="h-3 w-3" /> : e.status === "archived" ? <Archive className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
        {e.status === "published" ? "Publicado" : e.status === "archived" ? "Arquivado" : e.status === "disabled" ? "Desativado" : "Rascunho"}
      </Badge>
    )},
    { key: "version", header: "Versão", render: (e) => <span className="text-sm">v{e.version}</span> },
    { key: "execs", header: "Execuções", render: (e) => {
      const ex = wfExecutions(e.id);
      return <span className="text-sm">{ex.length} ({ex.filter((x) => x.status === "completed").length} ok)</span>;
    }},
    { key: "actions2", header: "", render: (e) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => { setEditWf(e); setShowEditor(true); }}><Eye className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => duplicateMut.mutate(e)}><Copy className="h-4 w-4" /></Button>
        {e.status === "published" && <Button size="sm" variant="ghost" onClick={() => testMut.mutate(e)}><Play className="h-4 w-4" /></Button>}
        {e.status !== "archived" && <Button size="sm" variant="ghost" onClick={() => setArchiveId(e.id)}><Archive className="h-4 w-4" /></Button>}
        {(e.status === "draft" || e.status === "disabled") && <Button size="sm" variant="ghost" onClick={() => setPublishId(e.id)}><CheckCircle2 className="h-4 w-4" /></Button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workflow Designer</h1>
          <DocButton module="events" page="workflows" />
          <p className="text-sm text-muted-foreground">Crie e gerencie workflows automatizados</p>
        </div>
        <Button onClick={() => { setEditWf(null); setShowEditor(true); }}><Plus className="mr-2 h-4 w-4" />Novo Workflow</Button>
      </div>

      <DataTable
        data={workflows}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchKeys={["name", "description"]}
        initialSortColumn="name"
      />

      {selectedWf && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedWf.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedWf.description}</p>
              </div>
              <Badge>{selectedWf.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Categoria:</span> {EVENT_CATEGORY_LABELS[selectedWf.category]}</div>
              <div><span className="text-muted-foreground">Trigger:</span> {TRIGGER_TYPE_LABELS[selectedWf.trigger.type]}{selectedWf.trigger.eventName ? ` (${selectedWf.trigger.eventName})` : ""}</div>
              <div><span className="text-muted-foreground">Versão:</span> v{selectedWf.version}</div>
              <div><span className="text-muted-foreground">Condições:</span> {selectedWf.conditions.length > 0 ? selectedWf.conditions.map((c) => `${c.field} ${c.operator} ${c.value}`).join(", ") : "Nenhuma"}</div>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2"><ListTodo className="h-4 w-4" />Ações ({selectedWf.actions.length})</h4>
              <div className="space-y-2">
                {selectedWf.actions.sort((a, b) => a.order - b.order).map((action) => (
                  <div key={action.order} className="flex items-center gap-3 p-2 bg-muted rounded-md text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">{action.order}</span>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span>{ACTION_TYPE_LABELS[action.type]}</span>
                    {Object.keys(action.config).length > 0 && (
                      <code className="text-[10px] bg-background px-1 rounded ml-auto">{JSON.stringify(action.config)}</code>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Execuções Recentes</h4>
              <div className="space-y-2">
                {wfExecutions(selectedWf.id).slice(0, 5).map((ex) => (
                  <div key={ex.id} className="flex items-center gap-3 text-sm p-2 bg-muted rounded-md">
                    <Badge variant={
                      ex.status === "completed" ? "default" :
                      ex.status === "failed" ? "destructive" : "outline"
                    } className="text-[10px]">{EXECUTION_STATUS_LABELS[ex.status]}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(ex.startedAt).toLocaleString()}</span>
                    {ex.error && <span className="text-xs text-destructive ml-auto">{ex.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog open={!!archiveId} onOpenChange={(o) => { if (!o) setArchiveId(null); }} onConfirm={() => { if (archiveId) { archiveMut.mutate(archiveId); setArchiveId(null); } }} title="Arquivar Workflow" description="Tem certeza que deseja arquivar este workflow?" />
      <ConfirmDialog open={!!publishId} onOpenChange={(o) => { if (!o) setPublishId(null); }} onConfirm={() => { if (publishId) { publishMut.mutate(publishId); setPublishId(null); } }} title="Publicar Workflow" description="Tem certeza que deseja publicar este workflow?" />

      {showEditor && (
        <WorkflowEditor
          workflow={editWf}
          onSave={(data) => saveMut.mutate(data)}
          onClose={() => { setShowEditor(false); setEditWf(null); }}
          saving={saveMut.isPending}
        />
      )}
    </div>
  );
}

function WorkflowEditor({ workflow, onSave, onClose, saving }: {
  workflow: Workflow | null;
  onSave: (data: { id?: string; name: string; description: string; category: EventCategory; triggerType: TriggerType; eventName: string; conditions: Condition[]; actions: Action[] }) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(workflow?.name ?? "");
  const [description, setDescription] = useState(workflow?.description ?? "");
  const [category, setCategory] = useState<EventCategory>(workflow?.category ?? "system");
  const [triggerType, setTriggerType] = useState<TriggerType>(workflow?.trigger.type ?? "event");
  const [eventName, setEventName] = useState(workflow?.trigger.eventName ?? "");
  const [conditions, setConditions] = useState<Condition[]>(workflow?.conditions ?? []);
  const [actions, setActions] = useState<Action[]>(workflow?.actions ?? [{ type: "create-audit", config: { description: "" }, order: 1 }]);

  const addCondition = () => setConditions([...conditions, { field: "", operator: "=", value: "" }]);
  const updateCondition = (idx: number, patch: Partial<Condition>) => {
    setConditions(conditions.map((c, i) => i === idx ? { ...c, ...patch } : c));
  };
  const removeCondition = (idx: number) => setConditions(conditions.filter((_, i) => i !== idx));

  const addAction = () => setActions([...actions, { type: "create-audit", config: { description: "" }, order: actions.length + 1 }]);
  const updateAction = (idx: number, patch: Partial<Action>) => {
    setActions(actions.map((a, i) => i === idx ? { ...a, ...patch, order: idx + 1 } : a));
  };
  const removeAction = (idx: number) => {
    const updated = actions.filter((_, i) => i !== idx).map((a, i) => ({ ...a, order: i + 1 }));
    setActions(updated);
  };

  const handleSave = () => onSave({ id: workflow?.id, name, description, category, triggerType, eventName, conditions, actions });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{workflow ? "Editar Workflow" : "Novo Workflow"}</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do workflow" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1">
            <Label>Categoria</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
              {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{EVENT_CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Tipo de Trigger</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={triggerType} onChange={(e) => setTriggerType(e.target.value as TriggerType)}>
              {(["event", "manual", "schedule"] as TriggerType[]).map((t) => <option key={t} value={t}>{TRIGGER_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          {triggerType === "event" && (
            <div className="col-span-2 space-y-1">
              <Label>Nome do Evento</Label>
              <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="document.created, message.sent, ..." />
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base font-medium">Condições</Label>
            <Button size="sm" variant="outline" onClick={addCondition}><Plus className="h-3 w-3 mr-1" />Condição</Button>
          </div>
          {conditions.map((cond, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground w-6">{idx + 1}.</span>
              <Input className="flex-1" placeholder="Campo" value={cond.field} onChange={(e) => updateCondition(idx, { field: e.target.value })} />
              <select className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={cond.operator} onChange={(e) => updateCondition(idx, { operator: e.target.value as any })}>
                {(["=", "!=", ">", "<", ">=", "<=", "contains", "in"] as const).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <Input className="flex-1" placeholder="Valor" value={cond.value} onChange={(e) => updateCondition(idx, { value: e.target.value })} />
              <Button size="sm" variant="ghost" onClick={() => removeCondition(idx)}>✕</Button>
            </div>
          ))}
          {conditions.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma condição (executa sempre)</p>}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base font-medium">Ações</Label>
            <Button size="sm" variant="outline" onClick={addAction}><Plus className="h-3 w-3 mr-1" />Ação</Button>
          </div>
          {actions.sort((a, b) => a.order - b.order).map((action, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">{action.order}</span>
              <select className="h-10 flex-1 rounded-md border border-input bg-background px-2 text-sm" value={action.type} onChange={(e) => updateAction(idx, { type: e.target.value as ActionType })}>
                {(["create-audit", "create-event", "create-notification", "end", "wait"] as ActionType[]).map((t) => <option key={t} value={t}>{ACTION_TYPE_LABELS[t]}</option>)}
              </select>
              {action.type !== "end" && action.type !== "wait" && (
                <Input className="flex-1" placeholder="Config (JSON)" value={JSON.stringify(action.config)} onChange={(e) => {
                  try { updateAction(idx, { config: JSON.parse(e.target.value) }); } catch {}
                }} />
              )}
              <Button size="sm" variant="ghost" onClick={() => removeAction(idx)}>✕</Button>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !name}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </div>
    </div>
  );
}
