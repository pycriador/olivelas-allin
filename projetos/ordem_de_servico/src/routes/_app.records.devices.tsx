import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { deviceService } from "@/modules/devices/service";
import type { Device } from "@/modules/devices/types";

export const Route = createFileRoute("/_app/records/devices")({
  head: () => ({ meta: [{ title: "Aparelhos — ServiceForge" }] }),
  component: DevicesPage,
});

function DevicesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    customerId: "", type: "", categoryId: "", manufacturerId: "",
    brandId: "", modelId: "", serialNumber: "", imei: "",
    assetNumber: "", color: "", voltage: "", accessories: "",
    password: "", condition: "", purchaseDate: "", warrantyId: "",
    notes: "", status: "active" as "active" | "inactive" | "in_maintenance" | "deactivated",
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: () => deviceService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => deviceService.create({ ...form, accessories: undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["devices"] }); setOpen(false); resetForm(); toast("Aparelho criado"); },
  });

  const updateMut = useMutation({
    mutationFn: () => deviceService.update(editing!.id, { ...form, accessories: undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["devices"] }); setOpen(false); setEditing(null); resetForm(); toast("Aparelho atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => deviceService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["devices"] }); setDeleteId(null); toast("Aparelho excluído"); },
  });

  const resetForm = () => setForm({
    customerId: "", type: "", categoryId: "", manufacturerId: "",
    brandId: "", modelId: "", serialNumber: "", imei: "", assetNumber: "",
    color: "", voltage: "", accessories: "", password: "", condition: "",
    purchaseDate: "", warrantyId: "", notes: "", status: "active",
  });

  const openEdit = (item: Device) => {
    setEditing(item);
    setForm({
      customerId: item.customerId, type: item.type ?? "", categoryId: item.categoryId ?? "",
      manufacturerId: item.manufacturerId ?? "", brandId: item.brandId ?? "",
      modelId: item.modelId ?? "", serialNumber: item.serialNumber ?? "",
      imei: item.imei ?? "", assetNumber: item.assetNumber ?? "", color: item.color ?? "",
      voltage: item.voltage ?? "", accessories: "",
      password: item.password ?? "", condition: item.condition ?? "",
      purchaseDate: item.purchaseDate ?? "", warrantyId: item.warrantyId ?? "",
      notes: item.notes ?? "", status: item.status,
    });
    setOpen(true);
  };

  const filtered = items.filter(
    (d) => !search || d.serialNumber?.toLowerCase().includes(search.toLowerCase()) || d.imei?.includes(search) || d.assetNumber?.includes(search) || d.color?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aparelhos</h1>
          <p className="text-sm text-muted-foreground">Cadastro de aparelhos dos clientes</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Aparelho</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar Aparelho" : "Novo Aparelho"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>ID do Cliente</Label><Input value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} /></div>
              <div><Label>Tipo</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
              <div><Label>Nº Série</Label><Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></div>
              <div><Label>IMEI</Label><Input value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value })} /></div>
              <div><Label>Patrimônio</Label><Input value={form.assetNumber} onChange={(e) => setForm({ ...form, assetNumber: e.target.value })} /></div>
              <div><Label>Cor</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              <div><Label>Voltagem</Label><Input value={form.voltage} onChange={(e) => setForm({ ...form, voltage: e.target.value })} /></div>
              <div><Label>Acessórios</Label><Input value={form.accessories} onChange={(e) => setForm({ ...form, accessories: e.target.value })} /></div>
              <div className="col-span-2"><Label>Senha</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div className="col-span-2"><Label>Estado de Conservação</Label><Input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} /></div>
              <div><Label>Data de Compra</Label><Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></div>
              <div><Label>Observações</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); resetForm(); }}>Cancelar</Button>
              <Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()}>
                {editing ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Pesquisar por série, IMEI, cor..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="secondary">{filtered.length} aparelho{filtered.length !== 1 ? "s" : ""}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Aparelhos</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Smartphone className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground">Nenhum aparelho encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Nº Série</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">IMEI</th>
                  <th className="pb-2 font-medium">Cor</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{item.serialNumber ?? "-"}</td>
                    <td className="py-2">{item.type ?? "-"}</td>
                    <td className="py-2">{item.imei ?? "-"}</td>
                    <td className="py-2">{item.color ?? "-"}</td>
                    <td className="py-2">
                      <Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status}</Badge>
                    </td>
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
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este aparelho?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMut.mutate()}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
