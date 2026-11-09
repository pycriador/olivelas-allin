import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Hash, Search, Ban, Unlock, ShoppingCart } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";

import { AppShell } from "@/components/app/AppShell";
import { PermissionGate } from "@/components/app/PermissionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCampaignNumbers,
  useCampaignNumberMetrics,
  useGenerateNumbers,
  useBlockNumbers,
  useUnblockNumbers,
} from "@/hooks/useNumbers";
import { useRealtimeNumbers } from "@/hooks/useRealtimeNumbers";
import { useCampaign } from "@/hooks/useCampaigns";
import { NumberGrid } from "@/components/numbers/NumberGrid";
import { QuickSaleDialog } from "@/components/sales/QuickSaleDialog";
import type { NumberStatus } from "@/services/types";

const PAGE_SIZE = 50;

export const Route = createFileRoute("/campaigns/$campaignId/numbers")({
  head: () => ({
    meta: [{ title: "Números — RaffleHub" }],
  }),
  component: CampaignNumbersPage,
});

function NumberProgressBar({ metrics }: { metrics: { total: number; available: number; reserved: number; sold: number; blocked: number } }) {
  const total = metrics.total || 1;
  const segments = [
    { label: "Vendidos", count: metrics.sold, color: "bg-sky-500" },
    { label: "Reservados", count: metrics.reserved, color: "bg-amber-500" },
    { label: "Bloqueados", count: metrics.blocked, color: "bg-destructive" },
    { label: "Disponíveis", count: metrics.available, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {segments.map((seg) => {
          const pct = (seg.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={seg.label}
              className={`${seg.color} transition-all duration-300`}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${seg.count}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {segments.map((seg) => (
          <span key={seg.label} className="flex items-center gap-1">
            <span className={`inline-block size-2 rounded-full ${seg.color}`} />
            {seg.label}: {seg.count.toLocaleString("pt-BR")} ({Math.round((seg.count / total) * 100)}%)
          </span>
        ))}
      </div>
    </div>
  );
}

function CampaignNumbersPage() {
  const { campaignId } = useParams({ from: "/campaigns/$campaignId/numbers" });

  const { data: campaign, isPending: loadingCampaign } = useCampaign(campaignId);
  useRealtimeNumbers(campaignId);
  const { data: metrics, isPending: loadingMetrics } = useCampaignNumberMetrics(campaignId);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
  const [quickSaleOpen, setQuickSaleOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const numberFilters = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };
  const { data: numbersData, isPending: loadingNumbers } = useCampaignNumbers(campaignId, numberFilters);

  const generateNumbers = useGenerateNumbers();
  const blockNumbers = useBlockNumbers();
  const unblockNumbers = useUnblockNumbers();

  const totalPages = numbersData ? Math.ceil(numbersData.total / PAGE_SIZE) : 0;

  const handleToggle = useCallback((n: number) => {
    setSelectedNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!numbersData?.items) return;
    const available = numbersData.items
      .filter((i) => i.status === "AVAILABLE")
      .map((i) => i.number);
    setSelectedNumbers(new Set(available));
  }, [numbersData]);

  const handleClearSelection = useCallback(() => setSelectedNumbers(new Set()), []);

  const handleBlock = useCallback(() => {
    if (selectedNumbers.size === 0) return;
    blockNumbers.mutate(
      { campaignId, numbers: Array.from(selectedNumbers) },
      { onSuccess: () => setSelectedNumbers(new Set()) },
    );
  }, [campaignId, selectedNumbers, blockNumbers]);

  const handleUnblock = useCallback(() => {
    if (selectedNumbers.size === 0) return;
    unblockNumbers.mutate(
      { campaignId, numbers: Array.from(selectedNumbers) },
      { onSuccess: () => setSelectedNumbers(new Set()) },
    );
  }, [campaignId, selectedNumbers, unblockNumbers]);

  const statusMap: Record<number, NumberStatus> = {};
  if (numbersData?.items) {
    for (const item of numbersData.items) {
      statusMap[item.number] = item.status;
    }
  }

  if (loadingCampaign) {
    return (
      <AppShell title="Números">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!campaign) {
    return (
      <AppShell title="Campanha não encontrada">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
          <p className="font-medium">Campanha não encontrada</p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/campaigns">Voltar</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Números — ${campaign.name}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/campaigns/$campaignId" params={{ campaignId }}>
              <ArrowLeft className="size-4" /> Voltar
            </Link>
          </Button>
          <PermissionGate permission="numbers.manage" silent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateNumbers.mutate(campaignId)}
              disabled={generateNumbers.isPending}
            >
              <Hash className="size-4" /> {generateNumbers.isPending ? "Gerando…" : "Gerar números"}
            </Button>
          </PermissionGate>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {loadingMetrics ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : metrics ? (
            [
              { label: "Total", value: metrics.total, color: "" },
              { label: "Disponíveis", value: metrics.available, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Vendidos", value: metrics.sold, color: "text-sky-600 dark:text-sky-400" },
              { label: "Reservados", value: metrics.reserved, color: "text-amber-600 dark:text-amber-400" },
              { label: "Bloqueados", value: metrics.blocked, color: "text-destructive" },
            ].map((m) => (
              <Card key={m.label}>
                <CardHeader className="pb-1 pt-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{m.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`font-display text-2xl font-bold ${m.color}`}>
                    {m.value.toLocaleString("pt-BR")}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : null}
        </div>

        {/* Progress Bar */}
        {metrics && <NumberProgressBar metrics={metrics} />}

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar número…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            Selecionar disponíveis
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearSelection} disabled={selectedNumbers.size === 0}>
            Limpar seleção ({selectedNumbers.size})
          </Button>
          {selectedNumbers.size > 0 && (
            <>
              <PermissionGate permission="numbers.manage" silent>
                <Button variant="destructive" size="sm" onClick={handleBlock} disabled={blockNumbers.isPending}>
                  <Ban className="size-4" /> Bloquear ({selectedNumbers.size})
                </Button>
                <Button variant="outline" size="sm" onClick={handleUnblock} disabled={unblockNumbers.isPending}>
                  <Unlock className="size-4" /> Desbloquear ({selectedNumbers.size})
                </Button>
              </PermissionGate>
              <PermissionGate permission="sales.manage" silent>
                <Button size="sm" onClick={() => setQuickSaleOpen(true)}>
                  <ShoppingCart className="size-4" /> Venda rápida ({selectedNumbers.size})
                </Button>
              </PermissionGate>
            </>
          )}
        </div>

        {/* Number Grid */}
        {loadingNumbers ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <NumberGrid
            totalNumbers={campaign.total_numbers}
            numberStatuses={statusMap}
            selected={selectedNumbers}
            onToggle={handleToggle}
          />
        )}

        {/* Pagination */}
        {numbersData && numbersData.total > PAGE_SIZE && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, numbersData.total)} de{" "}
              {numbersData.total.toLocaleString("pt-BR")}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="size-4" /> Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Próxima <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <QuickSaleDialog
        open={quickSaleOpen}
        onOpenChange={setQuickSaleOpen}
        campaignId={campaignId}
        selectedNumbers={Array.from(selectedNumbers)}
        onClearSelection={handleClearSelection}
        currency={campaign.currency}
      />
    </AppShell>
  );
}
