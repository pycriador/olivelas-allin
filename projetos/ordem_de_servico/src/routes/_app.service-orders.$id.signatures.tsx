import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pen, Plus, User, Building2, Wrench, Users, Filter } from "lucide-react";
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
import type { SOSignature } from "@/modules/service-orders/types";

export const Route = createFileRoute("/_app/service-orders/$id/signatures")({
  head: () => ({ meta: [{ title: "Assinaturas — ServiceForge" }] }),
  component: SignaturesTab,
});

const typeConfig: Record<string, { icon: typeof User; label: string; color: string }> = {
  customer: { icon: User, label: "Cliente", color: "bg-blue-100 text-blue-700" },
  technician: { icon: Wrench, label: "Técnico", color: "bg-green-100 text-green-700" },
  responsible: { icon: Users, label: "Responsável", color: "bg-purple-100 text-purple-700" },
  company: { icon: Building2, label: "Empresa", color: "bg-cyan-100 text-cyan-700" },
};

function SignaturesTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [form, setForm] = useState({ type: "customer" as SOSignature["type"], signatoryName: "", signatureData: "" });

  const { data: signatures = [], isLoading } = useQuery({
    queryKey: ["so-signatures", id],
    queryFn: () => serviceOrderService.getSignatures(id),
  });

  const collectSignature = useMutation({
    mutationFn: () => serviceOrderService.collectSignature(id, form, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-signatures", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      setOpen(false);
      setForm({ type: "customer", signatoryName: "", signatureData: "" });
      toast("Assinatura coletada");
    },
    onError: () => toast("Erro ao coletar assinatura"),
  });

  const filtered = typeFilter === "all" ? signatures : signatures.filter((s) => s.type === typeFilter);

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pen className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Assinaturas</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />Coletar Assinatura</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Coletar Assinatura</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v: SOSignature["type"]) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Nome do Signatário</Label><Input value={form.signatoryName} onChange={(e) => setForm({ ...form, signatoryName: e.target.value })} /></div>
              <div><Label>Dados da Assinatura (placeholder)</Label>
                <Textarea value={form.signatureData} onChange={(e) => setForm({ ...form, signatureData: e.target.value })} placeholder="Área reservada para captura de assinatura digital..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                <Button onClick={() => collectSignature.mutate()} disabled={!form.signatoryName}>{t("common.save")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {signatures.length > 1 && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(typeConfig).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhuma assinatura coletada.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((sig) => {
            const config = typeConfig[sig.type] ?? { icon: User, label: sig.type, color: "bg-gray-100 text-gray-700" };
            const Icon = config.icon;
            return (
              <Card key={sig.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{sig.signatoryName}</p>
                        <Badge className={config.color} variant="outline">{config.label}</Badge>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{new Date(sig.collectedAt).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                  {sig.signatureData && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-1">Dados da Assinatura:</p>
                      <p className="text-sm font-mono bg-muted p-2 rounded">{sig.signatureData}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
