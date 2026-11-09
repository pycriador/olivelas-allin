import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Undo2, Plus, Check, X, MessageCircle, History } from "lucide-react";
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
import type { SOReturn } from "@/modules/service-orders/types";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";

export const Route = createFileRoute("/_app/service-orders/$id/returns")({
  head: () => ({ meta: [{ title: "Retornos — ServiceForge" }] }),
  component: ReturnsTab,
});

function ReturnsTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    reason: "", reportedDefect: "", diagnosis: "", solution: "",
    warrantyApplied: false, charged: true,
  });

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["so-returns", id],
    queryFn: () => serviceOrderService.getReturns(id),
  });

  const createReturn = useMutation({
    mutationFn: () => serviceOrderService.createReturn(id, form, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-returns", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      setOpen(false);
      setForm({ reason: "", reportedDefect: "", diagnosis: "", solution: "", warrantyApplied: false, charged: true });
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_RETURN_CREATED, "service-order", "service-orders", { id }).catch(() => {});
      toast("Retorno criado");
    },
    onError: () => toast("Erro ao criar retorno"),
  });

  const addComment = useMutation({
    mutationFn: ({ returnId, text }: { returnId: string; text: string }) =>
      serviceOrderService.addReturnComment(id, returnId, { author: "Admin", authorId: "admin", text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-returns", id] });
      toast("Comentário adicionado");
    },
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Undo2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Retornos</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />Novo Retorno</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo Retorno</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div><Label>Motivo</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
              <div><Label>Defeito Relatado</Label><Textarea value={form.reportedDefect} onChange={(e) => setForm({ ...form, reportedDefect: e.target.value })} /></div>
              <div><Label>Diagnóstico</Label><Textarea value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></div>
              <div><Label>Solução</Label><Textarea value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })} /></div>
              <div className="flex items-center gap-6">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.warrantyApplied} onChange={(e) => setForm({ ...form, warrantyApplied: e.target.checked })} />
                  Garantia Aplicada
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.charged} onChange={(e) => setForm({ ...form, charged: e.target.checked })} />
                  Cobrado
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                <Button onClick={() => createReturn.mutate()} disabled={!form.reason}>{t("common.save")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {returns.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhum retorno registrado.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <Card key={ret.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{ret.number}</Badge>
                    <span className="text-sm text-muted-foreground">{ret.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ret.warrantyApplied && <Badge className="bg-blue-100 text-blue-700" variant="outline">Garantia</Badge>}
                    {ret.charged ? <Badge className="bg-green-100 text-green-700" variant="outline">Cobrado</Badge> : <Badge className="bg-gray-100 text-gray-700" variant="outline">Não Cobrado</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="font-medium">Motivo:</span><p className="text-muted-foreground">{ret.reason}</p></div>
                  <div><span className="font-medium">Defeito Relatado:</span><p className="text-muted-foreground">{ret.reportedDefect}</p></div>
                  <div><span className="font-medium">Diagnóstico:</span><p className="text-muted-foreground">{ret.diagnosis}</p></div>
                  <div><span className="font-medium">Solução:</span><p className="text-muted-foreground">{ret.solution}</p></div>
                </div>

                {/* Timeline */}
                {ret.timeline.length > 0 && (
                  <div className="border-t pt-2">
                    <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2"
                      onClick={() => setExpanded({ ...expanded, [ret.id]: !expanded[ret.id] })}>
                      <History className="h-3 w-3" /> Timeline ({ret.timeline.length})
                    </button>
                    {expanded[ret.id] && (
                      <div className="space-y-1">
                        {ret.timeline.map((entry) => (
                          <div key={entry.id} className="flex items-start gap-2 text-xs">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/30 mt-1 flex-shrink-0" />
                            <div>
                              <p>{entry.description}</p>
                              <p className="text-muted-foreground">{entry.userName ? `${entry.userName} · ` : ""}{new Date(entry.createdAt).toLocaleString("pt-BR")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Comments */}
                <div className="border-t pt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2"><MessageCircle className="h-3 w-3 inline mr-1" />{ret.comments.length} comentários</p>
                  {ret.comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2 text-xs mb-1">
                      <Badge variant="secondary" className="text-xs">{c.author}</Badge>
                      <span className="flex-1">{c.text}</span>
                      <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="Comentário..." value={commentInputs[ret.id] ?? ""} onChange={(e) => setCommentInputs({ ...commentInputs, [ret.id]: e.target.value })} />
                    <Button size="sm" disabled={!commentInputs[ret.id]} onClick={() => {
                      addComment.mutate({ returnId: ret.id, text: commentInputs[ret.id] ?? "" });
                      setCommentInputs({ ...commentInputs, [ret.id]: "" });
                    }}>Enviar</Button>
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
