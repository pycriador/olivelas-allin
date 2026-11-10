import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { format as formatSql } from "sql-formatter";
import { Play, Sparkles, Wand2, X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SqlEditor } from "@/components/sql/sql-editor";
import { ResultGrid } from "@/components/sql/result-grid";
import { explainQuery, runQuery } from "@/lib/sql/query.functions";
import { DEFAULT_ROW_LIMIT, ROW_LIMITS, type QueryOutcome } from "@/lib/sql/types";
import type { DsType } from "@/lib/datasources/types";

export const Route = createFileRoute("/_authenticated/sql-studio")({
  head: () => ({
    meta: [
      { title: "SQL Studio — consultas seguras nos seus bancos" },
      {
        name: "description",
        content:
          "Editor SQL profissional com execução somente leitura, planos de execução, histórico e exportação para CSV, XLSX e JSON.",
      },
      { property: "og:title", content: "SQL Studio — consultas seguras nos seus bancos" },
      {
        property: "og:description",
        content: "Execute consultas de leitura auditadas nos bancos conectados à plataforma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SqlStudioPage,
});

type EditorTab = { id: string; name: string; sql: string; outcome: QueryOutcome | null };

const newTab = (index: number): EditorTab => ({
  id: crypto.randomUUID(),
  name: `Consulta ${index}`,
  sql: "SELECT 1;",
  outcome: null,
});

function SqlStudioPage() {
  const run = useServerFn(runQuery);
  const explain = useServerFn(explainQuery);

  const [tabs, setTabs] = useState<EditorTab[]>([newTab(1)]);
  const [activeId, setActiveId] = useState(tabs[0]!.id);
  const [dataSourceId, setDataSourceId] = useState<string>("");
  const [limit, setLimit] = useState<number>(DEFAULT_ROW_LIMIT);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]!;

  const sources = useQuery({
    queryKey: ["sql-studio", "sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_sources")
        .select("id, name, type, environment, active")
        .eq("active", true)
        .order("name");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const history = useQuery({
    queryKey: ["sql-studio", "history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("query_history")
        .select("id, sql, status, duration_ms, row_count, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const dsType = useMemo<DsType | null>(
    () => (sources.data?.find((s) => s.id === dataSourceId)?.type as DsType | undefined) ?? null,
    [sources.data, dataSourceId],
  );

  const patchActive = (patch: Partial<EditorTab>) =>
    setTabs((prev) => prev.map((t) => (t.id === active.id ? { ...t, ...patch } : t)));

  const execute = async () => {
    if (!dataSourceId) return toast.error("Selecione uma conexão antes de executar.");
    setBusy(true);
    setPlan(null);
    try {
      const outcome = await run({ data: { dataSourceId, sql: active.sql, limit } });
      patchActive({ outcome });
      if (!outcome.ok) toast.error(outcome.message);
    } catch {
      toast.error("Não foi possível executar a consulta.");
    } finally {
      setBusy(false);
      void history.refetch();
    }
  };

  const runExplain = async () => {
    if (!dataSourceId) return toast.error("Selecione uma conexão antes de analisar o plano.");
    setBusy(true);
    try {
      const outcome = await explain({ data: { dataSourceId, sql: active.sql } });
      if (!outcome.ok) toast.error(outcome.message);
      else if (!outcome.supported) toast.info(outcome.message);
      else setPlan(outcome.text);
    } finally {
      setBusy(false);
    }
  };

  const prettify = () => {
    try {
      patchActive({
        sql: formatSql(active.sql, {
          language: dsType === "mysql" || dsType === "mariadb" ? "mysql" : dsType === "sqlite" ? "sqlite" : "postgresql",
          keywordCase: "upper",
        }),
      });
    } catch {
      toast.error("Não foi possível formatar este SQL.");
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SQL Studio</h1>
          <p className="text-sm text-muted-foreground">
            Execução somente leitura, auditada e limitada por permissões.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dataSourceId} onValueChange={setDataSourceId}>
            <SelectTrigger className="w-56" aria-label="Conexão">
              <SelectValue placeholder="Selecione a conexão" />
            </SelectTrigger>
            <SelectContent>
              {(sources.data ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} · {s.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger className="w-28" aria-label="Limite de linhas">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROW_LIMITS.map((l) => (
                <SelectItem key={l} value={String(l)}>
                  {l} linhas
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={prettify}>
            <Wand2 className="mr-2 size-4" /> Formatar
          </Button>
          <Button variant="outline" onClick={() => void runExplain()} disabled={busy}>
            <Sparkles className="mr-2 size-4" /> Explain
          </Button>
          <Button onClick={() => void execute()} disabled={busy}>
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />}
            Executar
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-1 border-b pb-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1 rounded-t-md px-3 py-1.5 text-sm ${
              tab.id === active.id ? "bg-muted font-medium" : "text-muted-foreground"
            }`}
          >
            <button type="button" onClick={() => setActiveId(tab.id)}>
              {tab.name}
            </button>
            {tabs.length > 1 && (
              <button
                type="button"
                aria-label={`Fechar ${tab.name}`}
                onClick={() => {
                  setTabs((prev) => prev.filter((t) => t.id !== tab.id));
                  if (tab.id === active.id) {
                    const next = tabs.find((t) => t.id !== tab.id);
                    if (next) setActiveId(next.id);
                  }
                }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const tab = newTab(tabs.length + 1);
            setTabs((prev) => [...prev, tab]);
            setActiveId(tab.id);
          }}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <SqlEditor
        value={active.sql}
        onChange={(sql) => patchActive({ sql })}
        dsType={dsType}
        onRun={() => void execute()}
        onFormat={prettify}
        height="260px"
      />

      <Tabs defaultValue="result">
        <TabsList>
          <TabsTrigger value="result">Resultado</TabsTrigger>
          <TabsTrigger value="plan">Plano</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="result" className="space-y-3">
          {active.outcome && !active.outcome.ok && (
            <Alert variant="destructive">
              <AlertTitle>Falha na execução ({active.outcome.kind})</AlertTitle>
              <AlertDescription>{active.outcome.message}</AlertDescription>
            </Alert>
          )}
          {active.outcome?.ok && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{active.outcome.result.rowCount} linhas</Badge>
                <Badge variant="secondary">{active.outcome.result.durationMs} ms</Badge>
                <Badge variant="outline">{active.outcome.result.dataSourceName}</Badge>
                {active.outcome.result.truncated && (
                  <Badge variant="destructive">Resultado truncado no limite</Badge>
                )}
              </div>
              <ResultGrid
                columns={active.outcome.result.columns}
                rows={active.outcome.result.rows}
                filename="sql-studio"
              />
            </>
          )}
          {!active.outcome && (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Execute uma consulta para ver os resultados aqui (Ctrl/Cmd + Enter).
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plan">
          <pre className="max-h-[460px] overflow-auto rounded-md border bg-muted p-4 text-xs">
            {plan ?? "Nenhum plano gerado ainda."}
          </pre>
        </TabsContent>

        <TabsContent value="history" className="space-y-2">
          {(history.data ?? []).map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => patchActive({ sql: h.sql })}
              className="w-full rounded-md border p-3 text-left hover:bg-accent"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={h.status === "success" ? "secondary" : "destructive"}>
                  {h.status}
                </Badge>
                <span>{h.duration_ms ?? 0} ms</span>
                <span>{h.row_count ?? 0} linhas</span>
                <span>{new Date(h.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <p className="mt-1 truncate font-mono text-xs">{h.sql}</p>
            </button>
          ))}
          {(history.data ?? []).length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Nenhuma execução registrada ainda.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}