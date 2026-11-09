import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, Hash, Ticket, Timer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/common/empty-state";
import { getPublicCampaign } from "@/features/campaigns/public-campaign.functions";
import { campaignMediaPublicUrl, siteUrl } from "@/services/campaign.service";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { buildJsonLdProduct, buildJsonLdWebPage, buildSeoMeta } from "@/lib/seo";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { useNow } from "@/features/campaigns/hooks/use-countdown";
import { useRealtimeCampaign } from "@/features/campaigns/hooks/use-realtime-campaign";
import { useReleaseExpired, useReservation } from "@/features/campaigns/hooks/use-reservation";
import { NumberSelectionSection } from "@/features/campaigns/components/numbers/number-selection-section";
import { ReservationDrawer } from "@/features/campaigns/components/numbers/reservation-drawer";
import { ReservationDialog } from "@/features/campaigns/components/numbers/reservation-dialog";
import { ReservationTimer } from "@/features/campaigns/components/numbers/reservation-timer";
import type { CampaignPublicData } from "@/types/campaign";

export const Route = createFileRoute("/r/$slug")({
  loader: async ({ params }) => getPublicCampaign({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    const data = loaderData as CampaignPublicData | null;
    if (!data) {
      return { meta: [{ title: "Rifa não encontrada — RaffleHub" }] };
    }
    const { campaign, settings } = data;
    const url = `${siteUrl()}/r/${campaign.slug}`;
    const imagePath = settings?.share_image || campaign.cover_image;
    const image = campaignMediaPublicUrl(imagePath);
    const title = settings?.seo_title ?? `${campaign.title} — RaffleHub`;
    const description =
      settings?.seo_description ??
      campaign.short_description ??
      `Participe da rifa ${campaign.title}. ${formatCurrency(campaign.price_per_number)} por número.`;
    const keywords = settings?.seo_keywords ?? `rifa, sorteio, ${campaign.product_name}`;

    return {
      meta: buildSeoMeta({
        title,
        description,
        url,
        image,
        keywords,
        type: "website",
      }),
      links: url ? [{ rel: "canonical", href: url }] : undefined,
      scripts:
        settings?.enable_seo === false
          ? undefined
          : [
              buildJsonLdProduct({
                name: campaign.product_name,
                description: campaign.description,
                image,
                price: campaign.price_per_number,
                currency: "BRL",
                url,
                availability: "https://schema.org/InStock",
                brand: "RaffleHub",
              }),
              buildJsonLdWebPage({
                title,
                description,
                url,
                publishedTime: campaign.created_at,
                modifiedTime: campaign.updated_at,
                image,
              }),
            ],
    };
  },
  component: PublicCampaignPage,
});

function PublicCampaignPage() {
  const data = Route.useLoaderData();

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <EmptyState
          title="Rifa não encontrada"
          description="Esta rifa pode não existir ou não está pública no momento."
          actions={
            <Button asChild>
              <Link to="/">Ir para o RaffleHub</Link>
            </Button>
          }
        />
      </main>
    );
  }

  return <CampaignView data={data} />;
}

