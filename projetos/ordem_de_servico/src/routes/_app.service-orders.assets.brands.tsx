import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { brandService } from "@/modules/brands/service";
import type { Brand } from "@/modules/brands/types";

export const Route = createFileRoute("/_app/service-orders/assets/brands")({
  head: () => ({ meta: [{ title: "Marcas — ServiceForge" }] }),
  component: BrandsPage,
});

type FormData = { name: string; notes: string; status: "active" | "inactive" };
const emptyForm: FormData = { name: "", notes: "", status: "active" };

function BrandsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: () => brandService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => brandService.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brands"] }); setOpen(false); setForm(emptyForm); toast.success("Marca criada"); },
  });

  const updateMut = useMutation({
    mutationFn: () => brandService.update(editingId!, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brands"] }); setOpen(false); setEditingId(null); setForm(emptyForm); toast.success("Marca atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => brandService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brands"] }); setDeleteId(null); toast.success("Marca excluída"); },
  });

  const openEdit = (item: Brand) => {
    setForm({ name: item.name, notes: item.notes ?? "", status: item.status });
    setEditingId(item.id);
    setOpen(true);
  };

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q) || (i.notes ?? "").toLowerCase().includes(q));
  }, [items, search]);

  const save = editingId ? updateMut : createMut;
  const statusColors: Record<string, string> = { active: "bg-green-100 text-green-700", inactive: "bg-gray-100 text-gray-700" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marcas</h1>
          <p className="text-sm text-muted-foreground">Gerencie as marcas de equipamentos</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setEditingId(null);
              setForm(emptyForm);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setForm(emptyForm); setOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Nova Marca
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar Marca" : "Nova Marca"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Observações</Label><textarea className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="space-y-1"><Label>Status</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setOpen(false); setEditingId(null); setForm(emptyForm); }}>Cancelar</Button>
              <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="secondary">{filtered.length} marcas</Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhuma marca encontrada</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Nome</th>
                  <th className="p-3 font-medium">Observações</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3 text-muted-foreground">{item.notes ?? "-"}</td>
                    <td className="p-3"><Badge className={statusColors[item.status]} variant="outline">{item.status === "active" ? "Ativo" : "Inativo"}</Badge></td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir esta marca?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMut.mutate()}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
