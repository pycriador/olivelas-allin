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
import { warrantyService } from "@/modules/warranties/service";
import type { Warranty } from "@/modules/warranties/types";

export const Route = createFileRoute("/_app/records/warranties")({
  head: () => ({ meta: [{ title: "Garantias — ServiceForge" }] }),
  component: WarrantiesPage,
});

function WarrantiesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Warranty | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", days: "30", coverage: "", notes: "", status: "active" as "active" | "inactive" });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["warranties"],
    queryFn: () => warrantyService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => warrantyService.create({ name: form.name, days: Number(form.days), coverage: form.coverage || undefined, notes: form.notes || undefined, status: form.status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["warranties"] }); setOpen(false); resetForm(); toast("Garantia criada"); },
  });

  const updateMut = useMutation({
    mutationFn: () => warrantyService.update(editing!.id, { name: form.name, days: Number(form.days), coverage: form.coverage || undefined, notes: form.notes || undefined, status: form.status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["warranties"] }); setOpen(false); setEditing(null); resetForm(); toast("Garantia atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => warrantyService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["warranties"] }); setDeleteId(null); toast("Garantia excluída"); },
  });

  const resetForm = () => setForm({ name: "", days: "30", coverage: "", notes: "", status: "active" });
  const openEdit = (item: Warranty) => { setEditing(item); setForm({ name: item.name, days: item.days.toString(), coverage: item.coverage ?? "", notes: item.notes ?? "", status: item.status }); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Garantias</h1>
          <p className="text-sm text-muted-foreground">Cadastro de garantias</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Garantia</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar Garantia" : "Nova Garantia"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Dias</Label><Input type="number" min="1" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} /></div>
              <div><Label>Cobertura</Label><Input value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })} /></div>
              <div><Label>Observações</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
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
        <CardHeader><CardTitle className="text-base">Garantias</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma garantia cadastrada.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Dias</th>
                  <th className="pb-2 font-medium">Cobertura</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.days} dias</td>
                    <td className="py-2">{item.coverage ?? "-"}</td>
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
