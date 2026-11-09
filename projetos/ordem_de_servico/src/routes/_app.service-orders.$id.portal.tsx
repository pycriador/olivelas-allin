import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, ShieldCheck, FileText, History, QrCode, Link, Hash, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";

export const Route = createFileRoute("/_app/service-orders/$id/portal")({
  head: () => ({ meta: [{ title: "Portal — ServiceForge" }] }),
  component: PortalTab,
});

function PortalTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: portal, isLoading } = useQuery({
    queryKey: ["so-portal", id],
    queryFn: () => serviceOrderService.getPortalAccess(id),
  });

  const generateAccess = useMutation({
    mutationFn: () => serviceOrderService.generatePortalAccess(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-portal", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      toast("Acesso ao portal gerado");
    },
    onError: () => toast("Erro ao gerar acesso ao portal"),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Portal do Cliente</h2>
      </div>

      {!portal ? (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum acesso ao portal gerado.</p>
            <Button onClick={() => generateAccess.mutate()}>
              <Globe className="mr-1 h-4 w-4" />Gerar Acesso ao Portal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />Acesso Ativo
                </CardTitle>
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  {portal.statusLabel || portal.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <KeyRound className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground">Código Público</span>
                      <p className="text-sm font-mono font-medium">{portal.publicCode}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Hash className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground">Hash</span>
                      <p className="text-sm font-mono break-all">{portal.hash}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Link className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground">URL Pública</span>
                      <p className="text-sm font-mono text-primary">{portal.publicUrl}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <QrCode className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground">QR Data</span>
                      <p className="text-sm font-mono break-all text-muted-foreground">{portal.qrData}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {portal.timeline && portal.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" />Linha do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...portal.timeline].reverse().slice(0, 10).map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <div>
                        <p>{entry.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString("pt-BR")}
                          {entry.userName && ` — ${entry.userName}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {portal.documents && portal.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {portal.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm border-b pb-2 last:border-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {portal.warranty && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Garantia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{portal.warranty}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
