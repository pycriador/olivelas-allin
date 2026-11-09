import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Shield, CheckCircle2, XCircle } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { policyService } from "@/modules/admin/service";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { Policy, PolicyRule } from "@/modules/admin/types";

const policySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  category: z.enum(["password", "session", "login", "timeout", "upload", "export", "print", "audit", "lgpd", "retention", "other"]),
  scope: z.enum(["global", "company"]),
  enabled: z.boolean(),
});

type PolicyForm = z.infer<typeof policySchema>;

const ruleOperators = ["eq", "neq", "gt", "gte", "lt", "lte", "contains"] as const;

export const Route = createFileRoute("/_app/admin/policies")({
  head: () => ({ meta: [{ title: "Admin Políticas — ServiceForge" }] }),
  component: AdminPoliciesPage,
});

function AdminPoliciesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rules, setRules] = useState<PolicyRule[]>([]);

  const { data: policies = [] } = useQuery({ queryKey: ["admin", "policies", "list"], queryFn: () => policyService.list() });

  const form = useForm<PolicyForm>({
    resolver: zodResolver(policySchema),
    defaultValues: { enabled: true, scope: "global", category: "password" },
  });

  const createMut = useMutation({
    mutationFn: (data: PolicyForm) => policyService.create({
      name: data.name, description: data.description ?? "", category: data.category,
      rules, scope: data.scope, enabled: data.enabled,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "policies"] }); setDialogOpen(false); form.reset(); setRules([]); toast.success("Política criada"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PolicyForm }) => policyService.update(id, { ...data, rules, updatedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "policies"] }); setDialogOpen(false); setEditingId(null); form.reset(); setRules([]); toast.success("Política atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => policyService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "policies"] }); toast.success("Política excluída"); },
  });

  const openEdit = (id: string) => {
    const p = policies.find((p) => p.id === id);
    if (!p) return;
    setEditingId(id);
    setRules(p.rules);
    form.reset({ name: p.name, description: p.description, category: p.category, scope: p.scope, enabled: p.enabled });
    setDialogOpen(true);
  };

  const addRule = () => {
    setRules([...rules, { key: "", value: "", operator: "eq" }]);
  };

  const updateRule = (index: number, field: keyof PolicyRule, value: string) => {
    const updated = [...rules];
    (updated[index] as any)[field] = value;
    setRules(updated);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const categoryLabels: Record<string, string> = {
    password: "Senha", session: "Sessão", login: "Login", timeout: "Timeout",
    upload: "Upload", export: "Exportação", print: "Impressão", audit: "Auditoria",
    lgpd: "LGPD", retention: "Retenção", other: "Outro",
  };

  const columns: Column<Policy>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (p) => (
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{p.name}</span>
      </div>
    )},
    { key: "category", header: "Categoria", render: (p) => <Badge variant="outline">{categoryLabels[p.category]}</Badge> },
    { key: "scope", header: "Escopo", render: (p) => (
      <Badge variant={p.scope === "global" ? "default" : "secondary"}>{p.scope === "global" ? "Global" : "Empresa"}</Badge>
    )},
    { key: "rules", header: "Regras", render: (p) => <Badge variant="outline">{p.rules.length} regra(s)</Badge> },
    { key: "enabled", header: "Ativo", render: (p) => (
      p.enabled ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />
    )},
    { key: "actions", header: "Ações", render: (p) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(p.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.policies")}</h1>
            <DocButton module="admin" page="policies" title="Políticas" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie as políticas de segurança da plataforma</p>
        </div>
        <Button onClick={() => { setEditingId(null); form.reset({ enabled: true, scope: "global", category: "password" }); setRules([]); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />{t("admin.newPolicy")}
        </Button>
      </div>

      <DataTable
        data={policies}
        columns={columns}
        keyExtractor={(p) => p.id}
        searchKeys={["name", "description"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? t("admin.editPolicy") : t("admin.newPolicy")}</DialogTitle>
            <DialogDescription>Configure a política de segurança</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
              <div className="space-y-2 col-span-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
              <div className="space-y-2"><Label>Categoria</Label>
                <Select value={form.watch("category")} onValueChange={(v) => form.setValue("category", v as Policy["category"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Escopo</Label>
                <Select value={form.watch("scope")} onValueChange={(v) => form.setValue("scope", v as "global" | "company")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="company">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-center gap-2">
                <Label>Ativo</Label>
                <Switch checked={form.watch("enabled")} onCheckedChange={(v) => form.setValue("enabled", v)} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Regras</Label>
                <Button type="button" size="sm" variant="outline" onClick={addRule}>Adicionar Regra</Button>
              </div>
              {rules.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chave</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule, i) => (
                      <TableRow key={i}>
                        <TableCell><Input value={rule.key} onChange={(e) => updateRule(i, "key", e.target.value)} placeholder="Ex: min_length" /></TableCell>
                        <TableCell>
                          <Select value={rule.operator} onValueChange={(v) => updateRule(i, "operator", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ruleOperators.map((op) => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Input value={String(rule.value)} onChange={(e) => updateRule(i, "value", e.target.value)} placeholder="Valor" /></TableCell>
                        <TableCell>
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeRule(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {rules.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma regra definida</p>}
            </div>

            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit">{t("common.save")}</Button>
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