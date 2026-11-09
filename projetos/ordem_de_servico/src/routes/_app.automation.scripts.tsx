import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, FileText, CheckCircle2, XCircle } from "lucide-react";
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
import { scriptService } from "@/modules/automation/service";
import type { ScriptDefinition } from "@/modules/automation/types";

const scriptSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  language: z.enum(["javascript", "python", "expression"]),
  timeoutMs: z.coerce.number().min(0).default(30000),
});

type ScriptForm = z.infer<typeof scriptSchema>;

export const Route = createFileRoute("/_app/automation/scripts")({
  head: () => ({ meta: [{ title: "Scripts — ServiceForge" }] }),
  component: AutomationScriptsPage,
});

function AutomationScriptsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: scripts = [] } = useQuery({ queryKey: ["automation", "scripts"], queryFn: () => scriptService.list() });

  const form = useForm<z.input<typeof scriptSchema>, any, z.output<typeof scriptSchema>>({
    resolver: zodResolver(scriptSchema),
    defaultValues: { language: "javascript", timeoutMs: 30000 },
  });

  const createMut = useMutation({
    mutationFn: (data: ScriptForm) => {
      const now = new Date().toISOString();
      return scriptService.create({
        name: data.name, description: data.description ?? "", language: data.language,
        code: "", parameters: [], returnType: "string", timeoutMs: data.timeoutMs,
        version: 1, enabled: true, isSystem: false, tags: [], isGlobal: false,
        createdBy: "system", createdAt: now, updatedAt: now,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "scripts"] }); setDialogOpen(false); form.reset(); toast.success("Script criado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScriptForm }) => {
      return scriptService.update(id, { ...data, updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "scripts"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Script atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => scriptService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "scripts"] }); toast.success("Script excluído"); },
  });

  const openEdit = (id: string) => {
    const item = scripts.find((s) => s.id === id);
    if (!item) return;
    setEditingId(id);
    form.reset({ name: item.name, description: item.description, language: item.language, timeoutMs: item.timeoutMs });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset({ name: "", description: "", language: "javascript", timeoutMs: 30000 });
    setDialogOpen(true);
  };

  const langBadge = (lang: string) => {
    const colors: Record<string, string> = { javascript: "bg-yellow-500", python: "bg-blue-500", expression: "bg-green-500" };
    return <Badge className={`${colors[lang] ?? "bg-gray-500"} text-white`}>{lang}</Badge>;
  };

  const columns: Column<ScriptDefinition>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (s) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{s.name}</span>
      </div>
    )},
    { key: "language", header: "Linguagem", render: (s) => langBadge(s.language) },
    { key: "parameters", header: "Parâmetros", render: (s) => <span className="text-sm">{s.parameters.length}</span> },
    { key: "timeoutMs", header: "Timeout (ms)", render: (s) => <span className="text-sm">{s.timeoutMs}</span> },
    { key: "enabled", header: "Ativo", render: (s) => (
      <Badge variant={s.enabled ? "default" : "secondary"} className="gap-1">
        {s.enabled ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {s.enabled ? "Sim" : "Não"}
      </Badge>
    )},
    { key: "isSystem", header: "Sistema", render: (s) => (
      <Badge variant={s.isSystem ? "default" : "secondary"}>
        {s.isSystem ? "Sim" : "Não"}
      </Badge>
    )},
    { key: "version", header: "Versão", render: (s) => <span className="text-sm">v{s.version}</span> },
    { key: "actions", header: "Ações", render: (s) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(s.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Scripts</h1>
          <p className="text-sm text-muted-foreground">Gerencie os scripts da plataforma</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo Script</Button>
      </div>

      <DataTable
        data={scripts}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchKeys={["name", "language"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Script" : "Novo Script"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Linguagem</Label>
                <Select value={form.watch("language")} onValueChange={(v) => form.setValue("language", v as "javascript" | "python" | "expression")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="expression">Expression</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Timeout (ms)</Label><Input type="number" {...form.register("timeoutMs")} /></div>
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
