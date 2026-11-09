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
import { paymentTermService } from "@/modules/payment-terms/service";
import type { PaymentTerm } from "@/modules/payment-terms/types";

export const Route = createFileRoute("/_app/records/payment-terms")({
  head: () => ({ meta: [{ title: "Condições de Pagamento — ServiceForge" }] }),
  component: PaymentTermsPage,
});

function PaymentTermsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentTerm | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", installments: "1", interest: "", active: true });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["paymentTerms"],
    queryFn: () => paymentTermService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => paymentTermService.create({ name: form.name, installments: Number(form.installments), interest: form.interest ? Number(form.interest) : undefined, active: form.active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["paymentTerms"] }); setOpen(false); resetForm(); toast("Condição de pagamento criada"); },
  });

  const updateMut = useMutation({
    mutationFn: () => paymentTermService.update(editing!.id, { name: form.name, installments: Number(form.installments), interest: form.interest ? Number(form.interest) : undefined, active: form.active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["paymentTerms"] }); setOpen(false); setEditing(null); resetForm(); toast("Condição de pagamento atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => paymentTermService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["paymentTerms"] }); setDeleteId(null); toast("Condição de pagamento excluída"); },
  });

  const resetForm = () => setForm({ name: "", installments: "1", interest: "", active: true });
  const openEdit = (item: PaymentTerm) => { setEditing(item); setForm({ name: item.name, installments: item.installments.toString(), interest: item.interest?.toString() ?? "", active: item.active }); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Condições de Pagamento</h1>
          <p className="text-sm text-muted-foreground">Cadastro de condições de pagamento</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Condição</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar Condição de Pagamento" : "Nova Condição de Pagamento"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Parcelas</Label><Input type="number" min="1" value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })} /></div>
              <div><Label>Juros (%)</Label><Input type="number" step="0.01" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} /></div>
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
        <CardHeader><CardTitle className="text-base">Condições de Pagamento</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma condição de pagamento cadastrada.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Parcelas</th>
                  <th className="pb-2 font-medium">Juros</th>
                  <th className="pb-2 font-medium">Ativo</th>
                  <th className="pb-2 font-medium w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.installments}x</td>
                    <td className="py-2">{item.interest != null ? `${item.interest}%` : "-"}</td>
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
