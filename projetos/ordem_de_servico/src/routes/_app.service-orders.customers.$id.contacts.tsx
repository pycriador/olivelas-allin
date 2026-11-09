import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";
import type { Customer, CustomerContact } from "@/modules/customers/types";

export const Route = createFileRoute("/_app/service-orders/customers/$id/contacts")({
  head: () => ({ meta: [{ title: "Contatos — ServiceForge" }] }),
  component: CustomerContactsPage,
});

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function CustomerContactsPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", position: "", phone: "", cellphone: "", whatsapp: "", email: "", notes: "", isDefault: false });

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const contacts = customer?.contacts ?? [];

  const saveContact = () => {
    const newContact: CustomerContact = { id: editingContactId ?? uid(), ...form };
    let updated: CustomerContact[];
    if (newContact.isDefault) {
      updated = (customer!.contacts ?? []).map((c) => ({ ...c, isDefault: false }));
    } else {
      updated = [...(customer!.contacts ?? [])];
    }
    if (editingContactId) {
      updated = updated.map((c) => c.id === editingContactId ? newContact : c);
    } else {
      updated.push(newContact);
    }
    return customerService.update(id, { contacts: updated });
  };

  const saveMut = useMutation({
    mutationFn: saveContact,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer", id] }); setOpen(false); setEditingContactId(null); setForm({ name: "", position: "", phone: "", cellphone: "", whatsapp: "", email: "", notes: "", isDefault: false }); toast.success("Contato salvo"); },
    onError: () => toast.error("Erro ao salvar contato"),
  });

  const deleteContact = () => {
    const updated = (customer!.contacts ?? []).filter((c) => c.id !== deleteId);
    return customerService.update(id, { contacts: updated });
  };

  const deleteMut = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer", id] }); setDeleteId(null); toast.success("Contato removido"); },
    onError: () => toast.error("Erro ao remover contato"),
  });

  const openEdit = (ct: CustomerContact) => {
    setForm({ name: ct.name, position: ct.position ?? "", phone: ct.phone ?? "", cellphone: ct.cellphone ?? "", whatsapp: ct.whatsapp ?? "", email: ct.email ?? "", notes: ct.notes ?? "", isDefault: ct.isDefault });
    setEditingContactId(ct.id);
    setOpen(true);
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contatos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os contatos do cliente</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setEditingContactId(null);
              setForm({ name: "", position: "", phone: "", cellphone: "", whatsapp: "", email: "", notes: "", isDefault: false });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingContactId(null); setForm({ name: "", position: "", phone: "", cellphone: "", whatsapp: "", email: "", notes: "", isDefault: false }); setOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Novo Contato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingContactId ? "Editar Contato" : "Novo Contato"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Cargo</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
              <div className="space-y-1"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-1"><Label>Celular</Label><Input value={form.cellphone} onChange={(e) => setForm({ ...form, cellphone: e.target.value })} /></div>
              <div className="space-y-1"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1 col-span-2"><Label>Observações</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="space-y-1 flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                  <span className="text-sm">Contato Principal</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setOpen(false); setEditingContactId(null); setForm({ name: "", position: "", phone: "", cellphone: "", whatsapp: "", email: "", notes: "", isDefault: false }); }}>Cancelar</Button>
              <Button onClick={() => saveMut.mutate()} disabled={!form.name || saveMut.isPending}>{saveMut.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhum contato cadastrado</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Nome</th>
                  <th className="p-3 font-medium">Cargo</th>
                  <th className="p-3 font-medium">Telefone</th>
                  <th className="p-3 font-medium">Celular</th>
                  <th className="p-3 font-medium">WhatsApp</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Principal</th>
                  <th className="p-3 font-medium w-20">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((ct) => (
                  <tr key={ct.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">{ct.name}</td>
                    <td className="p-3 text-muted-foreground">{ct.position ?? "-"}</td>
                    <td className="p-3">{ct.phone ?? "-"}</td>
                    <td className="p-3">{ct.cellphone ?? "-"}</td>
                    <td className="p-3">{ct.whatsapp ?? "-"}</td>
                    <td className="p-3">{ct.email ?? "-"}</td>
                    <td className="p-3">{ct.isDefault ? <Badge variant="secondary" className="text-xs">Sim</Badge> : "-"}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(ct)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteId(ct.id)}><Trash2 className="h-3 w-3" /></Button>
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
          <DialogHeader><DialogTitle>Remover Contato</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja remover este contato?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMut.mutate()}>Remover</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
