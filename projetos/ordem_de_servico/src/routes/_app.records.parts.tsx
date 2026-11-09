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
import { partService } from "@/modules/parts/service";
import type { Part } from "@/modules/parts/types";

export const Route = createFileRoute("/_app/records/parts")({
  head: () => ({ meta: [{ title: "Peças — ServiceForge" }] }),
  component: PartsPage,
});

function PartsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", costPrice: "", quantity: "0" });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["parts"],
    queryFn: () => partService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => partService.create({ name: form.name, code: form.code, costPrice: form.costPrice ? Number(form.costPrice) : undefined, quantity: Number(form.quantity) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parts"] }); setOpen(false); resetForm(); toast("Peça criada"); },
  });

  const updateMut = useMutation({
    mutationFn: () => partService.update(editing!.id, { name: form.name, code: form.code, costPrice: form.costPrice ? Number(form.costPrice) : undefined, quantity: Number(form.quantity) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parts"] }); setOpen(false); setEditing(null); resetForm(); toast("Peça atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => partService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parts"] }); setDeleteId(null); toast("Peça excluída"); },
  });

  const resetForm = () => setForm({ name: "", code: "", costPrice: "", quantity: "0" });
  const openEdit = (item: Part) => { setEditing(item); setForm({ name: item.name, code: item.code, costPrice: item.costPrice?.toString() ?? "", quantity: item.quantity.toString() }); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Peças</h1>
          <p className="text-sm text-muted-foreground">Cadastro de peças e componentes</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Peça</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar Peça" : "Nova Peça"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div><Label>Preço de Custo (R$)</Label><Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></div>
              <div><Label>Quantidade</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
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
        <CardHeader><CardTitle className="text-base">Peças</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma peça cadastrada.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Código</th>
                  <th className="pb-2 font-medium">Preço de Custo</th>
                  <th className="pb-2 font-medium">Quantidade</th>
                  <th className="pb-2 font-medium w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.code}</td>
                    <td className="py-2">{item.costPrice != null ? `R$ ${item.costPrice.toFixed(2)}` : "-"}</td>
                    <td className="py-2">{item.quantity}</td>
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
