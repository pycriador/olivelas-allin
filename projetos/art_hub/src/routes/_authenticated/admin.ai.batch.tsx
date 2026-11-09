import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { artworksRepo } from "@/lib/repositories/artworks";
import { analyzeArtworks } from "@/lib/ai/analyze-artwork.functions";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/_authenticated/admin/ai/batch")({
  component: BatchPage,
});

interface BatchResult {
  artworkId: string;
  ok: boolean;
  error?: string;
}

function BatchPage() {
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeArtworks);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [skipExisting, setSkipExisting] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<BatchResult[]>([]);

  const { data: listData, isLoading: listLoading, isError: listError } = useQuery({
    queryKey: ["artworks", "batch-list", search],
    queryFn: () => artworksRepo.listAdmin({ search, pageSize: 100 }),
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const rows = listData?.rows ?? [];
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const startBatch = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setRunning(true);
    setResults([]);
    setProgress({ done: 0, total: ids.length });

    const CHUNK = 3;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      try {
        const res = await analyze({ data: { artworkIds: chunk, skipExisting } });
        setResults((prev) => [
          ...prev,
          ...res.outcomes.map((o) => ({ artworkId: o.artworkId, ok: o.ok, error: o.error })),
        ]);
      } catch (err) {
        setResults((prev) => [
          ...prev,
          ...chunk.map((id) => ({
            artworkId: id,
            ok: false,
            error: err instanceof Error ? err.message : "Erro",
          })),
        ]);
      }
      setProgress({ done: Math.min(i + CHUNK, ids.length), total: ids.length });
    }

    setRunning(false);
    qc.invalidateQueries({ queryKey: queryKeys.ai.history() });
    qc.invalidateQueries({ queryKey: queryKeys.ai.stats });
    toast.success("Processamento em lote concluído");
  };

  const rows = listData?.rows ?? [];
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Processamento em Lote"
        description="Selecione as artes que devem ser catalogadas automaticamente pela IA."
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Buscar por título ou código"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="skip"
                checked={skipExisting}
                onCheckedChange={(v) => setSkipExisting(Boolean(v))}
              />
              <label htmlFor="skip">Pular artes já analisadas</label>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selected.size === rows.length && rows.length > 0 ? "Limpar" : "Selecionar todas"}
              </Button>
              <Button onClick={startBatch} disabled={running || selected.size === 0}>
                {running ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Analisar {selected.size || ""}
              </Button>
            </div>
          </div>

          {running || progress.total ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress.done} / {progress.total}</span>
                <span>{pct}%</span>
              </div>
              <Progress value={pct} />
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2"></th>
                  <th className="px-3 py-2">Título</th>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Coleção</th>
                  <th className="px-3 py-2">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const result = results.find((x) => x.artworkId === r.id);
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selected.has(r.id)}
                          onCheckedChange={() => toggle(r.id)}
                          disabled={running}
                        />
                      </td>
                      <td className="px-3 py-2">{r.title}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{r.code ?? "—"}</td>
                      <td className="px-3 py-2 text-xs">{r.collection?.name ?? "—"}</td>
                      <td className="px-3 py-2 text-xs">
                        {result?.ok ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> OK
                          </span>
                        ) : result ? (
                          <span className="inline-flex items-center gap-1 text-destructive" title={result.error}>
                            <XCircle className="h-3.5 w-3.5" /> Falha
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!rows.length ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      Nenhuma arte encontrada.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
