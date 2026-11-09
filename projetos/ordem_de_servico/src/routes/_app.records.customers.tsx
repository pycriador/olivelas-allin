import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Copy, Merge, Link } from "lucide-react";
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
import { customerService } from "@/modules/customers/service";
import type { Customer } from "@/modules/customers/types";

export const Route = createFileRoute("/_app/records/customers")({
  head: () => ({ meta: [{ title: "Clientes — ServiceForge" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", type: "individual" as "individual" | "legal",
    cpf: "", cnpj: "", rg: "", stateRegistration: "",
    birthDate: "", phone: "", cellphone: "", whatsapp: "",
    email: "", website: "", notes: "", status: "active" as "active" | "inactive" | "blocked",
    tags: "", classification: "", photo: "",
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => customerService.create({
      ...form,
      tags: form.tags ? form.tags.split(",").map((s) => s.trim()) : [],
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); setOpen(false); resetForm(); toast("Cliente criado"); },
  });

  const updateMut = useMutation({
    mutationFn: () => customerService.update(editing!.id, {
      ...form,
      tags: form.tags ? form.tags.split(",").map((s) => s.trim()) : [],
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); setOpen(false); setEditing(null); resetForm(); toast("Cliente atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => customerService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); setDeleteId(null); toast("Cliente excluído"); },
  });

  const resetForm = () => setForm({
    name: "", type: "individual", cpf: "", cnpj: "", rg: "", stateRegistration: "",
    birthDate: "", phone: "", cellphone: "", whatsapp: "", email: "",
    website: "", notes: "", status: "active", tags: "", classification: "", photo: "",
  });

  const openEdit = (item: Customer) => {
    setEditing(item);
    setForm({
      name: item.name, type: item.type, cpf: item.cpf ?? "", cnpj: item.cnpj ?? "",
      rg: item.rg ?? "", stateRegistration: item.stateRegistration ?? "",
      birthDate: item.birthDate ?? "", phone: item.phone ?? "",
      cellphone: item.cellphone ?? "", whatsapp: item.whatsapp ?? "",
      email: item.email ?? "", website: item.website ?? "",
      notes: item.notes ?? "", status: item.status,
      tags: (item.tags ?? []).join(", "), classification: item.classification ?? "",
      photo: item.photo ?? "",
    });
    setOpen(true);
  };

  const copyMut = useMutation({
    mutationFn: (id: string) => customerService.copyCustomer(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast("Cliente copiado"); },
  });

  const filtered = items.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.cpf?.includes(search) || c.cnpj?.includes(search),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Cadastro completo de clientes</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label>Tipo</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "individual" | "legal" })}>
                  <option value="individual">Pessoa Física</option>
                  <option value="legal">Pessoa Jurídica</option>
                </select>
              </div>
              <div><Label>Classificação</Label><Input value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })} /></div>
              {form.type === "individual" && (
                <>
                  <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
                  <div><Label>RG</Label><Input value={form.rg} onChange={(e) => setForm({ ...form, rg: e.target.value })} /></div>
                </>
              )}
              {form.type === "legal" && (
                <>
                  <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
                  <div><Label>Inscrição Estadual</Label><Input value={form.stateRegistration} onChange={(e) => setForm({ ...form, stateRegistration: e.target.value })} /></div>
                </>
              )}
              <div><Label>Data de Nascimento</Label><Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Celular</Label><Input value={form.cellphone} onChange={(e) => setForm({ ...form, cellphone: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
              <div className="col-span-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="col-span-2"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
              <div className="col-span-2"><Label>Tags (vírgulas)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
              <div className="col-span-2"><Label>Observações</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
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
          <Input className="pl-9" placeholder="Pesquisar clientes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="secondary">{filtered.length} cliente{filtered.length !== 1 ? "s" : ""}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Clientes</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">Documento</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">WhatsApp</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium w-32">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{item.name}</td>
                    <td className="py-2">{item.type === "individual" ? "PF" : "PJ"}</td>
                    <td className="py-2">{item.cpf ?? item.cnpj ?? "-"}</td>
                    <td className="py-2">{item.email ?? "-"}</td>
                    <td className="py-2">{item.whatsapp ?? "-"}</td>
                    <td className="py-2">
                      <Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status}</Badge>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => copyMut.mutate(item.id)}><Copy className="h-4 w-4" /></Button>
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
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este cliente?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMut.mutate()}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
