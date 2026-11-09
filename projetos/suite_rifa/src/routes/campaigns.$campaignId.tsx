import { createFileRoute, Link, Outlet, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Edit,
  ExternalLink,
  Hash,
  ImagePlus,
  Pause,
  Play,
  Archive,
  RefreshCw,
  Share2,
  Users,
  ShoppingCart,
  Download,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { PermissionGate } from "@/components/app/PermissionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCampaign,
  useCampaignImages,
  useSetCampaignStatus,
  useUploadCampaignImage,
  useDeleteCampaignImage,
  useSetCover,
  useReorderImages,
} from "@/hooks/useCampaigns";
import { useCurrentUser, useTenant } from "@/hooks/useTenant";
import { useParticipants, useExportParticipantsCsv } from "@/hooks/useParticipants";
import { useSales, useSalesMetrics, useExportSalesCsv } from "@/hooks/useSales";
import { usePayments, usePaymentMetrics } from "@/hooks/usePayments";
import { useRealtimeNumbers } from "@/hooks/useRealtimeNumbers";
import { PaymentMetricsCards } from "@/components/payments/PaymentMetricsCards";
import { PaymentHistoryTable } from "@/components/payments/PaymentHistoryTable";
import type { CampaignStatus } from "@/services/types";
import {
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_TONE,
  CAMPAIGN_TRANSITIONS,
  formatDateTime,
  formatMoney,
  potentialRevenue,
  PAYMENT_METHOD_LABEL,
} from "@/services/types";
import { CampaignImageService } from "@/services/campaigns";

export const Route = createFileRoute("/campaigns/$campaignId")({
  head: ({ params }) => ({
    meta: [
      { title: `Campanha — RaffleHub` },
      { name: "description", content: "Detalhes da campanha." },
    ],
  }),
  component: CampaignDetail,
});