function CampaignView({ data }: { data: CampaignPublicData }) {
  const { campaign, images, settings } = data;

  const numbersQuery = useRealtimeCampaign(campaign.id, { initialData: data.numbers });
  const numbers = numbersQuery.data ?? data.numbers;
  const now = useNow();
  useReleaseExpired();

  const reservation = useReservation({
    campaignId: campaign.id,
    campaign,
    numbers,
    now,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const previousConflictsRef = useRef<number[]>([]);

  useEffect(() => {
    if (reservation.reservation) {
      setDialogOpen(true);
    } else {
      setDialogOpen(false);
    }
  }, [reservation.reservation]);

  useEffect(() => {
    if (!showHelp) return;
    const timer = window.setTimeout(() => setShowHelp(false), 5000);
    return () => window.clearTimeout(timer);
  }, [showHelp]);

  useEffect(() => {
    const previous = previousConflictsRef.current;
    if (reservation.conflicts.length > previous.length) {
      const added = reservation.conflicts.filter((conflict) => !previous.includes(conflict));
      toast.error(
        added.length === 1
          ? `O número ${added[0]} acabou de ser reservado e foi removido da sua seleção.`
          : `${added.length} números foram reservados por outra pessoa e removidos da sua seleção.`,
      );
    }
    previousConflictsRef.current = reservation.conflicts;
  }, [reservation.conflicts]);

  async function handleContinue() {
    setDrawerOpen(false);
    const result = await reservation.reserve();
    if (!result.ok) {
      if (result.error === "CONFLICT") {
        toast.error("Um ou mais numeros foram reservados por outra pessoa no momento.");
      } else {
        toast.error(result.message ?? "Nao foi possivel reservar os numeros.");
      }
      return;
    }

    if (campaign.purchase_mode === "AUTOMATIC" && result.token) {
      try {
        const { createCheckoutOrder } = await import("@/lib/payments/payment.server");
        const orderId = await createCheckoutOrder({
          campaignId: campaign.id,
          token: result.token,
          reservedBy: reservation.guestId,
        });
        window.location.href = `/checkout/${orderId}`;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao criar pedido.");
      }
    }
  }

  async function handleCancel() {
    setIsCancelling(true);
    try {
      await reservation.cancelReservation();
      toast.success("Reserva cancelada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar a reserva.");
    } finally {
      setIsCancelling(false);
    }
  }

  function handleExpire() {
    void reservation.cancelReservation();
    toast.info("Sua reserva expirou e os números foram liberados.");
  }

  const coverUrl = campaignMediaPublicUrl(campaign.cover_image);
  const galleryUrls = images
    .filter((image) => image.storage_path !== campaign.cover_image)
    .map((image) => campaignMediaPublicUrl(image.storage_path))
    .filter((value): value is string => value !== null);
  const descriptionHtml = campaign.description ? renderMarkdownToHtml(campaign.description) : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Ticket aria-hidden="true" className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">RaffleHub</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 pb-8 sm:pb-24">
        <article className="surface-card overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`Imagem da rifa ${campaign.title}`}
              className="w-full object-contain"
            />
          ) : null}

          <div className="space-y-6 p-6 sm:p-10">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {campaign.product_name}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {campaign.title}
              </h1>
              {campaign.short_description ? (
                <p className="max-w-2xl text-muted-foreground">{campaign.short_description}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <dl className="surface-card space-y-3 p-5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Hash aria-hidden="true" className="size-4" />
                    Faixa de números
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {formatNumber(campaign.number_start)} a {formatNumber(campaign.number_end)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Timer aria-hidden="true" className="size-4" />
                    Início
                  </dt>
                  <dd className="tabular-nums">{formatDate(campaign.start_date)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays aria-hidden="true" className="size-4" />
                    Sorteio
                  </dt>
                  <dd className="tabular-nums">{formatDate(campaign.end_date)}</dd>
                </div>
              </dl>

              <div className="surface-card flex flex-col justify-center gap-3 p-5">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Valor por número</p>
                  {settings?.show_product_value !== false ? (
                    <p className="text-4xl font-semibold tracking-tight">
                      {formatCurrency(campaign.price_per_number)}
                    </p>
                  ) : (
                    <p className="text-lg font-medium">Confidencial</p>
                  )}
                </div>
                {settings?.show_remaining_numbers !== false ? (
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(data.availableCount)} números disponíveis de{" "}
                    {formatNumber(campaign.total_numbers)}
                  </p>
                ) : null}
                {settings?.show_progress !== false ? (
                  <div className="space-y-1.5">
                    <Progress value={data.progressPercent} />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(data.progressPercent)}% vendido
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Escolha seus números</h2>

              {reservation.reservation ? (
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold">Você tem uma reserva ativa</p>
                    <p className="text-xs text-muted-foreground">
                      {reservation.reservation.numbers.length} número(s) ·{" "}
                      {formatCurrency(reservation.reservation.total)} — finalize antes do tempo
                      expirar.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReservationTimer
                      until={reservation.reservation.reservedUntil}
                      onExpire={handleExpire}
                    />
                    <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                      Ver detalhes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleCancel()}
                      disabled={isCancelling}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : null}

              <NumberSelectionSection
                campaign={campaign}
                numbers={numbers}
                now={now}
                selected={reservation.selected}
                totalValue={reservation.totalValue}
                onToggle={reservation.toggle}
                onSelectDragRange={reservation.selectDragRange}
                onPick={reservation.select}
                selectionDisabled={reservation.reservation !== null}
                onOpenCart={() => setDrawerOpen(true)}
                onClearSelection={reservation.clearSelection}
              />

              {showHelp ? (
                <div className="sm:hidden">
                  <p className="rounded-lg bg-primary px-4 py-2.5 text-center text-sm text-primary-foreground shadow-lg">
                    Toque duas vezes em um número para selecionar. Arraste para selecionar vários.
                  </p>
                </div>
              ) : null}
            </div>

            {descriptionHtml ? (
              <div
                className="markdown-content border-t border-border pt-6 text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : null}

            {galleryUrls.length > 0 ? (
              <section aria-label="Galeria" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {galleryUrls.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    className="overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={url}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-full rounded-xl object-cover transition-transform hover:scale-105"
                    />
                  </button>
                ))}
              </section>
            ) : null}

            {lightboxIndex != null ? (
              <ImageLightbox
                images={galleryUrls}
                index={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onPrev={() =>
                  setLightboxIndex((lightboxIndex - 1 + galleryUrls.length) % galleryUrls.length)
                }
                onNext={() => setLightboxIndex((lightboxIndex + 1) % galleryUrls.length)}
              />
            ) : null}
          </div>
        </article>
      </main>

      <ReservationDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        campaign={campaign}
        selected={reservation.selectedList}
        totalValue={reservation.totalValue}
        isReserving={reservation.isReserving}
        onContinue={() => void handleContinue()}
      />

      {reservation.reservation ? (
        <ReservationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          campaign={campaign}
          reservation={reservation.reservation}
          onExpire={handleExpire}
          onCancel={() => void handleCancel()}
          isCancelling={isCancelling}
        />
      ) : null}
    </div>
  );
}

function ImageLightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const src = images[index];
  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-label="Visualizador de imagem"
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
        onClick={onClose}
        aria-label="Fechar"
      >
        <X aria-hidden="true" className="size-6" />
      </button>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            onClick={(event) => {
              event.stopPropagation();
              onPrev();
            }}
            aria-label="Anterior"
          >
            <ChevronLeft aria-hidden="true" className="size-6" />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            onClick={(event) => {
              event.stopPropagation();
              onNext();
            }}
            aria-label="Próxima"
          >
            <ChevronRight aria-hidden="true" className="size-6" />
          </button>
        </>
      ) : null}

      <img
        src={src}
        alt=""
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(event) => event.stopPropagation()}
      />

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
        {index + 1} / {images.length}
      </p>
    </div>
  );
}
