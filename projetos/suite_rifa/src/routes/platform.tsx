import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTenant } from "@/hooks/useTenant";
import { PlatformService } from "@/services/organizations";
import { ORG_STATUS_LABEL, formatDate, formatDateTime } from "@/services/types";
import type { OrgStatus } from "@/services/types";

const METRIC_LABEL: Record<string, string> = {
  organizations: "Organizações",
  organizations_active: "Ativas",
  organizations_suspended: "Suspensas",
  users: "Usuários",
  plans: "Planos ativos",
  subscriptions: "Assinaturas",
  subscriptions_trialing: "Em teste",
};

const ORG_TONE: Record<OrgStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600",
  SUSPENDED: "bg-destructive/10 text-destructive",
  INACTIVE: "bg-muted text-muted-foreground",
};

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "Plataforma — RaffleHub" },
      { name: "description", content: "Administração global da plataforma RaffleHub." },
      { property: "og:title", content: "Plataforma — RaffleHub" },
      { property: "og:description", content: "Administração global da plataforma RaffleHub." },
    ],
  }),
  component: PlatformPage,
});

function PlatformPage() {
  const { isGlobalAdmin } = useTenant();

  if (!isGlobalAdmin) {
    return (
      <AppShell title="Plataforma" description="Área restrita a administradores globais.">
        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <ShieldAlert className="size-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Acesso restrito</p>
              <p className="text-sm text-muted-foreground">
                Somente administradores globais podem ver estes dados. O acesso é validado no banco de dados.
              </p>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return <PlatformAdmin />;
}

function PlatformAdmin() {
  const metricsQuery = useQuery({
    queryKey: ["platform", "metrics"],
    queryFn: () => PlatformService.metrics(),
    staleTime: 60_000,
  });
  const metrics = metricsQuery.data ?? {};

  return (
    <AppShell title="Plataforma" description="Visão global do RaffleHub.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.keys(METRIC_LABEL).map((key) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {METRIC_LABEL[key]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl">
                {metricsQuery.isPending ? "—" : metrics[key] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OrganizationsTable />
        <UsersTable />
      </div>
    </AppShell>
  );
}

function OrganizationsTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const query = useQuery({
    queryKey: ["platform", "orgs", search, page],
    queryFn: () =>
      PlatformService.listOrganizations({
        search: search.trim() || undefined,
        limit,
        offset: (page - 1) * limit,
      }),
    staleTime: 30_000,
  });
  const rows = query.data?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / limit));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organizações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar organização…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        {query.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : rows.length === 0 ? (
          <p className="rounded-lg border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
            Nenhuma organização encontrada.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organização</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Campanhas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <p className="font-medium">{o.name}</p>
                    <p className="text-xs text-muted-foreground">{o.owner_email ?? o.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={ORG_TONE[o.status]} variant="secondary">
                      {ORG_STATUS_LABEL[o.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{o.plan_name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{o.users}</TableCell>
                  <TableCell className="text-sm">{o.campaigns}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UsersTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const query = useQuery({
    queryKey: ["platform", "users", search, page],
    queryFn: () =>
      PlatformService.listUsers({
        search: search.trim() || undefined,
        limit,
        offset: (page - 1) * limit,
      }),
    staleTime: 30_000,
  });
  const rows = query.data?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / limit));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Usuários</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        {query.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : rows.length === 0 ? (
          <p className="rounded-lg border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Último acesso</TableHead>
                <TableHead>Orgs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-medium">{u.full_name ?? "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(u.created_at)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(u.last_seen_at)}</TableCell>
                  <TableCell className="text-sm">{u.organizations}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
