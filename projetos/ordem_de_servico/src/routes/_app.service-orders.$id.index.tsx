import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Send, Paperclip, MessageCircle, History, User, Smartphone, Wrench, FileText, MessageSquare, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";

export const Route = createFileRoute("/_app/service-orders/$id/")({
  head: () => ({ meta: [{ title: "Resumo OS — ServiceForge" }] }),
  component: SOSummaryTab,
});

function SOSummaryTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: so, isLoading } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  const addComment = useMutation({
    mutationFn: () => serviceOrderService.addComment(id, { author: "Admin", authorId: "admin", text: commentText }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["service-order", id] }); setCommentText(""); toast.success("Comentário adicionado"); },
  });

  const priorityColor: Record<string, string> = { low: "bg-gray-100 text-gray-700", medium: "bg-blue-100 text-blue-700", high: "bg-amber-100 text-amber-700", urgent: "bg-red-100 text-red-700" };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;
  if (!so) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.noResults")}</p></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("so.description")}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{so.description}</p>
            {so.diagnosis && <div className="mt-4"><h4 className="text-sm font-medium mb-1">{t("so.diagnosis")}</h4><p className="text-sm text-muted-foreground">{so.diagnosis}</p></div>}
            {so.notes && <div className="mt-4"><h4 className="text-sm font-medium mb-1">{t("so.notes")}</h4><p className="text-sm text-muted-foreground">{so.notes}</p></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" />{t("so.timeline")}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(so.timeline ?? []).slice().reverse().map((entry) => (
                <div key={entry.id} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30 mt-1.5" />
                    <div className="w-px flex-1 bg-border" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p>{entry.description}</p>
                    <p className="text-xs text-muted-foreground">{entry.userName ? `${entry.userName} · ` : ""}{new Date(entry.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-4 w-4" />{t("so.comments")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder={t("so.addComment")} value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && commentText && addComment.mutate()} />
              <Button size="sm" disabled={!commentText} onClick={() => addComment.mutate()}><Send className="h-4 w-4" /></Button>
            </div>
            {(so.comments ?? []).slice().reverse().map((c) => (
              <div key={c.id} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{c.author}</span>
                  <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
                </div>
                <p className="text-sm">{c.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("common.summary")}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("so.status")}</span><span>{so.statusLabel}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("so.priority")}</span><Badge className={priorityColor[so.priority] ?? ""} variant="outline">{t(`so.priority.${so.priority}`)}</Badge></div>
            {so.technicianName && <div className="flex justify-between"><span className="text-muted-foreground">{t("so.technician")}</span><span>{so.technicianName}</span></div>}
            {so.defectName && <div className="flex justify-between"><span className="text-muted-foreground">{t("so.defect")}</span><span>{so.defectName}</span></div>}
            {so.deviceInfo && <div className="flex justify-between"><span className="text-muted-foreground">{t("so.device")}</span><span>{so.deviceInfo}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">{t("so.entryDate")}</span><span>{so.entryDate}</span></div>
            {so.deadline && <div className="flex justify-between"><span className="text-muted-foreground">{t("so.deadline")}</span><span>{so.deadline}</span></div>}
            {so.deliveryDate && <div className="flex justify-between"><span className="text-muted-foreground">{t("so.deliveryDate")}</span><span>{so.deliveryDate}</span></div>}
            <div className="border-t pt-3">
              <div className="flex justify-between font-medium"><span>{t("so.estimatedValue")}</span><span>{so.estimatedValue ? `R$ ${so.estimatedValue.toFixed(2)}` : "-"}</span></div>
              <div className="flex justify-between font-medium"><span>{t("so.finalValue")}</span><span>{so.finalValue ? `R$ ${so.finalValue.toFixed(2)}` : "-"}</span></div>
            </div>
            {so.services && so.services.length > 0 && (
              <div className="border-t pt-3">
                <h4 className="font-medium text-sm mb-2">{t("so.services")}</h4>
                {so.services.map((s) => (
                  <div key={s.id} className="flex justify-between text-xs"><span>{s.serviceName} x{s.quantity}</span><span>R$ {s.totalValue.toFixed(2)}</span></div>
                ))}
              </div>
            )}
            {so.parts && so.parts.length > 0 && (
              <div className="border-t pt-3">
                <h4 className="font-medium text-sm mb-2">{t("so.parts")}</h4>
                {so.parts.map((p) => (
                  <div key={p.id} className="flex justify-between text-xs"><span>{p.partName} x{p.quantity}</span><span>R$ {p.totalValue.toFixed(2)}</span></div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Paperclip className="h-4 w-4" />{t("so.attachments")}</CardTitle></CardHeader>
          <CardContent>
            {(so.attachments ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("common.noResults")}</p>
            ) : (
              <div className="space-y-2">
                {(so.attachments ?? []).map((a) => (
                  <div key={a.id} className="text-sm flex items-center gap-2">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{a.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
