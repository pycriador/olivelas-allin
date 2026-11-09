import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Truck, ClipboardCheck, ShieldCheck, CheckCircle, Pen, FileText, User, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";

export const Route = createFileRoute("/_app/service-orders/$id/delivery")({
  head: () => ({ meta: [{ title: "Entrega — ServiceForge" }] }),
  component: DeliveryTab,
});

const defaultChecklist = [
  "Equipamento ligado",
  "Cliente conferiu funcionamento",
  "Acessórios entregues",
  "Garantia entregue",
  "Recibo entregue",
  "Pagamento confirmado",
  "Assinatura coletada",
];

function DeliveryTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    responsable: "", date: new Date().toISOString().split("T")[0], time: "",
    warrantyDelivered: false, paymentConfirmed: false, notes: "", signatureData: "",
  });
  const [checklist, setChecklist] = useState(defaultChecklist.map((l) => ({ label: l, checked: false })));

  const { data: delivery, isLoading } = useQuery({
    queryKey: ["so-delivery", id],
    queryFn: () => serviceOrderService.getDelivery(id),
  });

  const completeDelivery = useMutation({
    mutationFn: () => serviceOrderService.completeDelivery(id, {
      responsable: form.responsable, date: form.date, time: form.time,
      warrantyDelivered: form.warrantyDelivered, paymentConfirmed: form.paymentConfirmed,
      checklist: checklist.filter((c) => c.checked), notes: form.notes,
    }, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-delivery", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      setOpen(false);
      const now = new Date().toISOString().split("T")[0];
      setForm({ responsable: "", date: now, time: "", warrantyDelivered: false, paymentConfirmed: false, notes: "", signatureData: "" });
      setChecklist(defaultChecklist.map((l) => ({ label: l, checked: false })));
      toast("Entrega concluída");
    },
    onError: () => toast("Erro ao concluir entrega"),
  });

  const toggleChecklist = (idx: number) => {
    setChecklist(checklist.map((c, i) => i === idx ? { ...c, checked: !c.checked } : c));
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Entrega</h2>
        </div>
        {!delivery && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><ClipboardCheck className="mr-1 h-4 w-4" />Registrar Entrega</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Registrar Entrega</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Responsável</Label><Input value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} /></div>
                  <div><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                  <div><Label>Hora</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
                </div>
                <div>
                  <Label className="mb-2 block">Checklist de Entrega</Label>
                  <div className="space-y-2">
                    {checklist.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="checkbox" checked={item.checked} onChange={() => toggleChecklist(idx)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.warrantyDelivered} onChange={(e) => setForm({ ...form, warrantyDelivered: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <Label className="text-sm">Garantia Entregue</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.paymentConfirmed} onChange={(e) => setForm({ ...form, paymentConfirmed: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <Label className="text-sm">Pagamento Confirmado</Label>
                  </div>
                </div>
                <div>
                  <Label>Assinatura (placeholder)</Label>
                  <Input value={form.signatureData} onChange={(e) => setForm({ ...form, signatureData: e.target.value })} placeholder="Digite o nome do cliente como assinatura..." />
                </div>
                <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                  <Button onClick={() => completeDelivery.mutate()} disabled={!form.responsable}>{t("common.save")}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!delivery ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhuma entrega registrada.</p></CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />Entrega Realizada
              </CardTitle>
              <Badge variant="outline" className="bg-green-100 text-green-700">Concluída</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Responsável:</span> {delivery.responsable}</div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Data:</span> {delivery.date}</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Hora:</span> {delivery.time}</div>
            </div>

            {delivery.checklist.length > 0 && (
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1"><ClipboardCheck className="h-4 w-4" />Checklist</h4>
                <div className="space-y-1">
                  {delivery.checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`h-3 w-3 ${item.checked ? "text-green-500" : "text-gray-300"}`} />
                      <span className={item.checked ? "" : "text-muted-foreground line-through"}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm border-t pt-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`h-4 w-4 ${delivery.warrantyDelivered ? "text-green-500" : "text-gray-300"}`} />
                <span className={delivery.warrantyDelivered ? "" : "text-muted-foreground"}>Garantia Entregue</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${delivery.paymentConfirmed ? "text-green-500" : "text-gray-300"}`} />
                <span className={delivery.paymentConfirmed ? "" : "text-muted-foreground"}>Pagamento Confirmado</span>
              </div>
            </div>

            {delivery.notes && (
              <div className="border-t pt-3">
                <span className="text-sm font-medium">Observações:</span>
                <p className="text-sm text-muted-foreground mt-1">{delivery.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
