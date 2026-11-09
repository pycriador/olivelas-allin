import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, CheckSquare, UserCheck, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { approvalFlowService, approvalRequestService } from "@/modules/automation/service";
import type { ApprovalFlow, ApprovalRequest } from "@/modules/automation/types";

const flowSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["sequential", "parallel", "majority", "unanimous"]),
  timeoutMinutes: z.coerce.number().optional(),
  allowDelegation: z.boolean().default(false),
});

type FlowForm = z.infer<typeof flowSchema>;

export const Route = createFileRoute("/_app/automation/approvals")({
  head: () => ({ meta: [{ title: "Aprovações — ServiceForge" }] }),
  component: AutomationApprovalsPage,
});

function AutomationApprovalsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"flow" | "request">("flow");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const { data: flows = [] } = useQuery({ queryKey: ["automation", "approvalFlows"], queryFn: () => approvalFlowService.list() });
  const { data: requests = [] } = useQuery({ queryKey: ["automation", "approvalRequests"], queryFn: () => approvalRequestService.list() });

  const filteredRequests = filterStatus ? requests.filter((r) => r.status === filterStatus) : requests;

  const form = useForm<z.input<typeof flowSchema>, any, z.output<typeof flowSchema>>({
    resolver: zodResolver(flowSchema),
    defaultValues: { type: "sequential", allowDelegation: false },
  });

  const createMut = useMutation({
    mutationFn: (data: FlowForm) => {
      const now = new Date().toISOString();
      return approvalFlowService.create({
        name: data.name, description: data.description ?? "", type: data.type,
        steps: [], timeoutMinutes: data.timeoutMinutes, canCancel: true,
        allowDelegation: data.allowDelegation, tags: [], isGlobal: false,
        createdBy: "system", createdAt: now, updatedAt: now,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "approvalFlows"] }); setDialogOpen(false); form.reset(); toast.success("Fluxo de aprovação criado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FlowForm }) => {
      return approvalFlowService.update(id, { ...data, updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "approvalFlows"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Fluxo de aprovação atualizado"); },
  });

  const deleteFlowMut = useMutation({
    mutationFn: (id: string) => approvalFlowService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "approvalFlows"] }); toast.success("Fluxo de aprovação excluído"); },
  });

  const deleteRequestMut = useMutation({
    mutationFn: (id: string) => approvalRequestService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "approvalRequests"] }); toast.success("Solicitação excluída"); },
  });

  const openEdit = (id: string) => {
    const item = flows.find((f) => f.id === id);
    if (!item) return;
    setEditingId(id);
    form.reset({ name: item.name, description: item.description, type: item.type, timeoutMinutes: item.timeoutMinutes, allowDelegation: item.allowDelegation });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset({ name: "", description: "", type: "sequential", timeoutMinutes: undefined, allowDelegation: false });
    setDialogOpen(true);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500", approved: "bg-green-500", rejected: "bg-red-500",
      cancelled: "bg-gray-500", escalated: "bg-orange-500", delegated: "bg-blue-500",
    };
    return <Badge className={`${colors[status] ?? "bg-gray-500"} text-white`}>{status}</Badge>;
  };

  const flowColumns: Column<ApprovalFlow>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (f) => (
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{f.name}</span>
      </div>
    )},
    { key: "type", header: "Tipo", render: (f) => <Badge variant="secondary">{f.type}</Badge> },
    { key: "steps", header: "Passos", render: (f) => <span className="text-sm">{f.steps.length}</span> },
    { key: "timeout", header: "Timeout (min)", render: (f) => <span className="text-sm">{f.timeoutMinutes ?? "—"}</span> },
    { key: "allowDelegation", header: "Delegação", render: (f) => (
      <Badge variant={f.allowDelegation ? "default" : "secondary"}>
        {f.allowDelegation ? "Permitida" : "Negada"}
      </Badge>
    )},
    { key: "actions", header: "Ações", render: (f) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(f.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => { setDeleteId(f.id); setDeleteType("flow"); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  const requestColumns: Column<ApprovalRequest>[] = [
    { key: "referenceName", header: "Referência", sortable: true, sortFn: (a, b) => a.referenceName.localeCompare(b.referenceName), render: (r) => <span className="font-medium">{r.referenceName}</span> },
    { key: "approvalFlowName", header: "Fluxo", render: (r) => <span className="text-sm">{r.approvalFlowName}</span> },
    { key: "status", header: "Status", render: (r) => statusBadge(r.status) },
    { key: "step", header: "Passo", render: (r) => <span className="text-sm">{r.currentStep}/{r.totalSteps}</span> },
    { key: "requestedBy", header: "Solicitante", render: (r) => <span className="text-sm">{r.requestedBy}</span> },
    { key: "requestedAt", header: "Data", render: (r) => <span className="text-sm">{new Date(r.requestedAt).toLocaleDateString()}</span> },
    { key: "actions", header: "Ações", render: (r) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => { setDeleteId(r.id); setDeleteType("request"); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aprovações</h1>
          <p className="text-sm text-muted-foreground">Gerencie fluxos de aprovação e solicitações</p>
        </div>
      </div>

      <Tabs defaultValue="flows">
        <TabsList>
          <TabsTrigger value="flows">Fluxos de Aprovação</TabsTrigger>
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
        </TabsList>

        <TabsContent value="flows" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo Fluxo</Button>
          </div>
          <DataTable
            data={flows}
            columns={flowColumns}
            keyExtractor={(f) => f.id}
            searchKeys={["name", "type"]}
            initialSortColumn="name"
          />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <DataTable
            data={filteredRequests}
            columns={requestColumns}
            keyExtractor={(r) => r.id}
            searchKeys={["referenceName", "approvalFlowName", "requestedBy"]}
            initialSortColumn="requestedAt"
            toolbar={
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="escalated">Escalado</SelectItem>
                  <SelectItem value="delegated">Delegado</SelectItem>
                </SelectContent>
              </Select>
            }
          />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Fluxo de Aprovação" : "Novo Fluxo de Aprovação"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tipo</Label>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as "sequential" | "parallel" | "majority" | "unanimous")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequential">Sequencial</SelectItem>
                    <SelectItem value="parallel">Paralelo</SelectItem>
                    <SelectItem value="majority">Maioria</SelectItem>
                    <SelectItem value="unanimous">Unânime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Timeout (minutos)</Label><Input type="number" {...form.register("timeoutMinutes")} /></div>
              <div className="space-y-2 flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Switch checked={form.watch("allowDelegation")} onCheckedChange={(v) => form.setValue("allowDelegation", v)} />
                  <Label>Permitir Delegação</Label>
                </div>
              </div>
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
        onOpenChange={(o) => { if (!o) { setDeleteId(null); } }}
        onConfirm={() => {
          if (deleteId) {
            if (deleteType === "flow") deleteFlowMut.mutate(deleteId);
            else deleteRequestMut.mutate(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
}
