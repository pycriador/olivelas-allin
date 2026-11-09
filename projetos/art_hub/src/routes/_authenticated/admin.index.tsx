import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Coffee, Database, ImageIcon, Palette, Sparkles, Activity, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StoredImage } from "@/components/common/stored-image";
import { EmptyState } from "@/components/common/empty-state";
import { collectionsRepo } from "@/lib/repositories/collections";
import { artworksRepo } from "@/lib/repositories/artworks";
import { aiHistoryRepo } from "@/lib/repositories/ai";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_BUCKETS } from "@/lib/services/storage";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

async function computeStorageUsage(): Promise<number> {
  const buckets = Object.values(STORAGE_BUCKETS);
  let total = 0;
  for (const b of buckets) {
    const { data } = await supabase.storage.from(b).list("", { limit: 1000 });
    if (!data) continue;
    for (const item of data) {
      if (item.id) {
        total += Number(item.metadata?.size ?? 0);
      } else {
        // folder - list one level deep
        const { data: sub } = await supabase.storage.from(b).list(item.name, { limit: 1000 });
        for (const s of sub ?? []) total += Number(s.metadata?.size ?? 0);
      }
    }
  }
  return total;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function Dashboard() {
  const collectionsCount = useQuery({ queryKey: queryKeys.dashboard.collectionsCount(), queryFn: () => collectionsRepo.count() });
  const artworksCount = useQuery({ queryKey: queryKeys.dashboard.artworksCount(), queryFn: () => artworksRepo.count() });
  const storage = useQuery({ queryKey: queryKeys.dashboard.storageUsage(), queryFn: computeStorageUsage, staleTime: 60_000 });
  const recentArtworks = useQuery({ queryKey: queryKeys.artworks.recent(), queryFn: () => artworksRepo.recent(5) });
  const recentCollections = useQuery({
    queryKey: queryKeys.collections.recent(),
    queryFn: () => collectionsRepo.recent(5),
  });
  const aiStats = useQuery({
    queryKey: queryKeys.ai.stats,
    queryFn: () => aiHistoryRepo.statsLast24h(),
    refetchInterval: 30_000,
  });
  const recentProcessing = useQuery({
    queryKey: queryKeys.ai.history({ page: 1 }),
    queryFn: () => aiHistoryRepo.list({ page: 1, pageSize: 5 }),
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Visão geral do catálogo Olivelas." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Coffee}
          label="Coleções"
          value={collectionsCount.data}
          loading={collectionsCount.isLoading}
        />
        <StatCard
          icon={Palette}
          label="Artes cadastradas"
          value={artworksCount.data}
          loading={artworksCount.isLoading}
        />
        <StatCard
          icon={Database}
          label="Armazenamento"
          value={storage.data !== undefined ? formatBytes(storage.data) : undefined}
          loading={storage.isLoading}
        />
        <StatCard
          icon={Activity}
          label="Processamentos IA (24h)"
          value={aiStats.data?.total ?? 0}
          loading={aiStats.isLoading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Sucesso IA"
          value={aiStats.data?.ok ?? 0}
          loading={aiStats.isLoading}
          color="text-emerald-600"
        />
        <StatCard
          icon={XCircle}
          label="Erros IA"
          value={aiStats.data?.err ?? 0}
          loading={aiStats.isLoading}
          color={(aiStats.data?.err ?? 0) > 0 ? "text-destructive" : ""}
        />
        <StatCard
          icon={Clock}
          label="Latência média"
          value={aiStats.data?.avgMs ? `${aiStats.data.avgMs} ms` : "—"}
          loading={aiStats.isLoading}
        />
        <div className="flex items-end">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/admin/ai/monitor">
              <Sparkles className="mr-2 h-3.5 w-3.5" /> Monitor IA
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Últimas artes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentArtworks.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : (recentArtworks.data ?? []).length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="Nenhuma arte cadastrada"
                action={
                  <Link to="/admin/artworks" className="text-sm font-medium text-primary hover:underline">
                    Cadastrar arte
                  </Link>
                }
              />
            ) : (
              (recentArtworks.data ?? []).map((a) => (
                <Link
                  key={a.id}
                  to="/admin/artworks/$id"
                  params={{ id: a.id }}
                  className="flex items-center gap-3 rounded-lg border border-border p-2 transition hover:bg-surface-muted"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-md bg-surface-muted">
                    <StoredImage stored={a.image_url} alt={a.title} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.collection?.name ?? "—"}
                      {a.code ? ` · #${a.code}` : ""}
                    </p>
                  </div>
                  <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimas coleções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCollections.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : (recentCollections.data ?? []).length === 0 ? (
              <EmptyState
                icon={Coffee}
                title="Nenhuma coleção criada"
                action={
                  <Link to="/admin/collections" className="text-sm font-medium text-primary hover:underline">
                    Criar coleção
                  </Link>
                }
              />
            ) : (
              (recentCollections.data ?? []).map((c) => (
                <Link
                  key={c.id}
                  to="/admin/collections/$id"
                  params={{ id: c.id }}
                  className="flex items-center gap-3 rounded-lg border border-border p-2 transition hover:bg-surface-muted"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-md bg-surface-muted">
                    <StoredImage stored={c.cover_image} alt={c.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">/{c.slug}</p>
                  </div>
                  <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Processamentos IA</CardTitle>
            <Link to="/admin/ai/monitor" className="text-xs text-primary hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProcessing.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : (recentProcessing.data?.rows ?? []).length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Nenhum processamento"
                action={
                  <Link to="/admin/artworks" className="text-sm font-medium text-primary hover:underline">
                    Ir para artes
                  </Link>
                }
              />
            ) : (
              (recentProcessing.data?.rows ?? []).map((row) => {
                const artwork = (row as unknown as { artwork?: { title?: string } }).artwork;
                return (
                  <div
                    key={row.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-2"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-muted">
                      <StatusIcon status={row.status} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{artwork?.title ?? row.artwork_id?.slice(0, 8) ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.status === "completed"
                          ? `OK · ${row.duration_ms ?? "?"} ms`
                          : row.status === "error"
                            ? row.error_message ?? "Erro"
                            : row.status}
                      </p>
                    </div>
                    <Badge variant={row.status === "completed" ? "default" : row.status === "error" ? "destructive" : "secondary"}>
                      {row.status}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed": return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    case "error": return <XCircle className="h-5 w-5 text-destructive" />;
    case "processing":
    case "sending": return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    default: return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number | string;
  loading?: boolean;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-24" />
          ) : (
            <p className={cn("mt-2 font-display text-3xl leading-none", color)}>{value ?? 0}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
