import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Stethoscope, Plus, AlertTriangle, Wrench, Clock, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import type { DiagnosticRevision } from "@/modules/service-orders/types";

export const Route = createFileRoute("/_app/service-orders/$id/diagnostic")({
  head: () => ({ meta: [{ title: "Diagnóstico — ServiceForge" }] }),
  component: DiagnosticTab,
});

function DiagnosticTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    reportedDefect: "", foundDefect: "", cause: "", proposedSolution: "",
    complexity: "medium" as "low" | "medium" | "high",
    risk: "medium" as "low" | "medium" | "high",
    notes: "", estimatedValue: 0, estimatedTime: 0,
  });

  const { data: diagnostic, isLoading } = useQuery({
    queryKey: ["so-diagnostic", id],
    queryFn: () => serviceOrderService.getDiagnostic(id),
  });

  const createRevision = useMutation({
    mutationFn: () => serviceOrderService.createDiagnostic(id, form, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-diagnostic", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      setShowForm(false);
      setForm({ reportedDefect: "", foundDefect: "", cause: "", proposedSolution: "", complexity: "medium", risk: "medium", notes: "", estimatedValue: 0, estimatedTime: 0 });
      toast("Revisão de diagnóstico criada");
    },
    onError: () => toast("Erro ao criar revisão"),
  });

  const revisions: DiagnosticRevision[] = diagnostic?.revisions ?? [];
  const sorted = [...revisions].sort((a, b) => b.version - a.version);

  const complexityColor: Record<string, string> = { low: "bg-green-100 text-green-700", medium: "bg-amber-100 text-amber-700", high: "bg-red-100 text-red-700" };
  const riskColor: Record<string, string> = { low: "bg-green-100 text-green-700", medium: "bg-amber-100 text-amber-700", high: "bg-red-100 text-red-700" };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("so.diagnosis")}</h2>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="mr-1 h-4 w-4" />Nova Revisão
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Nova Revisão de Diagnóstico</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Defeito Relatado</Label>
                <Textarea value={form.reportedDefect} onChange={(e) => setForm({ ...form, reportedDefect: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Defeito Constatado</Label>
                <Textarea value={form.foundDefect} onChange={(e) => setForm({ ...form, foundDefect: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Causa</Label>
                <Textarea value={form.cause} onChange={(e) => setForm({ ...form, cause: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Solução Proposta</Label>
                <Textarea value={form.proposedSolution} onChange={(e) => setForm({ ...form, proposedSolution: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Complexidade</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.complexity} onChange={(e) => setForm({ ...form, complexity: e.target.value as any })}>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Risco</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.risk} onChange={(e) => setForm({ ...form, risk: e.target.value as any })}>
                  <option value="low">Baixo</option>
                  <option value="medium">Médio</option>
                  <option value="high">Alto</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Valor Estimado</Label>
                <Input type="number" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Tempo Estimado (min)</Label>
                <Input type="number" value={form.estimatedTime} onChange={(e) => setForm({ ...form, estimatedTime: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
              <Button onClick={() => createRevision.mutate()} disabled={!form.reportedDefect || !form.foundDefect}>{t("common.save")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sorted.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhuma revisão de diagnóstico registrada.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((rev) => (
            <Card key={rev.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">v{rev.version}</Badge>
                    <span className="text-sm text-muted-foreground">{new Date(rev.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={complexityColor[rev.complexity] ?? ""} variant="outline">{rev.complexity}</Badge>
                    <Badge className={riskColor[rev.risk] ?? ""} variant="outline">{rev.risk}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="font-medium">Defeito Relatado:</span>
                    <p className="text-muted-foreground mt-1">{rev.reportedDefect}</p>
                  </div>
                  <div>
                    <span className="font-medium">Defeito Constatado:</span>
                    <p className="text-muted-foreground mt-1">{rev.foundDefect}</p>
                  </div>
                  <div>
                    <span className="font-medium">Causa:</span>
                    <p className="text-muted-foreground mt-1">{rev.cause}</p>
                  </div>
                  <div>
                    <span className="font-medium">Solução Proposta:</span>
                    <p className="text-muted-foreground mt-1">{rev.proposedSolution}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2 border-t">
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> R$ {rev.estimatedValue.toFixed(2)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {rev.estimatedTime} min</span>
                </div>
                {rev.notes && <p className="text-muted-foreground border-t pt-2"><FileText className="h-3 w-3 inline mr-1" />{rev.notes}</p>}
                {rev.technicianName && <p className="text-xs text-muted-foreground border-t pt-2">Por: {rev.technicianName}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
