import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SendHorizontal, Eye, CheckCircle, XCircle, Clock, Plus, MessageSquare } from "lucide-react";
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
import type { SOApproval } from "@/modules/service-orders/types";

export const Route = createFileRoute("/_app/service-orders/$id/approval")({
  head: () => ({ meta: [{ title: "Aprovação — ServiceForge" }] }),
  component: ApprovalTab,
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

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock, sent: SendHorizontal, viewed: Eye,
  approved: CheckCircle, rejected: XCircle,
};

const statusLabels: Record<string, string> = {
  pending: "Pendente", sent: "Enviado", viewed: "Visualizado",
  approved: "Aprovado", rejected: "Rejeitado",
};

const originLabels: Record<string, string> = {
  whatsapp: "WhatsApp", email: "E-mail", sms: "SMS",
  portal: "Portal", "in-person": "Presencial",
};

function ApprovalTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState<SOApproval["origin"]>("whatsapp");
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: approval, isLoading } = useQuery({
    queryKey: ["so-approval", id],
    queryFn: () => serviceOrderService.getApproval(id),
  });

  const createApproval = useMutation({
    mutationFn: () => serviceOrderService.createApproval(id, { origin, notes }, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-approval", id] });
      setOpen(false);
      setOrigin("whatsapp");
      setNotes("");
      toast("Aprovação criada");
    },
    onError: () => toast("Erro ao criar aprovação"),
  });

  const updateApproval = useMutation({
    mutationFn: ({ approvalId, patch }: { approvalId: string; patch: Partial<SOApproval> }) =>
      serviceOrderService.updateApproval(id, approvalId, patch, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-approval", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      toast("Aprovação atualizada");
    },
    onError: () => toast("Erro ao atualizar aprovação"),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  const statusTimeline = ["pending", "sent", "viewed", "approved", "rejected"] as const;

  const statusDate = (s: string) => {
    if (!approval) return "";
    switch (s) {
      case "sent": return approval.sentAt;
      case "viewed": return approval.viewedAt;
      case "approved": return approval.approvedAt;
      case "rejected": return approval.rejectedAt;
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Aprovação</h2>
        </div>
        {(!approval || approval.status === "rejected" || approval.status === "expired") && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" />Nova Aprovação</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Aprovação</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Origem</Label>
                  <Select value={origin} onValueChange={(v: SOApproval["origin"]) => setOrigin(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(originLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                  <Button onClick={() => createApproval.mutate()}>{t("common.save")}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!approval ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhuma aprovação solicitada.</p></CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Status: <Badge className={statusColors[approval.status] ?? ""} variant="outline">{statusLabels[approval.status]}</Badge>
                </CardTitle>
                <span className="text-sm text-muted-foreground">Origem: {originLabels[approval.origin]}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusTimeline.map((s) => {
                  const Icon = statusIcons[s] ?? Clock;
                  const date = statusDate(s);
                  const isActive = s === approval.status || (s === "approved" && approval.status === "rejected");
                  const isPast = approval.status === "approved" ? statusTimeline.indexOf(s) <= statusTimeline.indexOf(approval.status as typeof statusTimeline[number]) && s !== "rejected"
                    : statusTimeline.indexOf(s) <= statusTimeline.indexOf(approval.status as typeof statusTimeline[number]);
                  return (
                    <div key={s} className={`flex items-center gap-3 ${isPast ? "opacity-100" : "opacity-40"}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isPast ? "bg-primary/10" : "bg-muted"}`}>
                        <Icon className={`h-4 w-4 ${isPast ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isPast ? "" : "text-muted-foreground"}`}>{statusLabels[s] ?? s}</p>
                        {date && <p className="text-xs text-muted-foreground">{new Date(date).toLocaleString("pt-BR")}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {approval.notes && (
                <div className="mt-4 flex items-start gap-2 text-sm border-t pt-3">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div><span className="font-medium">Observações:</span><p className="text-muted-foreground">{approval.notes}</p></div>
                </div>
              )}
            </CardContent>
          </Card>

          {approval.status === "pending" && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => updateApproval.mutate({ approvalId: approval.id, patch: { status: "sent", origin: approval.origin } })}>
                <SendHorizontal className="mr-1 h-4 w-4" />Marcar como Enviado
              </Button>
              <Button variant="outline" onClick={() => updateApproval.mutate({ approvalId: approval.id, patch: { status: "viewed" } })}>
                <Eye className="mr-1 h-4 w-4" />Marcar como Visualizado
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => updateApproval.mutate({ approvalId: approval.id, patch: { status: "approved" } })}>
                <CheckCircle className="mr-1 h-4 w-4" />Aprovar
              </Button>
            </div>
          )}

          {(approval.status === "pending" || approval.status === "sent" || approval.status === "viewed") && (
            <Card>
              <CardHeader><CardTitle className="text-base">Rejeitar Aprovação</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Motivo da Rejeição</Label>
                  <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Descreva o motivo da rejeição..." />
                </div>
                <Button variant="destructive" disabled={!rejectionReason} onClick={() => updateApproval.mutate({ approvalId: approval.id, patch: { status: "rejected", rejectionReason } })}>
                  <XCircle className="mr-1 h-4 w-4" />Rejeitar
                </Button>
              </CardContent>
            </Card>
          )}

          {approval.rejectionReason && (
            <Card>
              <CardHeader><CardTitle className="text-base text-red-600">Motivo da Rejeição</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{approval.rejectionReason}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
