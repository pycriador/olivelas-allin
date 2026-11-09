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
import { technicianService } from "@/modules/technicians/service";
import type { Technician } from "@/modules/technicians/types";

export const Route = createFileRoute("/_app/records/technicians")({
  head: () => ({ meta: [{ title: "Técnicos — ServiceForge" }] }),
  component: TechniciansPage,
});

function TechniciansPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", cpf: "", phone: "", whatsapp: "", email: "",
    position: "", specialties: "", certifications: "",
    workHours: "", status: "active" as "active" | "inactive", notes: "",
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => technicianService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => technicianService.create({
      ...form,
      specialties: form.specialties ? form.specialties.split(",").map((s) => s.trim()) : [],
      certifications: form.certifications ? form.certifications.split(",").map((s) => s.trim()) : [],
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["technicians"] }); setOpen(false); resetForm(); toast("Técnico criado"); },
  });

  const updateMut = useMutation({
    mutationFn: () => technicianService.update(editing!.id, {
      ...form,
      specialties: form.specialties ? form.specialties.split(",").map((s) => s.trim()) : [],
      certifications: form.certifications ? form.certifications.split(",").map((s) => s.trim()) : [],
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["technicians"] }); setOpen(false); setEditing(null); resetForm(); toast("Técnico atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => technicianService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["technicians"] }); setDeleteId(null); toast("Técnico excluído"); },
  });

  const resetForm = () => setForm({ name: "", cpf: "", phone: "", whatsapp: "", email: "", position: "", specialties: "", certifications: "", workHours: "", status: "active", notes: "" });
  const openEdit = (item: Technician) => {
    setEditing(item);
    setForm({
      name: item.name, cpf: item.cpf ?? "", phone: item.phone ?? "", whatsapp: item.whatsapp ?? "",
      email: item.email ?? "", position: item.position ?? "",
      specialties: (item.specialties ?? []).join(", "), certifications: (item.certifications ?? []).join(", "),
      workHours: item.workHours ?? "", status: item.status, notes: item.notes ?? "",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Técnicos</h1>
          <p className="text-sm text-muted-foreground">Cadastro de técnicos da plataforma</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Técnico</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Editar Técnico" : "Novo Técnico"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
              <div><Label>Cargo</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
              <div className="col-span-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Especialidades (vírgulas)</Label><Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} /></div>
              <div><Label>Certificações (vírgulas)</Label><Input value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} /></div>
              <div><Label>Carga Horária</Label><Input value={form.workHours} onChange={(e) => setForm({ ...form, workHours: e.target.value })} /></div>
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

      <Card>
        <CardHeader><CardTitle className="text-base">Técnicos</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum técnico cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">CPF</th>
                  <th className="pb-2 font-medium">Cargo</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.cpf ?? "-"}</td>
                    <td className="py-2">{item.position ?? "-"}</td>
                    <td className="py-2">{item.email ?? "-"}</td>
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
