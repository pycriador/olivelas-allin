import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceService } from "@/modules/services/service";
import type { Service } from "@/modules/services/types";

export const Route = createFileRoute("/_app/records/services")({
  head: () => ({ meta: [{ title: "Serviços — ServiceForge" }] }),
  component: ServicesPage,
});

function ServicesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", suggestedValue: "", avgTime: "", status: "active" as "active" | "inactive" });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => serviceService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => serviceService.create({ name: form.name, description: form.description || undefined, suggestedValue: form.suggestedValue ? Number(form.suggestedValue) : undefined, avgTime: form.avgTime ? Number(form.avgTime) : undefined, status: form.status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); setOpen(false); resetForm(); toast("Serviço criado"); },
  });

  const updateMut = useMutation({
    mutationFn: () => serviceService.update(editing!.id, { name: form.name, description: form.description || undefined, suggestedValue: form.suggestedValue ? Number(form.suggestedValue) : undefined, avgTime: form.avgTime ? Number(form.avgTime) : undefined, status: form.status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); setOpen(false); setEditing(null); resetForm(); toast("Serviço atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => serviceService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); setDeleteId(null); toast("Serviço excluído"); },
  });

  const resetForm = () => setForm({ name: "", description: "", suggestedValue: "", avgTime: "", status: "active" });
  const openEdit = (item: Service) => { setEditing(item); setForm({ name: item.name, description: item.description ?? "", suggestedValue: item.suggestedValue?.toString() ?? "", avgTime: item.avgTime?.toString() ?? "", status: item.status }); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Serviços</h1>
          <p className="text-sm text-muted-foreground">Cadastro de serviços prestados</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Serviço</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Valor Sugerido (R$)</Label><Input type="number" step="0.01" value={form.suggestedValue} onChange={(e) => setForm({ ...form, suggestedValue: e.target.value })} /></div>
              <div><Label>Tempo Médio (min)</Label><Input type="number" value={form.avgTime} onChange={(e) => setForm({ ...form, avgTime: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); resetForm(); }}>Cancelar</Button>
                <Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()}>
                  {editing ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Serviços</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Valor Sugerido</th>
                  <th className="pb-2 font-medium">Tempo Médio</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.suggestedValue != null ? `R$ ${item.suggestedValue.toFixed(2)}` : "-"}</td>
                    <td className="py-2">{item.avgTime != null ? `${item.avgTime} min` : "-"}</td>
                    <td className="py-2">{item.status === "active" ? "Ativo" : "Inativo"}</td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este registro?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMut.mutate()}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
