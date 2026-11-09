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
import { measurementUnitService } from "@/modules/measurement-units/service";
import type { MeasurementUnit } from "@/modules/measurement-units/types";

export const Route = createFileRoute("/_app/records/measurement-units")({
  head: () => ({ meta: [{ title: "Unidades de Medida — ServiceForge" }] }),
  component: MeasurementUnitsPage,
});

function MeasurementUnitsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MeasurementUnit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", abbreviation: "", category: "", active: true });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["measurementUnits"],
    queryFn: () => measurementUnitService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => measurementUnitService.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["measurementUnits"] }); setOpen(false); resetForm(); toast("Unidade de medida criada"); },
  });

  const updateMut = useMutation({
    mutationFn: () => measurementUnitService.update(editing!.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["measurementUnits"] }); setOpen(false); setEditing(null); resetForm(); toast("Unidade de medida atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => measurementUnitService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["measurementUnits"] }); setDeleteId(null); toast("Unidade de medida excluída"); },
  });

  const resetForm = () => setForm({ name: "", abbreviation: "", category: "", active: true });
  const openEdit = (item: MeasurementUnit) => { setEditing(item); setForm({ name: item.name, abbreviation: item.abbreviation, category: item.category ?? "", active: item.active }); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Unidades de Medida</h1>
          <p className="text-sm text-muted-foreground">Cadastro de unidades de medida</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Unidade</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar Unidade de Medida" : "Nova Unidade de Medida"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Abreviação</Label><Input value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} /></div>
              <div><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4" />
                <Label htmlFor="active">Ativo</Label>
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
        <CardHeader><CardTitle className="text-base">Unidades de Medida</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma unidade de medida cadastrada.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Abreviação</th>
                  <th className="pb-2 font-medium">Categoria</th>
                  <th className="pb-2 font-medium">Ativo</th>
                  <th className="pb-2 font-medium w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.abbreviation}</td>
                    <td className="py-2">{item.category ?? "-"}</td>
                    <td className="py-2">{item.active ? "Sim" : "Não"}</td>
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
