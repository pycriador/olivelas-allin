import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Megaphone, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/status-states";
import { useAuth } from "@/contexts/auth-context";
import {
  useCampaignMetrics,
  useCampaigns,
  useSetCampaignFeatured,
} from "@/features/campaigns/hooks/use-campaigns";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_VISIBILITY_LABELS,
  type CampaignStatus,
  type CampaignVisibility,
} from "@/types/campaign";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/campanhas")({
  head: () => ({
    meta: [{ title: "Campanhas — Admin — RaffleHub" }],
  }),
  component: AdminCampanhasPage,
});

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "Todos status" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "SCHEDULED", label: "Agendada" },
  { value: "ACTIVE", label: "Ativa" },
  { value: "PAUSED", label: "Pausada" },
  { value: "FINISHED", label: "Finalizada" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "ARCHIVED", label: "Arquivada" },
];

function AdminCampanhasPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { isGlobalAdmin } = useAuth();
  const setFeatured = useSetCampaignFeatured();

  const metrics = useCampaignMetrics();
  const filters = useMemo(
    () => ({
      status: status as CampaignStatus | "ALL",
      ...(search ? { search } : {}),
    }),
    [status, search],
  );

  const query = useCampaigns({ page, pageSize: PAGE_SIZE, filters });

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE));
  const items = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campanhas</h1>
        <p className="text-sm text-muted-foreground">Gestao de todas as campanhas da plataforma.</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold tabular-nums">{metrics.data?.total ?? 0}</p>
            </div>
            <Megaphone className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">Ativas</p>
              <p className="text-xl font-bold tabular-nums text-emerald-600">
                {metrics.data?.active ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">Finalizadas</p>
              <p className="text-xl font-bold tabular-nums">{metrics.data?.finished ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">Rascunhos</p>
              <p className="text-xl font-bold tabular-nums">{metrics.data?.drafts ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por titulo..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {query.data?.total ?? 0} campanha(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {query.isPending ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="py-12">
              <ErrorState onRetry={() => query.refetch()} />
            </div>
          ) : items.length === 0 ? (
            <div className="py-16">
              <EmptyState
                title="Nenhuma campanha encontrada"
                description="Ajuste os filtros ou crie uma nova campanha."
              />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Titulo
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground md:table-cell">
                    Criador
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">
                    Status
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground lg:table-cell">
                    Visibilidade
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground xl:table-cell">
                    Criada em
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((campaign) => (
                  <tr key={campaign.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="min-w-0 px-4 py-2.5">
                      <p className="break-words text-sm font-medium">{campaign.title}</p>
                      <p className="break-all text-xs text-muted-foreground">{campaign.slug}</p>
                    </td>
                    <td className="hidden px-4 py-2.5 text-sm md:table-cell">
                      {campaign.creator_name ?? "—"}
                      {campaign.creator_email ? (
                        <p className="text-xs text-muted-foreground">{campaign.creator_email}</p>
                      ) : null}
                    </td>
                    <td className="hidden px-4 py-2.5 sm:table-cell">
                      <Badge
                        variant={
                          campaign.status === "ACTIVE"
                            ? "default"
                            : campaign.status === "FINISHED"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-2.5 text-sm text-muted-foreground lg:table-cell">
                      {CAMPAIGN_VISIBILITY_LABELS[campaign.visibility] ?? campaign.visibility}
                    </td>
                    <td className="hidden px-4 py-2.5 text-sm text-muted-foreground xl:table-cell">
                      {formatDateTime(campaign.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isGlobalAdmin ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={setFeatured.isPending}
                          onClick={() => {
                            setFeatured.mutate(
                              { campaignId: campaign.id, featured: !campaign.is_featured },
                              {
                                onSuccess: () => {
                                  toast.success(
                                    campaign.is_featured
                                      ? "Campanha removida da pagina inicial"
                                      : "Campanha fixada na pagina inicial",
                                  );
                                },
                                onError: (error) => {
                                  toast.error(error.message ?? "Falha ao atualizar campanha fixa");
                                },
                              },
                            );
                          }}
                        >
                          {campaign.is_featured ? (
                            <>
                              <Pin className="size-4" /> Fixada
                            </>
                          ) : (
                            <>
                              <PinOff className="size-4" /> Fixar
                            </>
                          )}
                        </Button>
                      ) : null}
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/campanhas/$campanhaId" params={{ campanhaId: campaign.id }}>
                          <Eye className="size-4" /> Ver
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {query.data?.total ? (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Mostrando {items.length} de {query.data.total} — pagina {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Proxima
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
