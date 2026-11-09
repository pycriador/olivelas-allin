import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app/AppShell";
import { PermissionGate } from "@/components/app/PermissionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTenant } from "@/hooks/useTenant";
import { AuditService } from "@/services/organizations";
import { AUDIT_ACTION_LABEL, describeAuditAction, formatDateTime } from "@/services/types";
import { EmptyState } from "@/components/app/PermissionGate";

export const Route = createFileRoute("/settings/audit")({
  head: () => ({
    meta: [
      { title: "Auditoria — RaffleHub" },
      { name: "description", content: "Histórico de eventos críticos da organização." },
      { property: "og:title", content: "Auditoria — RaffleHub" },
      { property: "og:description", content: "Histórico de eventos críticos da organização." },
    ],
  }),
  component: AuditPage,
});

const ACTION_OPTIONS = Object.keys(AUDIT_ACTION_LABEL);

function AuditPage() {
  const { organizationId } = useTenant();
  const orgId = organizationId as string;
  const [action, setAction] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;

  const [rows, setRows] = useState<{ total: number; rows: import("@/services/types").AuditLogRow[] } | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [action, search]);

  useEffect(() => {
    let cancelled = false;
    setPending(true);
    const timer = setTimeout(async () => {
      try {
        const data = await AuditService.list(orgId, {
          action: action === "ALL" ? null : action,
          actor: search.trim() || null,
          limit,
          offset: (page - 1) * limit,
        });
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) setRows({ total: 0, rows: [] });
      } finally {
        if (!cancelled) setPending(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orgId, action, search, page, limit]);

  const totalPages = Math.max(1, Math.ceil((rows?.total ?? 0) / limit));

  return (
    <AppShell title="Auditoria" description="Eventos registrados automaticamente pelo banco de dados.">
      <PermissionGate permission="audit.view">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trilha de auditoria</CardTitle>
            <CardDescription>
              {rows?.total ?? 0} {rows?.total === 1 ? "evento registrado" : "eventos registrados"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por responsável…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs pl-9"
                />
              </div>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as ações</SelectItem>
                  {ACTION_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {AUDIT_ACTION_LABEL[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(action !== "ALL" || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAction("ALL");
                    setSearch("");
                  }}
                >
                  <X className="size-4" /> Limpar filtros
                </Button>
              )}
            </div>

            {pending ? (
              <Skeleton className="h-48 w-full" />
            ) : rows && rows.rows.length === 0 ? (
              <EmptyState
                title="Nenhum evento encontrado"
                description="Os eventos de segurança e gestão aparecerão aqui assim que forem registrados."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quando</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows?.rows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {formatDateTime(r.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{describeAuditAction(r.action)}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="font-medium">{r.actor_name ?? "Sistema"}</span>
                            {r.actor_email && (
                              <span className="block text-xs text-muted-foreground">{r.actor_email}</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-md">
                            <pre className="max-h-24 overflow-auto whitespace-pre-wrap rounded-md bg-muted px-3 py-2 text-xs">
                              {formatMetadata(r.metadata)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Página {page} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </PermissionGate>
    </AppShell>
  );
}

function formatMetadata(metadata: Record<string, unknown> | null | undefined): string {
  if (!metadata || Object.keys(metadata).length === 0) return "—";
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return String(metadata);
  }
}