function CampaignDetail() {
  const { campaignId } = useParams({ from: "/campaigns/$campaignId" });
  const navigate = useNavigate();
  const { user, isPending: authPending } = useCurrentUser();
  const { organizationId, memberships, isPending: tenantPending, isSuspended } = useTenant();

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChildRoute = pathname !== `/campaigns/${campaignId}`;

  const { data: campaign, isPending: loading } = useCampaign(campaignId);
  const { data: images } = useCampaignImages(campaignId);
  const setStatus = useSetCampaignStatus();
  const uploadImage = useUploadCampaignImage();
  const deleteImage = useDeleteCampaignImage();
  const setCover = useSetCover();

  useRealtimeNumbers(campaignId);

  const { data: participantsData, isPending: loadingParticipants } = useParticipants(campaignId, { limit: 20 });
  const { data: salesData, isPending: loadingSales } = useSales(campaignId, { limit: 20 });
  const { data: salesMetrics } = useSalesMetrics(campaignId);
  const { data: paymentsData } = usePayments(campaignId, { limit: 20 });
  const { data: paymentMetrics } = usePaymentMetrics(campaignId);
  const exportParticipantsCsv = useExportParticipantsCsv();
  const exportSalesCsv = useExportSalesCsv();

  const [actionTarget, setActionTarget] = useState<CampaignStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authPending && !user) void navigate({ to: "/auth", replace: true });
  }, [authPending, user, navigate]);

  useEffect(() => {
    if (!tenantPending && user && memberships.length === 0) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [tenantPending, user, memberships.length, navigate]);

  const confirmAction = useCallback(() => {
    if (!actionTarget) return;
    setStatus.mutate(
      { campaignId, status: actionTarget },
      { onSettled: () => setActionTarget(null) },
    );
  }, [actionTarget, campaignId, setStatus]);

  const handleShare = useCallback(() => {
    if (!campaign) return;
    const url = `${window.location.origin}/c/${campaign.slug}`;
    void navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }, [campaign]);

  if (isChildRoute) return <Outlet />;

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const err = CampaignImageService.validate(file);
      if (err) { toast.error(err); return; }
      uploadImage.mutate({ campaignId, file, asCover: !images || images.length === 0 });
      e.target.value = "";
    },
    [campaignId, images, uploadImage],
  );

  if (loading) {
    return (
      <AppShell title="Campanha">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="aspect-video w-full max-w-2xl rounded-xl" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!campaign) {
    return (
      <AppShell title="Campanha não encontrada">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
          <p className="font-medium">Campanha não encontrada</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Esta campanha não existe ou você não possui acesso a ela.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/campaigns">Voltar para campanhas</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const revenue = potentialRevenue(campaign.total_numbers, campaign.number_price);
  const cover = campaign.cover_image_url ?? images?.find((i) => i.type === "COVER")?.url;

  return (
    <AppShell
      title={campaign.name}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/campaigns/${campaignId}/numbers`}>
              <Hash className="size-4" /> Números
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="size-4" /> Compartilhar
          </Button>
          {campaign.status === "PUBLISHED" && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/c/${campaign.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" /> Pública
              </a>
            </Button>
          )}
          <PermissionGate permission="campaigns.update" silent>
            <Button variant="outline" size="sm" asChild disabled={campaign.status === "ARCHIVED"}>
              <Link to="/campaigns/$campaignId/edit" params={{ campaignId }}>
                <Edit className="size-4" /> Editar
              </Link>
            </Button>
          </PermissionGate>
          {CAMPAIGN_TRANSITIONS[campaign.status].map((to) => {
            const icons: Record<string, typeof Play> = {
              PUBLISHED: Play,
              PAUSED: Pause,
              FINISHED: CheckCircle,
              ARCHIVED: Archive,
              DRAFT: RefreshCw,
            };
            const labels: Record<string, string> = {
              PUBLISHED: "Publicar",
              PAUSED: "Pausar",
              FINISHED: "Finalizar",
              ARCHIVED: "Arquivar",
              DRAFT: "Restaurar",
            };
            const Icon = icons[to] ?? Edit;
            const perms: Record<string, string> = {
              PUBLISHED: "campaigns.publish",
              PAUSED: "campaigns.pause",
              FINISHED: "campaigns.finish",
              ARCHIVED: "campaigns.archive",
              DRAFT: "campaigns.restore",
            };
            return (
              <PermissionGate key={to} permission={(perms[to] ?? "campaigns.update") as "campaigns.publish" | "campaigns.pause" | "campaigns.finish" | "campaigns.archive" | "campaigns.restore" | "campaigns.update"} silent>
                <Button
                  variant={to === "ARCHIVED" ? "destructive" : "default"}
                  size="sm"
                  disabled={isSuspended}
                  onClick={() => setActionTarget(to)}
                >
                  <Icon className="size-4" /> {labels[to] ?? to}
                </Button>
              </PermissionGate>
            );
          })}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Badge className={CAMPAIGN_STATUS_TONE[campaign.status]} variant="secondary">
            {CAMPAIGN_STATUS_LABEL[campaign.status]}
          </Badge>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/campaigns">
              <ArrowLeft className="size-4" /> Campanhas
            </Link>
          </Button>
        </div>
        {cover && (
          <img src={cover} alt={campaign.name} className="aspect-video w-full max-w-2xl rounded-xl border object-cover" />
        )}

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="images">Imagens</TabsTrigger>
            <TabsTrigger value="participants">Participantes</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-1 pt-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Total de números</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-2xl font-bold">{campaign.total_numbers.toLocaleString("pt-BR")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Preço por número</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-2xl font-bold">{formatMoney(campaign.number_price, campaign.currency)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Receita potencial</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-2xl font-bold">{formatMoney(revenue, campaign.currency)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={CAMPAIGN_STATUS_TONE[campaign.status]} variant="secondary">
                    {CAMPAIGN_STATUS_LABEL[campaign.status]}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {campaign.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{campaign.description}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">{campaign.product_name}</p>
                {campaign.product_description && (
                  <p className="text-sm text-muted-foreground">{campaign.product_description}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Datas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Início:</span>{" "}
                  {campaign.start_at ? formatDateTime(campaign.start_at) : "Sem data definida"}
                </div>
                <div>
                  <span className="text-muted-foreground">Fim:</span>{" "}
                  {campaign.end_at ? formatDateTime(campaign.end_at) : "Sem data definida"}
                </div>
                {campaign.published_at && (
                  <div>
                    <span className="text-muted-foreground">Publicada em:</span>{" "}
                    {formatDateTime(campaign.published_at)}
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Criada em:</span>{" "}
                  {formatDateTime(campaign.created_at)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="mt-4 space-y-4">
            <PermissionGate permission="campaigns.manage_images" silent>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadImage.isPending}
                >
                  <ImagePlus className="size-4" /> {uploadImage.isPending ? "Enviando…" : "Adicionar imagem"}
                </Button>
              </div>
            </PermissionGate>

            {!images || images.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
                <p className="font-medium">Nenhuma imagem</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Adicione uma capa e imagens da galeria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((img) => (
                  <div key={img.id} className="group relative overflow-hidden rounded-lg border">
                    <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      {img.type === "COVER" ? (
                        <span className="text-xs text-white">Capa</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto py-1 text-xs text-white hover:text-white"
                          onClick={() => setCover.mutate({ imageId: img.id, campaignId })}
                        >
                          Definir capa
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-white hover:text-white"
                        onClick={() => deleteImage.mutate({ imageId: img.id, campaignId })}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                    {img.type === "COVER" && (
                      <Badge className="absolute left-1 top-1" variant="secondary">Capa</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="participants" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Participantes</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportParticipantsCsv.mutate(campaignId)} disabled={exportParticipantsCsv.isPending}>
                  <Download className="size-4" /> {exportParticipantsCsv.isPending ? "Exportando…" : "Exportar CSV"}
                </Button>
              </div>
            </div>
            {loadingParticipants ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !participantsData || participantsData.items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
                <p className="font-medium">Nenhum participante ainda</p>
                <p className="text-sm text-muted-foreground">Participantes aparecem aqui ao registrar vendas.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Números</TableHead>
                    <TableHead>Total gasto</TableHead>
                    <TableHead>Última compra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participantsData.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.phone ?? "—"}</TableCell>
                      <TableCell>{p.numbers_count}</TableCell>
                      <TableCell>{formatMoney(p.total_spent)}</TableCell>
                      <TableCell>{formatDateTime(p.last_purchase)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="sales" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Vendas</h3>
              <Button variant="outline" size="sm" onClick={() => exportSalesCsv.mutate(campaignId)} disabled={exportSalesCsv.isPending}>
                <Download className="size-4" /> {exportSalesCsv.isPending ? "Exportando…" : "Exportar CSV"}
              </Button>
            </div>

            {salesMetrics && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-1 pt-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Receita</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-2xl font-bold">{formatMoney(salesMetrics.revenue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1 pt-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Ticket médio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-2xl font-bold">{formatMoney(salesMetrics.average_ticket)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1 pt-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Números vendidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-2xl font-bold">{salesMetrics.numbers_sold}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1 pt-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Total de vendas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-2xl font-bold">{salesMetrics.total_sales}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {loadingSales ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !salesData || salesData.items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
                <p className="font-medium">Nenhuma venda registrada</p>
                <p className="text-sm text-muted-foreground">Registre vendas na aba de Números.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participante</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Números</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.items.map((s) => (
                    <TableRow key={s.id} className={s.cancelled_at ? "opacity-50 line-through" : ""}>
                      <TableCell className="font-medium">{s.participant_name ?? "—"}</TableCell>
                      <TableCell>{s.participant_phone ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{s.numbers.sort((a, b) => a - b).join(", ")}</TableCell>
                      <TableCell>{PAYMENT_METHOD_LABEL[s.payment_method]}</TableCell>
                      <TableCell>{formatMoney(s.amount)}</TableCell>
                      <TableCell>{formatDateTime(s.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="payments" className="mt-4 space-y-4">
            <h3 className="font-display text-lg font-semibold">Pagamentos</h3>

            {paymentMetrics && (
              <PaymentMetricsCards metrics={paymentMetrics} currency={campaign.currency} />
            )}

            {paymentsData && paymentsData.items.length > 0 ? (
              <PaymentHistoryTable payments={paymentsData.items} currency={campaign.currency} />
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
                <p className="font-medium">Nenhum pagamento registrado</p>
                <p className="text-sm text-muted-foreground">
                  Pagamentos aparecem aqui quando participantes finalizam o checkout.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!actionTarget} onOpenChange={(o) => { if (!o) setActionTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget && (
                <>
                  Deseja {CAMPAIGN_STATUS_LABEL[actionTarget].toLowerCase()} a campanha{" "}
                  <strong>{campaign.name}</strong>?
                  {actionTarget === "FINISHED" && " Novas operações de venda e reserva serão bloqueadas."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} disabled={setStatus.isPending}>
              {setStatus.isPending ? "Processando…" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
