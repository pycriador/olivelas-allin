import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Package, Plus, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import type { SOServiceItem } from "@/modules/service-orders/types";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";

export const Route = createFileRoute("/_app/service-orders/$id/services")({
  head: () => ({ meta: [{ title: "Serviços — ServiceForge" }] }),
  component: ServicesTab,
});

function ServicesTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ serviceName: "", quantity: 1, unitValue: 0 });

  const { data: so, isLoading } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  const totalValue = form.quantity * form.unitValue;

  const addService = useMutation({
    mutationFn: () => serviceOrderService.addService(id, {
      serviceId: `srv-${Date.now()}`, serviceName: form.serviceName,
      quantity: form.quantity, unitValue: form.unitValue, totalValue,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      setShowForm(false);
      setForm({ serviceName: "", quantity: 1, unitValue: 0 });
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_SERVICE_ADDED, "service-order", "service-orders", { id, serviceName: form.serviceName }).catch(() => {});
      toast("Serviço adicionado");
    },
    onError: () => toast("Erro ao adicionar serviço"),
  });

  const removeService = useMutation({
    mutationFn: (serviceItem: SOServiceItem) => {
      const services = (so?.services ?? []).filter((s) => s.id !== serviceItem.id);
      const finalValue = (so?.finalValue ?? 0) - serviceItem.totalValue;
      return serviceOrderService.update(id, { services, finalValue: Math.max(0, finalValue) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      toast("Serviço removido");
    },
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  const services = so?.services ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("so.services")}</h2>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="mr-1 h-4 w-4" />Adicionar Serviço
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Novo Serviço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nome do Serviço</Label>
                <Input value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Valor Unitário</Label>
                <Input type="number" min={0} step={0.01} value={form.unitValue} onChange={(e) => setForm({ ...form, unitValue: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total: R$ {totalValue.toFixed(2)}</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
                <Button onClick={() => addService.mutate()} disabled={!form.serviceName || form.quantity < 1}>{t("common.save")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium">Serviço</th>
                <th className="p-3 font-medium">{t("so.quantity")}</th>
                <th className="p-3 font-medium">{t("so.unitValue")}</th>
                <th className="p-3 font-medium">{t("so.totalValue")}</th>
                <th className="p-3 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">Nenhum serviço adicionado.</td></tr>
              ) : services.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3">{s.serviceName}</td>
                  <td className="p-3">{s.quantity}</td>
                  <td className="p-3">R$ {s.unitValue.toFixed(2)}</td>
                  <td className="p-3">R$ {s.totalValue.toFixed(2)}</td>
                  <td className="p-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeService.mutate(s)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
