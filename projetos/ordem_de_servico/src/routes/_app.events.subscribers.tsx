import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Radio, Power, PowerOff, Plus, Save, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { subscriberService } from "@/modules/events/service";
import { DocButton } from "@/components/doc-button";
import type { Subscriber } from "@/modules/events/types";

export const Route = createFileRoute("/_app/events/subscribers")({
  head: () => ({ meta: [{ title: "Subscribers — ServiceForge" }] }),
  component: SubscribersPage,
});

function SubscribersPage() {
  const qc = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editSub, setEditSub] = useState<Subscriber | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: subscribers = [] } = useQuery({
    queryKey: ["evt", "subscribers"],
    queryFn: () => subscriberService.list(),
  });

  const toggleMut = useMutation({
    mutationFn: (sub: Subscriber) => subscriberService.update(sub.id, { active: !sub.active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["evt", "subscribers"] }); toast.success("Subscriber atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => subscriberService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["evt", "subscribers"] }); toast.success("Subscriber removido"); },
  });

  const saveMut = useMutation({
    mutationFn: async (data: { id?: string; moduleName: string; eventName: string; handler: string; description: string }) => {
      const now = new Date().toISOString();
      if (data.id) {
        return subscriberService.update(data.id, { ...data, updatedAt: now });
      }
      return subscriberService.create({ ...data, active: true, createdAt: now, updatedAt: now });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["evt", "subscribers"] }); setShowEditor(false); setEditSub(null); toast.success("Subscriber salvo"); },
  });

  const columns: Column<Subscriber>[] = [
    { key: "moduleName", header: "Módulo", sortable: true, sortFn: (a, b) => a.moduleName.localeCompare(b.moduleName), render: (e) => (
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{e.moduleName}</span>
      </div>
    )},
    { key: "eventName", header: "Evento", render: (e) => (
      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{e.eventName}</code>
    )},
    { key: "handler", header: "Handler", render: (e) => (
      <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{e.handler}</code>
    )},
    { key: "active", header: "Ativo", render: (e) => (
      <div className="flex items-center gap-2">
        <Switch checked={e.active} onCheckedChange={() => toggleMut.mutate(e)} />
        {e.active ? <Power className="h-4 w-4 text-green-500" /> : <PowerOff className="h-4 w-4 text-muted-foreground" />}
      </div>
    )},
    { key: "actions", header: "", render: (e) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => { setEditSub(e); setShowEditor(true); }}><Save className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(e.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subscribers</h1>
          <DocButton module="events" page="subscribers" />
          <p className="text-sm text-muted-foreground">Gerenciar inscrições de eventos</p>
        </div>
        <Button onClick={() => { setEditSub(null); setShowEditor(true); }}><Plus className="mr-2 h-4 w-4" />Novo Subscriber</Button>
      </div>

      <DataTable
        data={subscribers}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchKeys={["moduleName", "eventName", "handler"]}
        initialSortColumn="moduleName"
      />

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }} title="Remover Subscriber" description="Tem certeza que deseja remover este subscriber?" />

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowEditor(false); setEditSub(null); }}>
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">{editSub ? "Editar Subscriber" : "Novo Subscriber"}</h2>
            <SubscriberForm subscriber={editSub} onSave={(data) => saveMut.mutate(data)} onClose={() => { setShowEditor(false); setEditSub(null); }} saving={saveMut.isPending} />
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriberForm({ subscriber, onSave, onClose, saving }: {
  subscriber: Subscriber | null;
  onSave: (data: { id?: string; moduleName: string; eventName: string; handler: string; description: string }) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [moduleName, setModuleName] = useState(subscriber?.moduleName ?? "");
  const [eventName, setEventName] = useState(subscriber?.eventName ?? "");
  const [handler, setHandler] = useState(subscriber?.handler ?? "");
  const [description, setDescription] = useState(subscriber?.description ?? "");

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Módulo</Label>
        <Input value={moduleName} onChange={(e) => setModuleName(e.target.value)} placeholder="Ex: Document Platform" />
      </div>
      <div className="space-y-1">
        <Label>Nome do Evento</Label>
        <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="document.created ou * para todos" />
      </div>
      <div className="space-y-1">
        <Label>Handler</Label>
        <Input value={handler} onChange={(e) => setHandler(e.target.value)} placeholder="Ex: documentService.create" />
      </div>
      <div className="space-y-1">
        <Label>Descrição</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do subscriber" />
      </div>
      <div className="border-t pt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave({ id: subscriber?.id, moduleName, eventName, handler, description })} disabled={saving || !moduleName || !eventName}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </div>
  );
}
