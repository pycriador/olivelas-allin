import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { AlertCircle, Clock, CreditCard, ShoppingCart, X } from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicCampaign } from "@/hooks/useCampaigns";
import { usePublicCampaignNumbers, useActiveReservation, useReserveNumbers, useCancelReservation } from "@/hooks/useNumbers";
import { useRealtimeNumbers } from "@/hooks/useRealtimeNumbers";
import { NumberGrid } from "@/components/numbers/NumberGrid";
import { formatMoney, potentialRevenue } from "@/services/types";
import type { NumberStatus } from "@/services/types";

export const Route = createFileRoute("/c/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: "Rifa — RaffleHub" },
      { name: "description", content: "Participe desta campanha de rifa no RaffleHub." },
      { property: "og:title", content: "Rifa — RaffleHub" },
      { property: "og:description", content: "Participe desta campanha de rifa no RaffleHub." },
      { property: "og:url", content: `/c/${params.slug}` },
    ],
  }),
  component: PublicCampaignPage,
});

function useCountdown(targetIso: string | null) {
  const [remaining, setRemaining] = useState(() =>
    targetIso ? Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000)) : 0,
  );

  useEffect(() => {
    if (!targetIso) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isUrgent = remaining > 0 && remaining < 120;

  return { remaining, formatted, isUrgent, expired: remaining <= 0 };
}

function PublicProgressBar({ numbers, total }: { numbers: { number: number; status: string }[]; total: number }) {
  const counts = useMemo(() => {
    const c = { sold: 0, reserved: 0, available: 0 };
    for (const n of numbers) {
      if (n.status === "SOLD") c.sold++;
      else if (n.status === "RESERVED") c.reserved++;
    }
    c.available = total - c.sold - c.reserved;
    return c;
  }, [numbers, total]);

  const t = total || 1;
  const segments = [
    { label: "Vendidos", count: counts.sold, color: "bg-sky-500" },
    { label: "Reservados", count: counts.reserved, color: "bg-amber-500" },
    { label: "Disponíveis", count: counts.available, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
        {segments.map((seg) => {
          const pct = (seg.count / t) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={seg.label}
              className={`${seg.color} transition-all duration-300`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {segments.map((seg) => (
          <span key={seg.label} className="flex items-center gap-1">
            <span className={`inline-block size-2 rounded-full ${seg.color}`} />
            {seg.label}: {seg.count.toLocaleString("pt-BR")}
          </span>
        ))}
      </div>
    </div>
  );
}

function PublicCampaignPage() {
  const { slug } = useParams({ from: "/c/$slug" });
  const navigate = useNavigate();
  const { data: campaign, isPending, error } = usePublicCampaign(slug);
  const { data: numbersData } = usePublicCampaignNumbers(slug);
  useRealtimeNumbers(numbersData?.campaign_id);
  const { data: reservation } = useActiveReservation(numbersData?.campaign_id);
  const reserveNumbers = useReserveNumbers();
  const cancelReservation = useCancelReservation();

  const [selected, setSelected] = useState<Set<number>>(new Set());

  const countdown = useCountdown(reservation?.expires_at ?? null);

  const handleToggle = useCallback((n: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }, []);

  const handleReserve = useCallback(() => {
    if (!numbersData?.campaign_id || selected.size === 0) return;
    reserveNumbers.mutate(
      { campaignId: numbersData.campaign_id, numbers: Array.from(selected) },
      { onSuccess: () => setSelected(new Set()) },
    );
  }, [numbersData, selected, reserveNumbers]);

  const handleCancelReservation = useCallback(() => {
    if (!reservation?.id) return;
    cancelReservation.mutate(reservation.id);
  }, [reservation, cancelReservation]);

  useEffect(() => {
    if (campaign) {
      document.title = `${campaign.name} — RaffleHub`;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", campaign.name);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", campaign.description || campaign.product_name || "Participe desta campanha de rifa no RaffleHub.");
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute("content", `${window.location.origin}/c/${campaign.slug}`);
      if (campaign.cover_image_url) {
        let ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) {
          ogImage = document.createElement("meta");
          ogImage.setAttribute("property", "og:image");
          document.head.appendChild(ogImage);
        }
        ogImage.setAttribute("content", campaign.cover_image_url);
      }
    }
  }, [campaign]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-16">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <AlertCircle className="size-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Campanha não encontrada</h1>
        <p className="text-sm text-muted-foreground">
          Esta campanha não existe, não foi publicada ou foi desativada.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Voltar
        </Button>
      </div>
    );
  }

  const revenue = potentialRevenue(campaign.total_numbers, campaign.number_price);
  const cover = campaign.cover_image_url ?? campaign.images.find((i) => i.type === "COVER")?.url;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      {cover && (
        <img
          src={cover}
          alt={campaign.name}
          className="aspect-video w-full rounded-xl border object-cover"
        />
      )}

      <div className="space-y-2">
        {campaign.status === "PAUSED" && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/15 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle className="size-4" />
            Esta campanha está temporariamente pausada.
          </div>
        )}
        {campaign.status === "FINISHED" && (
          <div className="flex items-center gap-2 rounded-lg bg-sky-500/15 px-4 py-3 text-sm text-sky-700 dark:text-sky-400">
            <AlertCircle className="size-4" />
            Esta campanha foi encerrada.
          </div>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {campaign.name}
        </h1>
        {campaign.description && (
          <p className="text-muted-foreground">{campaign.description}</p>
        )}
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Produto</p>
            <p className="font-semibold">{campaign.product_name}</p>
            {campaign.product_description && (
              <p className="text-sm text-muted-foreground">{campaign.product_description}</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Valor por número</p>
            <p className="font-display text-2xl font-bold">
              {formatMoney(campaign.number_price, campaign.currency)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total de números</p>
            <p className="font-semibold">
              {campaign.total_numbers.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Receita potencial</p>
            <p className="font-semibold">{formatMoney(revenue, campaign.currency)}</p>
          </div>
        </CardContent>
      </Card>

      {campaign.images.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Galeria</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {campaign.images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt=""
                className="aspect-square w-full rounded-lg border object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {/* Number Grid */}
      {numbersData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Escolha seus números</h2>
            <span className="text-sm text-muted-foreground">
              {selected.size} selecionado(s)
            </span>
          </div>

          <PublicProgressBar numbers={numbersData.numbers} total={numbersData.total_numbers} />

          <NumberGrid
            totalNumbers={numbersData.total_numbers}
            numberStatuses={Object.fromEntries(
              numbersData.numbers.map((n) => [n.number, n.status as NumberStatus]),
            )}
            selected={selected}
            onToggle={handleToggle}
            readOnly={campaign.status !== "PUBLISHED"}
          />

          {/* Reservation Panel */}
          {selected.size > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div>
                  <p className="font-medium">
                    {selected.size} número(s) selecionado(s)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total: {formatMoney(selected.size * campaign.number_price, campaign.currency)}
                  </p>
                </div>
                <Button onClick={handleReserve} disabled={reserveNumbers.isPending}>
                  <ShoppingCart className="size-4" /> {reserveNumbers.isPending ? "Reservando…" : "Reservar"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Active Reservation */}
          {reservation && (
            <Card className="border-amber-200 bg-amber-500/5 dark:border-amber-800">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div className="space-y-1">
                  <p className="flex items-center gap-2 font-medium">
                    <Clock className="size-4 text-amber-600" />
                    Reserva ativa
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Números: {reservation.numbers.sort((a, b) => a - b).join(", ")}
                  </p>
                  <p className={`text-xs font-medium ${countdown.isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
                    {countdown.expired
                      ? "Reserva expirada"
                      : `Expira em ${countdown.formatted}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate({ to: "/c/$slug/checkout", params: { slug } })}
                    size="sm"
                    disabled={countdown.expired}
                  >
                    <CreditCard className="size-4" /> Pagar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelReservation} disabled={cancelReservation.isPending}>
                    <X className="size-4" /> Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
