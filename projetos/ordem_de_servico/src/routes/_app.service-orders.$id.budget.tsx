import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DollarSign, Plus, ThumbsUp, ThumbsDown, Calculator, Truck, Percent, Tag, FileText, Calendar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import type { SOBudget, SOBudgetItem } from "@/modules/service-orders/types";

export const Route = createFileRoute("/_app/service-orders/$id/budget")({
  head: () => ({ meta: [{ title: "Orçamento — ServiceForge" }] }),
  component: BudgetTab,
});

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-indigo-100 text-indigo-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-700",
  cancelled: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente", sent: "Enviado", viewed: "Visualizado",
  approved: "Aprovado", rejected: "Rejeitado", expired: "Expirado", cancelled: "Cancelado",
};

function BudgetTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newItem, setNewItem] = useState({ type: "service" as "service" | "part", description: "", quantity: 1, unitValue: 0, discount: 0, discountType: "fixed" as "percent" | "fixed", markup: 0, markupType: "fixed" as "percent" | "fixed" });
  const [items, setItems] = useState<Omit<SOBudgetItem, "id">[]>([]);
  const [form, setForm] = useState({ discountTotal: 0, discountType: "fixed" as "percent" | "fixed", discountReason: "", markupTotal: 0, taxes: 0, shipping: 0, validityDays: 7, deadline: "", warrantyDescription: "", notes: "" });

  const { data: budget, isLoading } = useQuery({
    queryKey: ["so-budget", id],
    queryFn: () => serviceOrderService.getBudget(id),
  });

  const { data: versions = [] } = useQuery({
    queryKey: ["so-budget-versions", id],
    queryFn: () => serviceOrderService.getBudgetVersions(id),
  });

  const createBudget = useMutation({
    mutationFn: () => serviceOrderService.createBudget(id, { items, ...form }, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-budget", id] });
      qc.invalidateQueries({ queryKey: ["so-budget-versions", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      setOpen(false);
      setItems([]);
      setForm({ discountTotal: 0, discountType: "fixed", discountReason: "", markupTotal: 0, taxes: 0, shipping: 0, validityDays: 7, deadline: "", warrantyDescription: "", notes: "" });
      toast("Orçamento criado");
    },
    onError: () => toast("Erro ao criar orçamento"),
  });

  const updateBudget = useMutation({
    mutationFn: ({ budgetId, patch }: { budgetId: string; patch: Partial<SOBudget> }) =>
      serviceOrderService.updateBudget(id, budgetId, patch, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-budget", id] });
      qc.invalidateQueries({ queryKey: ["so-budget-versions", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      toast("Orçamento atualizado");
    },
    onError: () => toast("Erro ao atualizar orçamento"),
  });

  const addItem = () => {
    if (!newItem.description || newItem.unitValue <= 0) return;
    const discountVal = newItem.discountType === "percent" ? newItem.quantity * newItem.unitValue * (newItem.discount / 100) : newItem.discount;
    const markupVal = newItem.markupType === "percent" ? newItem.quantity * newItem.unitValue * (newItem.markup / 100) : newItem.markup;
    const total = newItem.quantity * newItem.unitValue - discountVal + markupVal;
    setItems([...items, { ...newItem, discountType: newItem.discountType, markupType: newItem.markupType, totalValue: total, itemId: undefined, warrantyDays: undefined, responsible: undefined, notes: undefined }]);
    setNewItem({ type: "service", description: "", quantity: 1, unitValue: 0, discount: 0, discountType: "fixed", markup: 0, markupType: "fixed" });
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const calcSubtotal = () => items.reduce((s, i) => s + i.totalValue, 0);
  const calcDiscVal = () => {
    const sub = calcSubtotal();
    return form.discountType === "percent" ? sub * (form.discountTotal / 100) : form.discountTotal;
  };
  const calcFinal = () => calcSubtotal() - calcDiscVal() + form.markupTotal + form.taxes + form.shipping;

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Orçamento</h2>
        </div>
        {(!budget || budget.status === "rejected" || budget.status === "expired" || budget.status === "cancelled") && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" />Novo Orçamento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle>Novo Orçamento</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-medium">Itens do Orçamento</h3>
                  <div className="grid grid-cols-7 gap-2 text-xs">
                    <Label className="col-span-1">Tipo</Label>
                    <Label className="col-span-1">Descrição</Label>
                    <Label className="col-span-1">Qtd</Label>
                    <Label className="col-span-1">V. Unit</Label>
                    <Label className="col-span-1">Desc.</Label>
                    <Label className="col-span-1">Acrésc.</Label>
                    <Label className="col-span-1" />
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-7 gap-2 text-sm items-center">
                      <Badge variant="outline" className="text-xs">{item.type === "service" ? "Serviço" : "Peça"}</Badge>
                      <span className="truncate">{item.description}</span>
                      <span>{item.quantity}x</span>
                      <span>R$ {item.unitValue.toFixed(2)}</span>
                      <span className="text-red-500">{item.discount > 0 ? `-R$ ${item.discount.toFixed(2)}` : "-"}</span>
                      <span className="text-green-500">{item.markup > 0 ? `+R$ ${item.markup.toFixed(2)}` : "-"}</span>
                      <Button variant="ghost" size="sm" className="h-6 text-red-500" onClick={() => removeItem(idx)}>X</Button>
                    </div>
                  ))}
                  <div className="grid grid-cols-7 gap-2 items-end">
                    <Select value={newItem.type} onValueChange={(v: "service" | "part") => setNewItem({ ...newItem, type: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service">Serviço</SelectItem>
                        <SelectItem value="part">Peça</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input className="h-8 text-xs" placeholder="Descrição" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
                    <Input className="h-8 text-xs" type="number" min={1} value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })} />
                    <Input className="h-8 text-xs" type="number" min={0} step={0.01} value={newItem.unitValue} onChange={(e) => setNewItem({ ...newItem, unitValue: Number(e.target.value) })} />
                    <Input className="h-8 text-xs" type="number" min={0} step={0.01} value={newItem.discount} onChange={(e) => setNewItem({ ...newItem, discount: Number(e.target.value) })} />
                    <Input className="h-8 text-xs" type="number" min={0} step={0.01} value={newItem.markup} onChange={(e) => setNewItem({ ...newItem, markup: Number(e.target.value) })} />
                    <Button size="sm" className="h-8" onClick={addItem} disabled={!newItem.description || newItem.unitValue <= 0}>+</Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Desconto Total</Label><Input type="number" min={0} step={0.01} value={form.discountTotal} onChange={(e) => setForm({ ...form, discountTotal: Number(e.target.value) })} /></div>
                  <div><Label>Tipo Desconto</Label>
                    <Select value={form.discountType} onValueChange={(v: "percent" | "fixed") => setForm({ ...form, discountType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentual</SelectItem>
                        <SelectItem value="fixed">Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Motivo Desconto</Label><Input value={form.discountReason} onChange={(e) => setForm({ ...form, discountReason: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Acréscimo Total</Label><Input type="number" min={0} step={0.01} value={form.markupTotal} onChange={(e) => setForm({ ...form, markupTotal: Number(e.target.value) })} /></div>
                  <div><Label>Impostos</Label><Input type="number" min={0} step={0.01} value={form.taxes} onChange={(e) => setForm({ ...form, taxes: Number(e.target.value) })} /></div>
                  <div><Label>Frete</Label><Input type="number" min={0} step={0.01} value={form.shipping} onChange={(e) => setForm({ ...form, shipping: Number(e.target.value) })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Validade (dias)</Label><Input type="number" min={1} value={form.validityDays} onChange={(e) => setForm({ ...form, validityDays: Number(e.target.value) })} /></div>
                  <div><Label>Data Limite</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
                </div>
                <div><Label>Descrição Garantia</Label><Textarea value={form.warrantyDescription} onChange={(e) => setForm({ ...form, warrantyDescription: e.target.value })} /></div>
                <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <div className="border-t pt-4">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span>Subtotal:</span><span>R$ {calcSubtotal().toFixed(2)}</span></div>
                    <div className="flex justify-between text-red-500"><span>Desconto:</span><span>-R$ {calcDiscVal().toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Acréscimo:</span><span>+R$ {form.markupTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Impostos:</span><span>+R$ {form.taxes.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Frete:</span><span>+R$ {form.shipping.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-lg"><span>Valor Final:</span><span>R$ {calcFinal().toFixed(2)}</span></div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                  <Button onClick={() => createBudget.mutate()} disabled={items.length === 0}>Criar Orçamento</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!budget ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhum orçamento criado.</p></CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4" />Orçamento v{budget.version}
                </CardTitle>
                <Badge className={statusColors[budget.status] ?? ""} variant="outline">
                  {statusLabels[budget.status] ?? budget.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Tipo</th><th className="pb-2">Descrição</th><th className="pb-2">Qtd</th>
                    <th className="pb-2">V. Unit</th><th className="pb-2">Desc.</th><th className="pb-2">Acrésc.</th><th className="pb-2 text-right">Total</th>
                  </tr></thead>
                  <tbody>
                    {budget.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2"><Badge variant="outline" className="text-xs">{item.type === "service" ? "Serviço" : "Peça"}</Badge></td>
                        <td className="py-2">{item.description}</td>
                        <td className="py-2">{item.quantity}x</td>
                        <td className="py-2">R$ {item.unitValue.toFixed(2)}</td>
                        <td className="py-2 text-red-500">{item.discount > 0 ? `-R$ ${item.discount.toFixed(2)}` : "-"}</td>
                        <td className="py-2 text-green-500">{item.markup > 0 ? `+R$ ${item.markup.toFixed(2)}` : "-"}</td>
                        <td className="py-2 text-right font-medium">R$ {item.totalValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>R$ {budget.subtotal.toFixed(2)}</span></div>
                {budget.discountTotal > 0 && <div className="flex justify-between text-red-500"><span>Desconto {budget.discountType === "percent" ? `(${budget.discountTotal}%)` : ""}</span><span>-R$ {budget.discountTotal.toFixed(2)}</span></div>}
                {budget.discountReason && <div className="text-xs text-muted-foreground">Motivo: {budget.discountReason}</div>}
                {budget.markupTotal > 0 && <div className="flex justify-between"><span>Acréscimo</span><span>+R$ {budget.markupTotal.toFixed(2)}</span></div>}
                {budget.taxes > 0 && <div className="flex justify-between"><span>Impostos</span><span>+R$ {budget.taxes.toFixed(2)}</span></div>}
                {budget.shipping > 0 && <div className="flex justify-between"><span>Frete</span><span>+R$ {budget.shipping.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Valor Final</span><span>R$ {budget.finalValue.toFixed(2)}</span>
                </div>
              </div>
              {budget.warrantyDescription && (
                <div className="mt-3 flex items-start gap-2 text-sm border-t pt-3">
                  <ShieldCheck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div><span className="font-medium">Garantia:</span><p className="text-muted-foreground">{budget.warrantyDescription}</p></div>
                </div>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Validade: {budget.validityDays} dias</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Data Limite: {budget.deadline}</span>
              </div>
              {budget.notes && (
                <div className="mt-3 text-sm border-t pt-3">
                  <span className="font-medium">Observações:</span><p className="text-muted-foreground mt-1">{budget.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {budget.status === "pending" && (
            <div className="flex gap-2">
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => updateBudget.mutate({ budgetId: budget.id, patch: { status: "approved" } })}>
                <ThumbsUp className="mr-1 h-4 w-4" />Aprovar
              </Button>
              <Button variant="destructive" onClick={() => updateBudget.mutate({ budgetId: budget.id, patch: { status: "rejected", rejectionReason: "Rejeitado pelo cliente" } })}>
                <ThumbsDown className="mr-1 h-4 w-4" />Rejeitar
              </Button>
            </div>
          )}

          {versions.length > 1 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Versões Anteriores</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {versions.filter((v) => v.version !== budget.version).map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <span>Versão {v.version}</span>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[v.status] ?? ""} variant="outline">{statusLabels[v.status]}</Badge>
                        <span className="text-muted-foreground">R$ {v.finalValue.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
