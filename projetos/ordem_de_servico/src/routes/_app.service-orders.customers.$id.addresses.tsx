import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";
import type { Customer, CustomerAddress } from "@/modules/customers/types";

export const Route = createFileRoute("/_app/service-orders/customers/$id/addresses")({
  head: () => ({ meta: [{ title: "Endereços — ServiceForge" }] }),
  component: CustomerAddressesPage,
});

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function CustomerAddressesPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "", addressType: "residential" as CustomerAddress["addressType"],
    zipCode: "", street: "", number: "", complement: "", neighborhood: "",
    city: "", state: "", country: "Brasil", isDefault: false,
  });

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const addresses = customer?.addresses ?? [];

  const saveAddress = () => {
    const newAddr: CustomerAddress = { id: editingAddressId ?? uid(), ...form };
    let updated: CustomerAddress[];
    if (newAddr.isDefault) {
      updated = (customer!.addresses ?? []).map((a) => ({ ...a, isDefault: false }));
    } else {
      updated = [...(customer!.addresses ?? [])];
    }
    if (editingAddressId) {
      updated = updated.map((a) => a.id === editingAddressId ? newAddr : a);
    } else {
      updated.push(newAddr);
    }
    return customerService.update(id, { addresses: updated });
  };

  const saveMut = useMutation({
    mutationFn: saveAddress,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer", id] }); setOpen(false); setEditingAddressId(null); resetForm(); toast.success("Endereço salvo"); },
    onError: () => toast.error("Erro ao salvar endereço"),
  });

  const deleteAddress = () => {
    const updated = (customer!.addresses ?? []).filter((a) => a.id !== deleteId);
    return customerService.update(id, { addresses: updated });
  };

  const deleteMut = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer", id] }); setDeleteId(null); toast.success("Endereço removido"); },
    onError: () => toast.error("Erro ao remover endereço"),
  });

  const resetForm = () => setForm({ label: "", addressType: "residential", zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", country: "Brasil", isDefault: false });

  const openEdit = (addr: CustomerAddress) => {
    setForm({ label: addr.label, addressType: addr.addressType, zipCode: addr.zipCode, street: addr.street, number: addr.number, complement: addr.complement ?? "", neighborhood: addr.neighborhood, city: addr.city, state: addr.state, country: addr.country, isDefault: addr.isDefault });
    setEditingAddressId(addr.id);
    setOpen(true);
  };

  const typeLabels: Record<string, string> = { residential: "Residencial", commercial: "Comercial", delivery: "Entrega", billing: "Cobrança", other: "Outro" };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Endereços</h1>
          <p className="text-sm text-muted-foreground">Gerencie os endereços do cliente</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setEditingAddressId(null);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingAddressId(null); resetForm(); setOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Novo Endereço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingAddressId ? "Editar Endereço" : "Novo Endereço"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label>Identificação</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex: Casa, Escritório" /></div>
              <div className="space-y-1"><Label>Tipo</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.addressType} onChange={(e) => setForm({ ...form, addressType: e.target.value as any })}>
                  <option value="residential">Residencial</option>
                  <option value="commercial">Comercial</option>
                  <option value="delivery">Entrega</option>
                  <option value="billing">Cobrança</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div className="space-y-1"><Label>CEP</Label><Input value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} /></div>
              <div className="space-y-1 col-span-2"><Label>Logradouro</Label><Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></div>
              <div className="space-y-1"><Label>Número</Label><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></div>
              <div className="space-y-1"><Label>Complemento</Label><Input value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} /></div>
              <div className="space-y-1"><Label>Bairro</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></div>
              <div className="space-y-1"><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div className="space-y-1"><Label>Estado</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              <div className="space-y-1"><Label>País</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
              <div className="space-y-1 flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                  <span className="text-sm">Endereço Padrão</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setOpen(false); setEditingAddressId(null); resetForm(); }}>Cancelar</Button>
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>{saveMut.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhum endereço cadastrado</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((addr) => (
            <Card key={addr.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{addr.label || "Sem identificação"}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(addr)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteId(addr.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">{typeLabels[addr.addressType]}</Badge>
                  {addr.isDefault && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
                </div>
                <div className="text-sm">
                  <p>{addr.street}, {addr.number}</p>
                  {addr.complement && <p className="text-muted-foreground">{addr.complement}</p>}
                  <p className="text-muted-foreground">{addr.neighborhood}</p>
                  <p className="text-muted-foreground">{addr.city}/{addr.state} - {addr.zipCode}</p>
                  <p className="text-muted-foreground">{addr.country}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remover Endereço</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja remover este endereço?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMut.mutate()}>Remover</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
