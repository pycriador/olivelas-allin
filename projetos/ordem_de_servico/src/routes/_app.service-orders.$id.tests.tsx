import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FlaskConical, Plus, CheckCircle, XCircle, HelpCircle, ClipboardCheck } from "lucide-react";
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
import { eventBus, EVENT_NAMES } from "@/modules/events/service";

export const Route = createFileRoute("/_app/service-orders/$id/tests")({
  head: () => ({ meta: [{ title: "Testes — ServiceForge" }] }),
  component: TestsTab,
});

const resultColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  passed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  inconclusive: "bg-yellow-100 text-yellow-700",
};

const resultLabels: Record<string, string> = {
  pending: "Pendente", passed: "Aprovado", failed: "Reprovado", inconclusive: "Inconclusivo",
};

const testTypes = [
  { value: "visual", label: "Visual" }, { value: "functional", label: "Funcional" },
  { value: "stress", label: "Estresse" }, { value: "burn_in", label: "Burn-in" },
  { value: "connectivity", label: "Conectividade" }, { value: "battery", label: "Bateria" },
  { value: "screen", label: "Tela" }, { value: "audio", label: "Áudio" },
  { value: "camera", label: "Câmera" }, { value: "sensor", label: "Sensor" },
  { value: "safety", label: "Segurança" }, { value: "performance", label: "Performance" },
  { value: "compatibility", label: "Compatibilidade" },
];

function TestsTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "functional" as string, typeLabel: "Funcional", result: "pending" as "pending" | "passed" | "failed" | "inconclusive",
    notes: "", responsibleName: "",
  });

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["so-tests", id],
    queryFn: () => serviceOrderService.getTests(id),
  });

  const createTest = useMutation({
    mutationFn: () => serviceOrderService.createTest(id, {
      type: form.type as any, typeLabel: form.typeLabel, result: form.result,
      notes: form.notes, checklist: [], photos: [], videos: [],
      responsibleName: form.responsibleName,
    }, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-tests", id] });
      setOpen(false);
      setForm({ type: "functional", typeLabel: "Funcional", result: "pending", notes: "", responsibleName: "" });
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_TEST_CREATED ?? "service-order.test.created", "service-order", "service-orders", { id }).catch(() => {});
      toast("Teste criado");
    },
    onError: () => toast("Erro ao criar teste"),
  });

  const updateResult = useMutation({
    mutationFn: ({ testId, result }: { testId: string; result: "passed" | "failed" | "inconclusive" }) =>
      serviceOrderService.updateTest(id, testId, { result }, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-tests", id] });
      toast("Resultado do teste atualizado");
    },
    onError: () => toast("Erro ao atualizar teste"),
  });

  const removeTest = useMutation({
    mutationFn: (testId: string) => serviceOrderService.removeTest(id, testId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-tests", id] });
      toast("Teste removido");
    },
  });

  const { data: deliveryCheck, isLoading: checkingDelivery } = useQuery({
    queryKey: ["so-can-deliver", id],
    queryFn: () => serviceOrderService.canDeliver(id),
  });

  const passed = tests.filter((t) => t.result === "passed").length;
  const failed = tests.filter((t) => t.result === "failed").length;
  const pending = tests.filter((t) => t.result === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Testes</h2>
          <p className="text-sm text-muted-foreground">
            {tests.length} testes · {passed} aprovados · {failed} reprovados · {pending} pendentes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {deliveryCheck && (
            <Badge variant={deliveryCheck.allowed ? "default" : "destructive"}>
              {deliveryCheck.allowed ? "Liberado para entrega" : `${deliveryCheck.pendingTests} teste(s) pendente(s)`}
            </Badge>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" />Novo Teste</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Teste</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Teste</Label>
                  <Select value={form.type} onValueChange={(v) => {
                    const found = testTypes.find((tt) => tt.value === v);
                    setForm({ ...form, type: v, typeLabel: found?.label ?? v });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {testTypes.map((tt) => (
                        <SelectItem key={tt.value} value={tt.value}>{tt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Resultado</Label>
                  <Select value={form.result} onValueChange={(v) => setForm({ ...form, result: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="passed">Aprovado</SelectItem>
                      <SelectItem value="failed">Reprovado</SelectItem>
                      <SelectItem value="inconclusive">Inconclusivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Responsável</Label>
                  <Input value={form.responsibleName} onChange={(e) => setForm({ ...form, responsibleName: e.target.value })} />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button className="w-full" onClick={() => createTest.mutate()}>Criar Teste</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Carregando...</div>
      ) : tests.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhum teste registrado</p></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{test.typeLabel}</span>
                      <Badge className={resultColors[test.result] ?? ""} variant="outline">
                        {resultLabels[test.result] ?? test.result}
                      </Badge>
                    </div>
                    {test.responsibleName && (
                      <p className="text-xs text-muted-foreground">Responsável: {test.responsibleName}</p>
                    )}
                    {test.notes && <p className="text-sm mt-2">{test.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    {test.result !== "passed" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" title="Aprovar"
                        onClick={() => updateResult.mutate({ testId: test.id, result: "passed" })}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {test.result !== "failed" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" title="Reprovar"
                        onClick={() => updateResult.mutate({ testId: test.id, result: "failed" })}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="Remover"
                      onClick={() => removeTest.mutate(test.id)}>
                      <XCircle className="h-4 w-4 opacity-50" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
