import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  FileEdit,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Share2,
  Trash2,
  Archive,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { PermissionGate } from "@/components/app/PermissionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useCampaignList, useCampaignMetrics, useSetCampaignStatus } from "@/hooks/useCampaigns";
import { usePermissions } from "@/hooks/usePermissions";
import { useCurrentUser, useTenant } from "@/hooks/useTenant";
import type { CampaignStatus } from "@/services/types";
import {
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_TONE,
  CAMPAIGN_TRANSITIONS,
  CAMPAIGN_SORT_OPTIONS,
  formatMoney,
} from "@/services/types";

const SORT_OPTIONS = [...CAMPAIGN_SORT_OPTIONS];

const METRIC_CARDS = [
  { key: "total", label: "Total" },
  { key: "published", label: "Publicadas" },
  { key: "draft", label: "Rascunhos" },
  { key: "paused", label: "Pausadas" },
  { key: "finished", label: "Finalizadas" },
] as const;

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campanhas — RaffleHub" },
      { name: "description", content: "Gerencie suas campanhas de rifa." },
    ],
  }),
  component: CampaignList,
});

function CampaignList() {
  const navigate = useNavigate();
  const { user, isPending: authPending } = useCurrentUser();
  const { organizationId, memberships, isPending: tenantPending } = useTenant();

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChildIndex = pathname !== "/campaigns";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | CampaignStatus>("");
  const [sort, setSort] = useState("created_at");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const limit = 12;

  const debouncedSearch = useDebounce(search, 400);

  const filters = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    status: (statusFilter || null) as CampaignStatus | null,
    includeArchived: false,
    sort,
    direction,
    limit,
    offset: (page - 1) * limit,
  };

  const { data, isPending, isFetching } = useCampaignList(filters);
  const { data: metrics } = useCampaignMetrics();
  const setStatus = useSetCampaignStatus();
  const permissions = usePermissions();

  const [actionTarget, setActionTarget] = useState<{ id: string; name: string; to: CampaignStatus } | null>(null);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / limit));

  useEffect(() => {
    if (!authPending && !user) void navigate({ to: "/auth", replace: true });
  }, [authPending, user, navigate]);

  useEffect(() => {
    if (!tenantPending && user && memberships.length === 0) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [tenantPending, user, memberships.length, navigate]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const confirmAction = useCallback(() => {
    if (!actionTarget) return;
    setStatus.mutate(
      { campaignId: actionTarget.id, status: actionTarget.to },
      { onSettled: () => setActionTarget(null) },
    );
  }, [actionTarget, setStatus]);

  const handleShare = useCallback((slug: string) => {
    const url = `${window.location.origin}/c/${slug}`;
    void navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }, []);

  if (isChildIndex) return <Outlet />;

  return (
    <AppShell
      title="Campanhas"
      description="Gerencie suas campanhas de rifa."
      actions={
        <PermissionGate permission="campaigns.create" silent>
          <Button asChild size="sm">
            <Link to="/campaigns/create">
              <Plus className="size-4" /> Nova campanha
            </Link>
          </Button>
        </PermissionGate>
      }
    >
      <div className="space-y-6">
        {/* Metrics Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {METRIC_CARDS.map(({ key, label }) => (
            <Card key={key}>
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-2xl font-bold">{metrics?.[key] ?? "—"}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar campanha..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as "" | CampaignStatus); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {Object.entries(CAMPAIGN_STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDirection((d) => (d === "asc" ? "desc" : "asc"))}
            title={direction === "asc" ? "Crescente" : "Decrescente"}
          >
            {direction === "asc" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
          </Button>
        </div>

        {/* Table */}
        <PermissionGate permission="campaigns.view">
          {isPending ? (
            <Skeleton className="h-64 w-full" />
          ) : !data || data.total === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
              <p className="font-medium">Você ainda não possui campanhas.</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Crie sua primeira campanha para começar.
              </p>
              <Button asChild size="sm">
                <Link to="/campaigns/create">
                  <Plus className="size-4" /> Nova campanha
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead className="hidden md:table-cell">Produto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Números</TableHead>
                    <TableHead className="hidden sm:table-cell">Preço</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link
                          to="/campaigns/$campaignId"
                          params={{ campaignId: c.id }}
                          className="font-medium hover:underline"
                        >
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden max-w-[180px] truncate md:table-cell text-muted-foreground">
                        {c.product_name}
                      </TableCell>
                      <TableCell>
                        <Badge className={CAMPAIGN_STATUS_TONE[c.status]} variant="secondary">
                          {CAMPAIGN_STATUS_LABEL[c.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell tabular-nums">
                        {c.total_numbers.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell tabular-nums">
                        {formatMoney(c.number_price, c.currency)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate({ to: "/campaigns/$campaignId", params: { campaignId: c.id } })}>
                              <FileEdit className="size-4" /> Abrir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(c.slug)}>
                              <Share2 className="size-4" /> Copiar link
                            </DropdownMenuItem>
                            {CAMPAIGN_TRANSITIONS[c.status].map((to) => {
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
                              const permissionByStatus: Record<string, string> = {
                                PUBLISHED: "campaigns.publish",
                                PAUSED: "campaigns.pause",
                                FINISHED: "campaigns.finish",
                                ARCHIVED: "campaigns.archive",
                                DRAFT: "campaigns.restore",
                              };
                              const Icon = icons[to] ?? FileEdit;
                              const needed = permissionByStatus[to] as
                                | "campaigns.publish"
                                | "campaigns.pause"
                                | "campaigns.finish"
                                | "campaigns.archive"
                                | "campaigns.restore";
                              if (!permissions.can(needed)) return null;
                              return (
                                <DropdownMenuItem
                                  key={to}
                                  onClick={() =>
                                    setActionTarget({ id: c.id, name: c.name, to })
                                  }
                                >
                                  <Icon className="size-4" /> {labels[to] ?? to}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {data && data.total > limit && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{data.total} campanha{data.total !== 1 ? "s" : ""}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="tabular-nums">
                  {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </PermissionGate>
      </div>

      <AlertDialog open={!!actionTarget} onOpenChange={(o) => { if (!o) setActionTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget && (
                <>
                  Deseja {CAMPAIGN_STATUS_LABEL[actionTarget.to].toLowerCase()} a campanha{" "}
                  <strong>{actionTarget.name}</strong>?
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

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
