import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { deviceService } from "@/modules/devices/service";
import type { DeviceAccessory } from "@/modules/devices/types";

export const Route = createFileRoute("/_app/service-orders/assets/equipment/$id/accessories")({
  head: () => ({ meta: [{ title: "Acessórios — ServiceForge" }] }),
  component: EquipmentAccessoriesTab,
});

type AccessoryForm = { name: string; quantity: number; notes: string };
const emptyForm: AccessoryForm = { name: "", quantity: 1, notes: "" };

function EquipmentAccessoriesTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingAccessoryId, setEditingAccessoryId] = useState<string | null>(null);
  const [deleteAccessoryId, setDeleteAccessoryId] = useState<string | null>(null);
  const [form, setForm] = useState<AccessoryForm>(emptyForm);

  const { data: device, isLoading } = useQuery({
    queryKey: ["device", id],
    queryFn: () => deviceService.get(id),
  });

  const accessories = device?.accessories ?? [];

  const addAccessoryMut = useMutation({
    mutationFn: async () => {
      const acc: Omit<DeviceAccessory, "id"> = { name: form.name, quantity: form.quantity, notes: form.notes || undefined };
      return deviceService.update(id, { accessories: [...accessories, { ...acc, id: crypto.randomUUID() }] });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["device", id] }); setOpen(false); setForm(emptyForm); toast.success("Acessório adicionado"); },
    onError: () => toast.error("Erro ao adicionar acessório"),
  });

  const openEdit = (acc: DeviceAccessory) => {
    setForm({ name: acc.name, quantity: acc.quantity, notes: acc.notes ?? "" });
    setEditingAccessoryId(acc.id);
    setOpen(true);
  };

  const removeAccessoryMut = useMutation({
    mutationFn: async () => {
      const updated = accessories.filter((a) => a.id !== deleteAccessoryId);
      return deviceService.update(id, { accessories: updated });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["device", id] }); setDeleteAccessoryId(null); toast.success("Acessório removido"); },
    onError: () => toast.error("Erro ao remover acessório"),
  });

  const saveAccessory = async () => {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    const newAcc: DeviceAccessory = { id: editingAccessoryId ?? `acc-${Date.now()}`, name: form.name, quantity: form.quantity, notes: form.notes || undefined };
    let updated: DeviceAccessory[];
    if (editingAccessoryId) {
      updated = accessories.map((a) => a.id === editingAccessoryId ? newAcc : a);
    } else {
      updated = [...accessories, newAcc];
    }
    try {
      await deviceService.update(id, { accessories: updated });
      qc.invalidateQueries({ queryKey: ["device", id] });
      setOpen(false); setEditingAccessoryId(null); setForm(emptyForm);
      toast.success(editingAccessoryId ? "Acessório atualizado" : "Acessório adicionado");
    } catch {
      toast.error("Erro ao salvar acessório");
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!device) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Equipamento não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Acessórios</h2>
          <p className="text-sm text-muted-foreground">{accessories.length} acessório(s) registrado(s)</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setEditingAccessoryId(null);
              setForm(emptyForm);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingAccessoryId(null); setForm(emptyForm); setOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Adicionar Acessório
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingAccessoryId ? "Editar Acessório" : "Adicionar Acessório"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Quantidade</Label><Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} /></div>
              <div className="space-y-1"><Label>Observações</Label><textarea className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setOpen(false); setEditingAccessoryId(null); setForm(emptyForm); }}>Cancelar</Button>
              <Button onClick={saveAccessory}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {accessories.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Package className="h-10 w-10" />
              <p className="text-sm">Nenhum acessório registrado</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Nome</th>
                  <th className="p-3 font-medium">Quantidade</th>
                  <th className="p-3 font-medium">Observações</th>
                  <th className="p-3 font-medium w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {accessories.map((acc) => (
                  <tr key={acc.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">{acc.name}</td>
                    <td className="p-3"><Badge variant="secondary">{acc.quantity}</Badge></td>
                    <td className="p-3 text-muted-foreground">{acc.notes ?? "-"}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(acc)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteAccessoryId(acc.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!deleteAccessoryId} onOpenChange={() => setDeleteAccessoryId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Remoção</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja remover este acessório?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteAccessoryId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => removeAccessoryMut.mutate()}>Remover</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
