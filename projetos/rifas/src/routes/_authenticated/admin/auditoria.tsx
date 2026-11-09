import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Activity, ScrollText } from "lucide-react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/common/search-input";
import { ActivityTimeline } from "@/components/common/activity-timeline";
import { AuditTable } from "@/features/audit/components/audit-table";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { listAuditLogsAdminFn } from "@/lib/audit/admin.server";
import { AUDIT_ACTION_LABELS } from "@/types/audit";

export const Route = createFileRoute("/_authenticated/admin/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria — Admin — RaffleHub" },
      {
        name: "description",
        content: "Historico de logins, edicoes, exclusoes e eventos criticos do RaffleHub.",
      },
    ],
  }),
  component: AdminAuditoriaPage,
});

const PAGE_SIZE = 15;

function AdminAuditoriaPage() {
  return (
    <PermissionGuard permission="audit.view">
      <AdminAuditoriaContent />
    </PermissionGuard>
  );
}

function AdminAuditoriaContent() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<"all" | string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [search, action, from, to]);

  const query = useQuery({
    queryKey: ["admin", "audit", { page, search, action, from, to }],
    queryFn: () =>
      listAuditLogsAdminFn({
        data: {
          page,
          pageSize: PAGE_SIZE,
          search: search || undefined,
          action: action !== "all" ? action : undefined,
          from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
          to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
        },
      }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const data = query.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Rastreie eventos criticos com autor, data e valores alterados.
        </p>
      </div>

      <section aria-label="Resumo de eventos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Eventos hoje" value={String(data?.today ?? 0)} icon={Activity} />
        <StatCard title="Total filtrado" value={String(data?.total ?? 0)} icon={ScrollText} />
        <StatCard
          title="Acao em foco"
          value={
            action === "all"
              ? "Todas"
              : (AUDIT_ACTION_LABELS[action as keyof typeof AUDIT_ACTION_LABELS] ?? action)
          }
          icon={ScrollText}
        />
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Refine a busca por acao, periodo ou referencia.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por entidade ou referencia..."
            aria-label="Buscar registros de auditoria"
            className="sm:max-w-none"
          />
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger aria-label="Filtrar por acao">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as acoes</SelectItem>
              {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid gap-1.5">
            <Label htmlFor="audit-from" className="text-xs text-muted-foreground">
              De
            </Label>
            <Input
              id="audit-from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="audit-to" className="text-xs text-muted-foreground">
              Ate
            </Label>
            <Input
              id="audit-to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <AuditTable
          rows={data?.rows ?? []}
          total={data?.total ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          isLoading={query.isPending}
          isError={query.isError}
          onRetry={() => void query.refetch()}
        />

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Atividade recente</CardTitle>
            <CardDescription>Ultimos eventos registrados na plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTimeline items={data?.recent ?? []} isLoading={query.isPending} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
