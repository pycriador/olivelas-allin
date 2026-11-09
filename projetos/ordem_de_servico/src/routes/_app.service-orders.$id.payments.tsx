import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Banknote, Plus, CheckCircle, CreditCard, Receipt, Calendar, User } from "lucide-react";
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
import type { SOPayment } from "@/modules/service-orders/types";

export const Route = createFileRoute("/_app/service-orders/$id/payments")({
  head: () => ({ meta: [{ title: "Pagamentos — ServiceForge" }] }),
  component: PaymentsTab,
});

const methodLabels: Record<string, string> = {
  pix: "PIX", cash: "Dinheiro", credit: "Cartão de Crédito", debit: "Cartão de Débito",
  transfer: "Transferência", boleto: "Boleto", check: "Cheque", voucher: "Voucher", other: "Outro",
};

const methodIcons: Record<string, typeof CreditCard> = {
  pix: Banknote, cash: Banknote, credit: CreditCard, debit: CreditCard,
  transfer: Receipt, boleto: Receipt, check: Receipt, voucher: CreditCard, other: Banknote,
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function PaymentsTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ method: "pix" as SOPayment["method"], methodLabel: "PIX", value: 0, installments: 1, date: new Date().toISOString().split("T")[0], notes: "", responsible: "" });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["so-payments", id],
    queryFn: () => serviceOrderService.getPayments(id),
  });

  const createPayment = useMutation({
    mutationFn: () => serviceOrderService.createPayment(id, form, form.responsible || "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-payments", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      setOpen(false);
      setForm({ method: "pix", methodLabel: "PIX", value: 0, installments: 1, date: new Date().toISOString().split("T")[0], notes: "", responsible: "" });
      toast("Pagamento criado");
    },
    onError: () => toast("Erro ao criar pagamento"),
  });

  const confirmPayment = useMutation({
    mutationFn: (paymentId: string) => serviceOrderService.confirmPayment(id, paymentId, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-payments", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      toast("Pagamento confirmado");
    },
    onError: () => toast("Erro ao confirmar pagamento"),
  });

  const handleMethodChange = (method: SOPayment["method"]) => {
    setForm({ ...form, method, methodLabel: methodLabels[method] ?? method });
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Pagamentos</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />Novo Pagamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Pagamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Método</Label>
                <Select value={form.method} onValueChange={(v: SOPayment["method"]) => handleMethodChange(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(methodLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valor</Label><Input type="number" min={0} step={0.01} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></div>
              <div><Label>Parcelas</Label><Input type="number" min={1} max={48} value={form.installments} onChange={(e) => setForm({ ...form, installments: Number(e.target.value) })} /></div>
              <div><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Responsável</Label><Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} /></div>
              <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                <Button onClick={() => createPayment.mutate()} disabled={form.value <= 0}>{t("common.save")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {payments.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhum pagamento registrado.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const Icon = methodIcons[payment.method] ?? Banknote;
            return (
              <Card key={payment.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{payment.methodLabel}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[payment.status] ?? ""} variant="outline">
                        {payment.status === "pending" ? "Pendente" : payment.status === "confirmed" ? "Confirmado" : "Cancelado"}
                      </Badge>
                      {payment.status === "pending" && (
                        <Button size="sm" variant="outline" className="text-green-600" onClick={() => confirmPayment.mutate(payment.id)}>
                          <CheckCircle className="mr-1 h-3 w-3" />Confirmar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="text-base font-bold text-foreground">R$ {payment.value.toFixed(2)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{payment.date}</span>
                    {payment.installments > 1 && <span>{payment.installments}x de R$ {(payment.value / payment.installments).toFixed(2)}</span>}
                    {payment.responsible && <span className="flex items-center gap-1"><User className="h-3 w-3" />{payment.responsible}</span>}
                  </div>
                  {payment.installmentDetail && payment.installmentDetail.length > 1 && (
                    <div className="border-t pt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Detalhes das Parcelas</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {payment.installmentDetail.map((inst) => (
                          <div key={inst.id} className="border rounded p-2 text-xs">
                            <span className="font-medium">Parcela {inst.number}</span>
                            <div className="text-muted-foreground">R$ {inst.value.toFixed(2)}</div>
                            <div className="text-muted-foreground">Venc: {inst.dueDate}</div>
                            <Badge variant="outline" className={`text-xs ${inst.status === "paid" ? "bg-green-100" : "bg-yellow-100"}`}>
                              {inst.status === "paid" ? "Pago" : "Pendente"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {payment.notes && <div className="border-t pt-2 text-xs text-muted-foreground">Obs: {payment.notes}</div>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
