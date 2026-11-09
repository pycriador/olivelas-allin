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
import { brandService } from "@/modules/brands/service";
import type { Brand } from "@/modules/brands/types";

import { DataTable, type Column } from "@/components/data-table";

export const Route = createFileRoute("/_app/records/brands")({
  head: () => ({ meta: [{ title: "Marcas — ServiceForge" }] }),
  component: BrandsPage,
});

function BrandsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", manufacturerId: "", notes: "", status: "active" as "active" | "inactive" });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: () => brandService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => brandService.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brands"] }); setOpen(false); resetForm(); toast("Marca criada"); },
  });

  const updateMut = useMutation({
    mutationFn: () => brandService.update(editing!.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brands"] }); setOpen(false); setEditing(null); resetForm(); toast("Marca atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => brandService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brands"] }); setDeleteId(null); toast("Marca excluída"); },
  });

  const resetForm = () => setForm({ name: "", manufacturerId: "", notes: "", status: "active" });
  const openEdit = (item: Brand) => { setEditing(item); setForm({ name: item.name, manufacturerId: item.manufacturerId ?? "", notes: item.notes ?? "", status: item.status }); setOpen(true); };

  const columns: Column<Brand>[] = [
    { key: "name", label: "Nome", sortable: true, render: (b) => <span className="font-medium text-foreground">{b.name}</span> },
    { key: "manufacturerId", label: "Fabricante", sortable: true, render: (b) => b.manufacturerId ?? "-" },
    { key: "notes", label: "Observações", sortable: true, render: (b) => b.notes ?? "-" },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (b) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${b.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
          {b.status === "active" ? "Ativo" : "Inativo"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      className: "w-24 text-right",
      render: (b) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)} title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(b.id)} title="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marcas</h1>
          <p className="text-sm text-muted-foreground">Cadastro de marcas de equipamentos</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Marca</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar Marca" : "Nova Marca"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>ID do Fabricante</Label><Input value={form.manufacturerId} onChange={(e) => setForm({ ...form, manufacturerId: e.target.value })} /></div>
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

      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchKeys={["name", "notes", "manufacturerId"]}
        initialSortColumn="name"
      />

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
