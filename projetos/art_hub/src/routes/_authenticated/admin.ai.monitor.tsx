import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Activity, CheckCircle2, XCircle, Clock, Coins, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { aiHistoryRepo } from "@/lib/repositories/ai";
import { queryKeys } from "@/lib/query-keys";
import { analyzeArtworks } from "@/lib/ai/analyze-artwork.functions";

export const Route = createFileRoute("/_authenticated/admin/ai/monitor")({
  component: MonitorPage,
});

function MonitorPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: statsData, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: queryKeys.ai.stats,
    queryFn: () => aiHistoryRepo.statsLast24h(),
    refetchInterval: 15_000,
  });

  const { data: historyData, isLoading: historyLoading, isError: historyError } = useQuery({
    queryKey: queryKeys.ai.history({ page, status }),
    queryFn: () => aiHistoryRepo.list({ page, pageSize: 20, status }),
    refetchInterval: 10_000,
  });

  const queryClient = useQueryClient();
  const doReprocess = useMutation({
    mutationFn: (artworkId: string) =>
      analyzeArtworks({ data: { artworkIds: [artworkId] } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai"] });
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Monitor de Processamento"
        description="Acompanhe execuções, latência e uso de tokens da IA."
      />

      {statsError ? (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard icon={<Activity />} label="Total (24h)" value="—" />
          <StatCard icon={<CheckCircle2 className="text-emerald-600" />} label="Sucesso" value="—" />
          <StatCard icon={<Clock />} label="Latência média" value="—" />
          <StatCard icon={<Coins />} label="Tokens totais" value="—" />
        </div>
      ) : (
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<Activity />} label="Total (24h)" value={statsData?.total ?? 0} />
        <StatCard
          icon={<CheckCircle2 className="text-emerald-600" />}
          label="Sucesso"
          value={`${statsData?.ok ?? 0} (${statsData?.successRate ?? 0}%)`}
        />
        <StatCard icon={<Clock />} label="Latência média" value={`${statsData?.avgMs ?? 0} ms`} />
        <StatCard icon={<Coins />} label="Tokens totais" value={statsData?.tokens ?? 0} />
      </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <Select
              value={status ?? "all"}
              onValueChange={(v) => {
                setPage(1);
                setStatus(v === "all" ? null : v);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="error">Erros</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="queued">Na fila</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              {historyError ? "Erro ao carregar" : `${historyData?.total ?? 0} registros`}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Quando</th>
                  <th className="px-3 py-2">Arte</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Modelo</th>
                  <th className="px-3 py-2">Duração</th>
                  <th className="px-3 py-2">Tokens</th>
                  <th className="px-3 py-2">Erro</th>
                  <th className="px-3 py-2 w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historyError ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-sm text-destructive">
                      Erro ao carregar histórico.
                    </td>
                  </tr>
                ) : (historyData?.rows ?? []).map((row) => {
                  const artwork = (row as unknown as { artwork?: { title?: string; code?: string | null } }).artwork;
                  return (
                    <tr key={row.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-3 py-2">
                        {artwork?.title ?? row.artwork_id?.slice(0, 8) ?? "—"}
                        {artwork?.code ? (
                          <span className="ml-2 text-xs text-muted-foreground">{artwork.code}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-2 text-xs">{row.model ?? "—"}</td>
                      <td className="px-3 py-2 text-xs">{row.duration_ms ? `${row.duration_ms} ms` : "—"}</td>
                      <td className="px-3 py-2 text-xs">
                        {(row.tokens_prompt ?? 0) + (row.tokens_completion ?? 0) || "—"}
                      </td>
                      <td className="px-3 py-2 max-w-[240px] truncate text-xs text-destructive" title={row.error_message ?? ""}>
                        {row.error_message ?? ""}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={doReprocess.isPending || !row.artwork_id}
                          onClick={() => row.artwork_id && doReprocess.mutate(row.artwork_id)}
                          title="Reprocessar"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${doReprocess.isPending ? "animate-spin" : ""}`} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {!historyError && !historyData?.rows?.length ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      Nenhum processamento registrado ainda.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">Página {page}</span>
            <Button
              variant="outline"
              size="sm"
                disabled={!!historyData && page * 20 >= (historyData.total ?? 0)}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-lg font-medium">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    completed: { label: "Concluído", variant: "default" },
    error: { label: "Erro", variant: "destructive" },
    processing: { label: "Processando", variant: "secondary" },
    queued: { label: "Na fila", variant: "outline" },
    sending: { label: "Enviando", variant: "secondary" },
    cancelled: { label: "Cancelado", variant: "outline" },
  };
  const info = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
