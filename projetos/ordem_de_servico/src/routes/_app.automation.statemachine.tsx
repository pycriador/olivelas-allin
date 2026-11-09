import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Map, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { stateMachineService } from "@/modules/automation/service";
import type { StateMachine } from "@/modules/automation/types";

const smSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  entityType: z.string().min(1, "Tipo de entidade é obrigatório"),
  initialStatus: z.string().min(1, "Status inicial é obrigatório"),
  finalStatuses: z.string().optional(),
});

type SMForm = z.infer<typeof smSchema>;

export const Route = createFileRoute("/_app/automation/statemachine")({
  head: () => ({ meta: [{ title: "Máquina de Estados — ServiceForge" }] }),
  component: AutomationStateMachinePage,
});

function AutomationStateMachinePage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: machines = [] } = useQuery({ queryKey: ["automation", "statemachines"], queryFn: () => stateMachineService.list() });

  const form = useForm<SMForm>({
    resolver: zodResolver(smSchema),
    defaultValues: { name: "", description: "", entityType: "", initialStatus: "", finalStatuses: "" },
  });

  const createMut = useMutation({
    mutationFn: (data: SMForm) => {
      const now = new Date().toISOString();
      return stateMachineService.create({
        name: data.name, description: data.description ?? "", entityType: data.entityType,
        states: [], transitions: [], initialStatus: data.initialStatus,
        finalStatuses: data.finalStatuses ? data.finalStatuses.split(",").map((s) => s.trim()) : [],
        version: 1, isGlobal: false, tags: [], createdBy: "system", createdAt: now, updatedAt: now,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "statemachines"] }); setDialogOpen(false); form.reset(); toast.success("Máquina de estados criada"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SMForm }) => {
      return stateMachineService.update(id, {
        ...data, finalStatuses: data.finalStatuses ? data.finalStatuses.split(",").map((s) => s.trim()) : [],
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "statemachines"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Máquina de estados atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => stateMachineService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "statemachines"] }); toast.success("Máquina de estados excluída"); },
  });

  const openEdit = (id: string) => {
    const item = machines.find((m) => m.id === id);
    if (!item) return;
    setEditingId(id);
    form.reset({ name: item.name, description: item.description, entityType: item.entityType, initialStatus: item.initialStatus, finalStatuses: item.finalStatuses.join(", ") });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset({ name: "", description: "", entityType: "", initialStatus: "", finalStatuses: "" });
    setDialogOpen(true);
  };

  const columns: Column<StateMachine>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (m) => (
      <div className="flex items-center gap-2">
        <Map className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{m.name}</span>
      </div>
    )},
    { key: "entityType", header: "Tipo de Entidade", render: (m) => <Badge variant="secondary">{m.entityType}</Badge> },
    { key: "states", header: "Estados", render: (m) => <span className="text-sm">{m.states.length}</span> },
    { key: "transitions", header: "Transições", render: (m) => <span className="text-sm">{m.transitions.length}</span> },
    { key: "initialStatus", header: "Status Inicial", render: (m) => <Badge variant="outline" className="border-green-500 text-green-600">{m.initialStatus}</Badge> },
    { key: "version", header: "Versão", render: (m) => <span className="text-sm">v{m.version}</span> },
    { key: "actions", header: "Ações", render: (m) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(m.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Máquina de Estados</h1>
          <p className="text-sm text-muted-foreground">Gerencie as máquinas de estado da plataforma</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova Máquina</Button>
      </div>

      <DataTable
        data={machines}
        columns={columns}
        keyExtractor={(m) => m.id}
        searchKeys={["name", "entityType"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Máquina de Estados" : "Nova Máquina de Estados"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tipo de Entidade</Label><Input {...form.register("entityType")} placeholder="ex: serviceOrder" /></div>
              <div className="space-y-2"><Label>Status Inicial</Label><Input {...form.register("initialStatus")} placeholder="ex: pending" /></div>
              <div className="space-y-2 col-span-2"><Label>Status Finais (separados por vírgula)</Label><Input {...form.register("finalStatuses")} placeholder="ex: completed, cancelled" /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
