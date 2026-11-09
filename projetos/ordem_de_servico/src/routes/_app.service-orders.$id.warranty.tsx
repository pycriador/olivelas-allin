import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, Plus, Calendar, FileText } from "lucide-react";
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
import type { SOWarranty } from "@/modules/service-orders/types";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";

export const Route = createFileRoute("/_app/service-orders/$id/warranty")({
  head: () => ({ meta: [{ title: "Garantias — ServiceForge" }] }),
  component: WarrantyTab,
});

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  expired: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

const typeLabels: Record<string, string> = {
  service: "Serviço", part: "Peça", labor: "Mão de Obra", full: "Completa",
};

function WarrantyTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "service" as "service" | "part" | "labor" | "full",
    days: 90, startDate: new Date().toISOString().split("T")[0],
    coverage: "", notes: "", responsibleName: "",
  });

  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ["so-warranties", id],
    queryFn: () => serviceOrderService.getWarranties(id),
  });

  const createWarranty = useMutation({
    mutationFn: () => serviceOrderService.createWarranty(id, { ...form, endDate: new Date(Date.now() + form.days * 86400000).toISOString().split("T")[0] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-warranties", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      setOpen(false);
      setForm({ type: "service", days: 90, startDate: new Date().toISOString().split("T")[0], coverage: "", notes: "", responsibleName: "" });
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_WARRANTY_CREATED, "service-order", "service-orders", { id, days: form.days }).catch(() => {});
      toast("Garantia criada");
    },
    onError: () => toast("Erro ao criar garantia"),
  });

  const updateWarranty = useMutation({
    mutationFn: ({ warrantyId, patch }: { warrantyId: string; patch: Partial<SOWarranty> }) =>
      serviceOrderService.updateWarranty(id, warrantyId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-warranties", id] });
      toast("Garantia atualizada");
    },
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Garantias</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />Nova Garantia</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Garantia</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Tipo</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                  <option value="service">Serviço</option>
                  <option value="part">Peça</option>
                  <option value="labor">Mão de Obra</option>
                  <option value="full">Completa</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Dias</Label><Input type="number" min={1} value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} /></div>
                <div><Label>Data Início</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              </div>
              <div><Label>Cobertura</Label><Textarea value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })} /></div>
              <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                <Button onClick={() => createWarranty.mutate()} disabled={!form.coverage}>{t("common.save")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {warranties.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhuma garantia registrada.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {warranties.map((w) => (
            <Card key={w.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{typeLabels[w.type] ?? w.type}</Badge>
                    <span className="text-sm text-muted-foreground">{w.days} dias</span>
                  </div>
                  <Badge className={statusColors[w.status] ?? ""} variant="outline">
                    {w.status === "active" ? "Ativa" : w.status === "expired" ? "Expirada" : "Cancelada"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Início: {w.startDate}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Fim: {w.endDate}</span>
                </div>
                <div>
                  <span className="font-medium">Cobertura:</span>
                  <p className="text-muted-foreground mt-1">{w.coverage}</p>
                </div>
                {w.notes && (
                  <div className="border-t pt-2">
                    <span className="font-medium">Observações:</span>
                    <p className="text-muted-foreground mt-1">{w.notes}</p>
                  </div>
                )}
                {w.status === "active" && (
                  <div className="flex gap-2 border-t pt-2">
                    <Button size="sm" variant="outline" className="text-red-500" onClick={() => updateWarranty.mutate({ warrantyId: w.id, patch: { status: "cancelled" } })}>
                      Cancelar Garantia
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
