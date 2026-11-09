import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";
import type { Customer, CustomerRelationship } from "@/modules/customers/types";

export const Route = createFileRoute("/_app/service-orders/customers/$id/relationships")({
  head: () => ({ meta: [{ title: "Relacionamentos — ServiceForge" }] }),
  component: CustomerRelationshipsPage,
});

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const typeLabels: Record<string, string> = {
  family: "Familiar", business: "Comercial", reference: "Referência", other: "Outro",
};

function CustomerRelationshipsPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ relatedCustomerId: "", relatedCustomerName: "", type: "business" as CustomerRelationship["type"], description: "" });

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const relationships = customer?.relationships ?? [];

  const addMut = useMutation({
    mutationFn: () => {
      const newRel: CustomerRelationship = { id: uid(), ...form };
      return customerService.update(id, { relationships: [...relationships, newRel] });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer", id] }); setOpen(false); setForm({ relatedCustomerId: "", relatedCustomerName: "", type: "business", description: "" }); toast.success("Relacionamento adicionado"); },
    onError: () => toast.error("Erro ao adicionar relacionamento"),
  });

  const removeMut = useMutation({
    mutationFn: (relId: string) => {
      const updated = relationships.filter((r) => r.id !== relId);
      return customerService.update(id, { relationships: updated });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer", id] }); toast.success("Relacionamento removido"); },
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relacionamentos</h1>
          <p className="text-sm text-muted-foreground">Clientes relacionados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Adicionar Relacionamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Relacionamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1"><Label>ID do Cliente</Label><Input value={form.relatedCustomerId} onChange={(e) => setForm({ ...form, relatedCustomerId: e.target.value })} placeholder="ID do cliente relacionado" /></div>
              <div className="space-y-1"><Label>Nome do Cliente</Label><Input value={form.relatedCustomerName} onChange={(e) => setForm({ ...form, relatedCustomerName: e.target.value })} /></div>
              <div className="space-y-1"><Label>Tipo</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                  <option value="family">Familiar</option>
                  <option value="business">Comercial</option>
                  <option value="reference">Referência</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div className="space-y-1"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setOpen(false); setForm({ relatedCustomerId: "", relatedCustomerName: "", type: "business", description: "" }); }}>Cancelar</Button>
                <Button onClick={() => addMut.mutate()} disabled={!form.relatedCustomerName || addMut.isPending}>{addMut.isPending ? "Adicionando..." : "Adicionar"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {relationships.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhum relacionamento cadastrado</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Cliente</th>
                  <th className="p-3 font-medium">Tipo</th>
                  <th className="p-3 font-medium">Descrição</th>
                  <th className="p-3 font-medium w-20">Ações</th>
                </tr>
              </thead>
              <tbody>
                {relationships.map((rel) => (
                  <tr key={rel.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">{rel.relatedCustomerName}</td>
                    <td className="p-3"><Badge variant="outline">{typeLabels[rel.type] || rel.type}</Badge></td>
                    <td className="p-3 text-muted-foreground">{rel.description ?? "-"}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMut.mutate(rel.id)}><Trash2 className="h-3 w-3" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
