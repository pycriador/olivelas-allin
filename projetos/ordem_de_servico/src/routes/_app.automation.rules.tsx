import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, GitBranch, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { ruleService } from "@/modules/automation/service";
import type { BusinessRule } from "@/modules/automation/types";

const ruleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["simple", "switch", "composite"]),
  category: z.string().optional(),
  priority: z.coerce.number().min(0).default(0),
  enabled: z.boolean().default(true),
});

type RuleForm = z.infer<typeof ruleSchema>;

const RULE_CATEGORIES = ["serviceOrder", "warranty", "return", "registration", "import", "integration", "communication", "audit", "custom"];

export const Route = createFileRoute("/_app/automation/rules")({
  head: () => ({ meta: [{ title: "Regras de Negócio — ServiceForge" }] }),
  component: AutomationRulesPage,
});

function AutomationRulesPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");

  const { data: rules = [] } = useQuery({ queryKey: ["automation", "rules"], queryFn: () => ruleService.list() });

  const filtered = filterCategory ? rules.filter((r) => r.category === filterCategory) : rules;

  const form = useForm<z.input<typeof ruleSchema>, any, z.output<typeof ruleSchema>>({
    resolver: zodResolver(ruleSchema),
    defaultValues: { type: "simple", priority: 0, enabled: true },
  });

  const createMut = useMutation({
    mutationFn: (data: RuleForm) => {
      const now = new Date().toISOString();
      return ruleService.create({
        name: data.name, description: data.description ?? "", type: data.type,
        category: data.category ?? "", priority: data.priority, enabled: data.enabled,
        version: 1, conditions: [], actions: [], tags: [], isGlobal: false,
        createdBy: "system", createdAt: now, updatedAt: now,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "rules"] }); setDialogOpen(false); form.reset(); toast.success("Regra criada"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RuleForm }) => {
      return ruleService.update(id, { ...data, updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "rules"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Regra atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => ruleService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "rules"] }); toast.success("Regra excluída"); },
  });

  const openEdit = (id: string) => {
    const item = rules.find((r) => r.id === id);
    if (!item) return;
    setEditingId(id);
    form.reset({ name: item.name, description: item.description, type: item.type, category: item.category, priority: item.priority, enabled: item.enabled });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset({ name: "", description: "", type: "simple", category: "", priority: 0, enabled: true });
    setDialogOpen(true);
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = { simple: "bg-blue-500", switch: "bg-purple-500", composite: "bg-orange-500" };
    return <Badge className={`${colors[type] ?? "bg-gray-500"} text-white`}>{type}</Badge>;
  };

  const columns: Column<BusinessRule>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (r) => (
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{r.name}</span>
      </div>
    )},
    { key: "type", header: "Tipo", render: (r) => typeBadge(r.type) },
    { key: "category", header: "Categoria", render: (r) => <Badge variant="outline">{r.category || "—"}</Badge> },
    { key: "priority", header: "Prioridade", render: (r) => <span className="text-sm">{r.priority}</span> },
    { key: "enabled", header: "Ativo", render: (r) => (
      <Badge variant={r.enabled ? "default" : "secondary"} className="gap-1">
        {r.enabled ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {r.enabled ? "Sim" : "Não"}
      </Badge>
    )},
    { key: "version", header: "Versão", render: (r) => <span className="text-sm">v{r.version}</span> },
    { key: "actions", header: "Ações", render: (r) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(r.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Regras de Negócio</h1>
          <p className="text-sm text-muted-foreground">Gerencie as regras de negócio da plataforma</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova Regra</Button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchKeys={["name", "category"]}
        initialSortColumn="name"
        toolbar={
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar por categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {RULE_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Regra" : "Nova Regra"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tipo</Label>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as "simple" | "switch" | "composite")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="switch">Switch</SelectItem>
                    <SelectItem value="composite">Composite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Categoria</Label>
                <Select value={form.watch("category")} onValueChange={(v) => form.setValue("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {RULE_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Prioridade</Label><Input type="number" {...form.register("priority")} /></div>
              <div className="space-y-2 flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Switch checked={form.watch("enabled")} onCheckedChange={(v) => form.setValue("enabled", v)} />
                  <Label>Ativo</Label>
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
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
