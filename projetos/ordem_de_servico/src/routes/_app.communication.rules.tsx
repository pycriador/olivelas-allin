import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  GitBranch, PowerOff, Plus, Save, Eye,
  Zap, MessageSquare, Mail, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DataTable, type Column } from "@/components/data-table";
import { ruleService, templateService, addAuditEvent } from "@/modules/communication/service";
import { DocButton } from "@/components/doc-button";
import type { CommunicationRule, ChannelType } from "@/modules/communication/types";
import { CHANNEL_TYPE_LABELS } from "@/modules/communication/types";

export const Route = createFileRoute("/_app/communication/rules")({
  head: () => ({ meta: [{ title: "Rules Engine — ServiceForge" }] }),
  component: RulesPage,
});

function RulesPage() {
  const qc = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editRule, setEditRule] = useState<CommunicationRule | null>(null);
  const [selectedRule, setSelectedRule] = useState<CommunicationRule | null>(null);

  const { data: rules = [] } = useQuery({
    queryKey: ["comm", "rules"],
    queryFn: () => ruleService.list(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["comm", "templates"],
    queryFn: () => templateService.list(),
  });

  const toggleMut = useMutation({
    mutationFn: async (rule: CommunicationRule) => {
      const updated = await ruleService.update(rule.id, { active: !rule.active });
      await addAuditEvent(updated.active ? "rule-activated" : "rule-deactivated", "admin", "Admin", `Regra ${updated.name} ${updated.active ? "ativada" : "desativada"}`, rule.id, "rule");
      return updated;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm", "rules"] }); toast.success("Regra atualizada"); },
  });

  const saveMut = useMutation({
    mutationFn: async (data: { id?: string; name: string; event: string; condition: string; templateId: string; channel: ChannelType }) => {
      const now = new Date().toISOString();
      if (data.id) {
        const updated = await ruleService.update(data.id, { ...data, updatedBy: "admin", updatedAt: now });
        await addAuditEvent("rule-edited", "admin", "Admin", `Regra editada: ${data.name}`, data.id, "rule");
        return updated;
      }
      const created = await ruleService.create({
        ...data, active: true, companyId: null, createdBy: "admin", updatedBy: "admin", createdAt: now, updatedAt: now,
      });
      await addAuditEvent("rule-created", "admin", "Admin", `Regra criada: ${data.name}`, created.id, "rule");
      return created;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm", "rules"] }); setShowEditor(false); setEditRule(null); toast.success("Regra salva"); },
  });

  const columns: Column<CommunicationRule>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (e) => (
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedRule(selectedRule?.id === e.id ? null : e)}>
        <GitBranch className="h-4 w-4 text-muted-foreground" />
        <div className="font-medium">{e.name}</div>
      </div>
    )},
    { key: "event", header: "Evento", render: (e) => <Badge variant="outline" className="font-mono text-[10px]">{e.event}</Badge> },
    { key: "condition", header: "Condição", render: (e) => <Badge variant="outline" className="font-mono text-[10px]">{e.condition}</Badge> },
    { key: "channel", header: "Canal", render: (e) => (
      <Badge variant="outline">
        {e.channel === "whatsapp" ? <MessageSquare className="h-3 w-3 mr-1" /> : e.channel === "email" ? <Mail className="h-3 w-3 mr-1" /> : <Bell className="h-3 w-3 mr-1" />}
        {CHANNEL_TYPE_LABELS[e.channel]}
      </Badge>
    )},
    { key: "active", header: "Ativo", render: (e) => (
      <div className="flex items-center gap-2">
        <Switch checked={e.active} onCheckedChange={() => toggleMut.mutate(e)} />
        {e.active ? <Zap className="h-4 w-4 text-green-500" /> : <PowerOff className="h-4 w-4 text-muted-foreground" />}
      </div>
    )},
    { key: "actions", header: "", render: (e) => (
      <Button size="sm" variant="ghost" onClick={() => { setEditRule(e); setShowEditor(true); }}><Eye className="h-4 w-4" /></Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rules Engine</h1>
          <DocButton module="communication" page="rules" />
          <p className="text-sm text-muted-foreground">Gerencie regras de comunicação automática</p>
        </div>
        <Button onClick={() => { setEditRule(null); setShowEditor(true); }}><Plus className="mr-2 h-4 w-4" />Nova Regra</Button>
      </div>

      <DataTable
        data={rules}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchKeys={["name", "event", "condition"]}
        initialSortColumn="name"
      />

      {selectedRule && (
        <Card className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold">{selectedRule.name}</h3>
            <Badge variant={selectedRule.active ? "default" : "secondary"}>{selectedRule.active ? "Ativo" : "Inativo"}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Evento:</span> <code className="bg-muted px-1 rounded">{selectedRule.event}</code></div>
            <div><span className="text-muted-foreground">Condição:</span> <code className="bg-muted px-1 rounded">{selectedRule.condition}</code></div>
            <div><span className="text-muted-foreground">Canal:</span> {CHANNEL_TYPE_LABELS[selectedRule.channel]}</div>
            <div><span className="text-muted-foreground">Template:</span> {templates.find((t) => t.id === selectedRule.templateId)?.name ?? selectedRule.templateId}</div>
          </div>
        </Card>
      )}

      {showEditor && (
        <RuleEditor
          rule={editRule}
          templates={templates}
          onSave={(data) => saveMut.mutate(data)}
          onClose={() => { setShowEditor(false); setEditRule(null); }}
          saving={saveMut.isPending}
        />
      )}
    </div>
  );
}

function RuleEditor({ rule, templates, onSave, onClose, saving }: {
  rule: CommunicationRule | null;
  templates: { id: string; name: string; channel: ChannelType }[];
  onSave: (data: { id?: string; name: string; event: string; condition: string; templateId: string; channel: ChannelType }) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(rule?.name ?? "");
  const [event, setEvent] = useState(rule?.event ?? "");
  const [condition, setCondition] = useState(rule?.condition ?? "");
  const [templateId, setTemplateId] = useState(rule?.templateId ?? "");
  const [channel, setChannel] = useState<ChannelType>(rule?.channel ?? "email");

  const handleSave = () => onSave({ id: rule?.id, name, event, condition, templateId, channel });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{rule ? "Editar Regra" : "Nova Regra"}</h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da regra" />
          </div>
          <div className="space-y-1">
            <Label>Evento</Label>
            <Input value={event} onChange={(e) => setEvent(e.target.value)} placeholder="Ex: os.status_changed" />
          </div>
          <div className="space-y-1">
            <Label>Condição</Label>
            <Input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Ex: new_status = APROVADO" />
          </div>
          <div className="space-y-1">
            <Label>Template</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={templateId} onChange={(e) => {
              setTemplateId(e.target.value);
              const tpl = templates.find((t) => t.id === e.target.value);
              if (tpl) setChannel(tpl.channel);
            }}>
              <option value="">Selecione um template</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({CHANNEL_TYPE_LABELS[t.channel]})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Canal</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={channel} onChange={(e) => setChannel(e.target.value as ChannelType)}>
              {(["email", "whatsapp", "internal"] as ChannelType[]).map((c) => <option key={c} value={c}>{CHANNEL_TYPE_LABELS[c]}</option>)}
            </select>
          </div>
        </div>
        <div className="border-t pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !name || !event || !templateId}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </div>
    </div>
  );
}
