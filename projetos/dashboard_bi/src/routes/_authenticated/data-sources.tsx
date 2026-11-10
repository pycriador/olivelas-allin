import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Database,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  PlugZap,
  Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { DsHealthBadge } from "@/components/data/ds-health-badge";
import { DsFormDialog } from "@/components/data/ds-form-dialog";
import { supabase } from "@/integrations/supabase/client";
import { DS_PUBLIC_COLUMNS } from "@/lib/datasources/ds-columns";
import { engineSpec } from "@/lib/datasources/registry";
import {
  deleteDataSource,
  seedDemoDataSource,
  syncDataSource,
  testConnection,
} from "@/lib/datasources/datasources.functions";
import { usePermissions } from "@/hooks/use-permissions";
import type { Database as Db } from "@/integrations/supabase/types";

// Credential columns are never readable by the browser.
type Row = Omit<
  Db["public"]["Tables"]["data_sources"]["Row"],
  "secret_ciphertext" | "ssl_ca_certificate" | "ssl_client_certificate" | "ssl_client_key"
>;

export const Route = createFileRoute("/_authenticated/data-sources")({
  head: () => ({
    meta: [
      { title: "Data Sources — Conexões de banco de dados" },
      {
        name: "description",
        content:
          "Gerencie conexões PostgreSQL, MySQL, MariaDB e SQLite, com teste de conexão, health check e sincronização de metadados.",
      },
      { property: "og:title", content: "Data Sources — Conexões de banco de dados" },
      {
        property: "og:description",
        content: "Connection manager corporativo com credenciais criptografadas e health check.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { can, isAdmin, hasAnyRole } = usePermissions();
  const canManage = isAdmin || hasAnyRole(["dba"]) || can("datasources.manage");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [term, setTerm] = useState("");

  const sync = useServerFn(syncDataSource);
  const test = useServerFn(testConnection);
  const remove = useServerFn(deleteDataSource);
  const seed = useServerFn(seedDemoDataSource);

  const { data, isLoading } = useQuery({
    queryKey: ["data-sources"],
    queryFn: async () =>
      (
        await supabase
          .from("data_sources")
          .select(DS_PUBLIC_COLUMNS)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["data-sources"] });
    void qc.invalidateQueries({ queryKey: ["ds-catalog"] });
  };

  const doSync = useMutation({
    mutationFn: (id: string) => sync({ data: { id } }),
    onSuccess: (r) => {
      if (r.ok) toast.success(t("ds.toast.synced", { tables: r.tableCount, views: r.viewCount }));
      else toast.error(r.message);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const doTest = useMutation({
    mutationFn: (id: string) => test({ data: { dataSourceId: id } }),
    onSuccess: (r) => {
      if (r.ok) toast.success(`${r.serverVersion} · ${r.latencyMs}ms`);
      else toast.error(r.message);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const doRemove = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success(t("ds.toast.deleted"));
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const doSeed = useMutation({
    mutationFn: () => seed({}),
    onSuccess: (r) => {
      toast.success(t("ds.toast.synced", { tables: r.tableCount, views: r.viewCount }));
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = (data ?? []).filter((d) =>
    term ? `${d.name} ${d.host ?? ""} ${d.type}`.toLowerCase().includes(term.toLowerCase()) : true,
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={t("ds.page.sources.title")}
        subtitle={t("ds.page.sources.subtitle")}
        actions={
          canManage ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => doSeed.mutate()} disabled={doSeed.isPending}>
                {doSeed.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {t("ds.action.seedDemo")}
              </Button>
              <Button
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                {t("ds.action.new")}
              </Button>
            </div>
          ) : null
        }
      />

      <div className="mb-4 flex gap-2">
        <Input
          placeholder={t("ds.searchSources")}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Database}
          title={t("ds.empty.title")}
          description={t("ds.empty.description")}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((d) => {
            const spec = engineSpec(d.type);
            return (
              <Card key={d.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: spec.accent }}
                        />
                        <h3 className="truncate font-semibold">{d.name}</h3>
                        <Badge variant="secondary">{spec.label}</Badge>
                        <Badge variant="outline">{t(`ds.env.${d.environment}`)}</Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {d.host ?? "—"}
                        {d.port ? `:${d.port}` : ""} {d.database_name ? `/ ${d.database_name}` : ""}
                      </p>
                    </div>
                    <DsHealthBadge health={d.health} />
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    {[
                      ["ds.stat.schemas", d.schema_count],
                      ["ds.stat.tables", d.table_count],
                      ["ds.stat.views", d.view_count],
                      ["ds.stat.columns", d.column_count],
                    ].map(([k, v]) => (
                      <div key={String(k)} className="rounded-md bg-muted/50 p-2">
                        <div className="text-base font-semibold">{Number(v)}</div>
                        <div className="text-muted-foreground">{t(String(k))}</div>
                      </div>
                    ))}
                  </div>

                  {d.health_message ? (
                    <p className="mt-3 line-clamp-2 text-xs text-destructive">{d.health_message}</p>
                  ) : null}

                  {canManage ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={doTest.isPending}
                        onClick={() => doTest.mutate(d.id)}
                      >
                        <PlugZap className="h-4 w-4" />
                        {t("ds.action.test")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={doSync.isPending}
                        onClick={() => doSync.mutate(d.id)}
                      >
                        {doSync.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        {t("ds.action.sync")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(d);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        {t("common.edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => doRemove.mutate(d.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("common.delete")}
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DsFormDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}
