import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronRight, Columns3, Database, KeyRound, Table2, Eye } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { DS_PUBLIC_COLUMNS } from "@/lib/datasources/ds-columns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/explorer")({
  head: () => ({
    meta: [
      { title: "Database Explorer — Navegue schemas, tabelas e colunas" },
      {
        name: "description",
        content:
          "Navegação em árvore por banco, schema, tabela e view, com colunas, chaves, índices e constraints.",
      },
      { property: "og:title", content: "Database Explorer" },
      {
        property: "og:description",
        content: "Explore a estrutura completa dos bancos conectados em uma árvore estilo DBeaver.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useTranslation();
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [schemaId, setSchemaId] = useState<string | null>(null);
  const [objectId, setObjectId] = useState<string | null>(null);

  const sources = useQuery({
    queryKey: ["data-sources"],
    queryFn: async () =>
      (await supabase.from("data_sources").select(DS_PUBLIC_COLUMNS).order("name")).data ?? [],
  });

  const schemas = useQuery({
    queryKey: ["ds-schemas", sourceId],
    enabled: !!sourceId,
    queryFn: async () =>
      (
        await supabase
          .from("ds_schemas")
          .select("id, name")
          .eq("data_source_id", sourceId!)
          .order("name")
      ).data ?? [],
  });

  const objects = useQuery({
    queryKey: ["ds-objects", schemaId],
    enabled: !!schemaId,
    queryFn: async () =>
      (
        await supabase
          .from("ds_objects")
          .select("id, name, object_type, estimated_rows, definition, description, friendly_name")
          .eq("schema_id", schemaId!)
          .order("name")
      ).data ?? [],
  });

  const details = useQuery({
    queryKey: ["ds-object-details", objectId],
    enabled: !!objectId,
    queryFn: async () => {
      const [cols, idx, cons] = await Promise.all([
        supabase
          .from("ds_columns")
          .select("*")
          .eq("object_id", objectId!)
          .order("ordinal_position"),
        supabase.from("ds_indexes").select("*").eq("object_id", objectId!).order("name"),
        supabase.from("ds_constraints").select("*").eq("object_id", objectId!).order("name"),
      ]);
      return { columns: cols.data ?? [], indexes: idx.data ?? [], constraints: cons.data ?? [] };
    },
  });

  const selectedObject = objects.data?.find((o) => o.id === objectId) ?? null;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("ds.page.explorer.title")} subtitle={t("ds.page.explorer.subtitle")} />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardContent className="p-2">
            <ScrollArea className="h-[560px] pr-2">
              {sources.isLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : sources.data?.length ? (
                <ul className="space-y-1 text-sm">
                  {sources.data.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSourceId(sourceId === s.id ? null : s.id);
                          setSchemaId(null);
                          setObjectId(null);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent",
                          sourceId === s.id && "bg-accent",
                        )}
                      >
                        <ChevronRight
                          className={cn("h-3.5 w-3.5 transition", sourceId === s.id && "rotate-90")}
                        />
                        <Database className="h-4 w-4" />
                        <span className="truncate">{s.name}</span>
                      </button>

                      {sourceId === s.id ? (
                        <ul className="ml-5 mt-1 space-y-1 border-l pl-2">
                          {schemas.data?.map((sc) => (
                            <li key={sc.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSchemaId(schemaId === sc.id ? null : sc.id);
                                  setObjectId(null);
                                }}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent",
                                  schemaId === sc.id && "bg-accent",
                                )}
                              >
                                <ChevronRight
                                  className={cn(
                                    "h-3.5 w-3.5 transition",
                                    schemaId === sc.id && "rotate-90",
                                  )}
                                />
                                <Columns3 className="h-4 w-4" />
                                <span className="truncate">{sc.name}</span>
                              </button>

                              {schemaId === sc.id ? (
                                <ul className="ml-5 mt-1 space-y-0.5 border-l pl-2">
                                  {objects.data?.map((o) => (
                                    <li key={o.id}>
                                      <button
                                        type="button"
                                        onClick={() => setObjectId(o.id)}
                                        className={cn(
                                          "flex w-full items-center gap-2 rounded-md px-2 py-1 hover:bg-accent",
                                          objectId === o.id && "bg-accent font-medium",
                                        )}
                                      >
                                        {o.object_type === "table" ? (
                                          <Table2 className="h-3.5 w-3.5" />
                                        ) : (
                                          <Eye className="h-3.5 w-3.5" />
                                        )}
                                        <span className="truncate">{o.name}</span>
                                      </button>
                                    </li>
                                  ))}
                                  {objects.data?.length === 0 ? (
                                    <li className="px-2 py-1 text-xs text-muted-foreground">
                                      {t("ds.noObjects")}
                                    </li>
                                  ) : null}
                                </ul>
                              ) : null}
                            </li>
                          ))}
                          {schemas.data?.length === 0 ? (
                            <li className="px-2 py-1 text-xs text-muted-foreground">
                              {t("ds.notSynced")}
                            </li>
                          ) : null}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Database} title={t("ds.empty.title")} />
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            {!selectedObject ? (
              <EmptyState icon={Table2} title={t("ds.selectObject")} />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    {selectedObject.friendly_name || selectedObject.name}
                  </h2>
                  <Badge variant="secondary">
                    {t(`ds.objectType.${selectedObject.object_type}`)}
                  </Badge>
                  {selectedObject.estimated_rows != null ? (
                    <Badge variant="outline">
                      ~{Number(selectedObject.estimated_rows).toLocaleString()} {t("ds.rows")}
                    </Badge>
                  ) : null}
                </div>

                <Tabs defaultValue="columns">
                  <TabsList>
                    <TabsTrigger value="columns">{t("ds.tab.columns")}</TabsTrigger>
                    <TabsTrigger value="indexes">{t("ds.tab.indexes")}</TabsTrigger>
                    <TabsTrigger value="constraints">{t("ds.tab.constraints")}</TabsTrigger>
                    {selectedObject.definition ? (
                      <TabsTrigger value="ddl">{t("ds.tab.definition")}</TabsTrigger>
                    ) : null}
                  </TabsList>

                  <TabsContent value="columns" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("ds.field.name")}</TableHead>
                          <TableHead>{t("ds.field.dataType")}</TableHead>
                          <TableHead>{t("ds.field.nullable")}</TableHead>
                          <TableHead>{t("ds.field.keys")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.data?.columns.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-muted-foreground">{c.data_type}</TableCell>
                            <TableCell>{c.is_nullable ? "NULL" : "NOT NULL"}</TableCell>
                            <TableCell className="flex flex-wrap gap-1">
                              {c.is_primary_key ? (
                                <Badge variant="secondary">
                                  <KeyRound className="mr-1 h-3 w-3" />
                                  PK
                                </Badge>
                              ) : null}
                              {c.is_foreign_key ? (
                                <Badge variant="outline">
                                  FK → {c.references_table}.{c.references_column}
                                </Badge>
                              ) : null}
                              {c.is_unique ? <Badge variant="outline">UNIQUE</Badge> : null}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="indexes" className="mt-4 space-y-2 text-sm">
                    {details.data?.indexes.length ? (
                      details.data.indexes.map((i) => (
                        <div key={i.id} className="rounded-md border p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{i.name}</span>
                            {i.is_primary ? <Badge variant="secondary">PRIMARY</Badge> : null}
                            {i.is_unique ? <Badge variant="outline">UNIQUE</Badge> : null}
                            {i.method ? <Badge variant="outline">{i.method}</Badge> : null}
                          </div>
                          <p className="mt-1 text-muted-foreground">{i.columns.join(", ")}</p>
                        </div>
                      ))
                    ) : (
                      <EmptyState message={t("ds.none")} />
                    )}
                  </TabsContent>

                  <TabsContent value="constraints" className="mt-4 space-y-2 text-sm">
                    {details.data?.constraints.length ? (
                      details.data.constraints.map((c) => (
                        <div key={c.id} className="rounded-md border p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{c.name}</span>
                            <Badge variant="secondary">{c.constraint_type}</Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            {c.columns.join(", ")}
                            {c.referenced_table
                              ? ` → ${c.referenced_schema}.${c.referenced_table}`
                              : ""}
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyState message={t("ds.none")} />
                    )}
                  </TabsContent>

                  {selectedObject.definition ? (
                    <TabsContent value="ddl" className="mt-4">
                      <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                        {selectedObject.definition}
                      </pre>
                    </TabsContent>
                  ) : null}
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
