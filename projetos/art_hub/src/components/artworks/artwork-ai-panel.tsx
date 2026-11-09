import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { aiMetadataRepo } from "@/lib/repositories/ai";
import { analyzeArtworks } from "@/lib/ai/analyze-artwork.functions";
import { queryKeys } from "@/lib/query-keys";

interface Props {
  artworkId: string;
  hasImage: boolean;
  onAutoFill?: (title: string, description: string) => void;
}

const EDITABLE_FIELDS = [
  { key: "title_suggested", label: "Título sugerido", type: "text" },
  { key: "short_summary", label: "Resumo curto", type: "text" },
  { key: "description", label: "Descrição", type: "textarea" },
  { key: "theme", label: "Tema", type: "text" },
  { key: "occasion", label: "Ocasião", type: "text" },
  { key: "style", label: "Estilo artístico", type: "text" },
  { key: "illustration_type", label: "Tipo de ilustração", type: "text" },
  { key: "emotion", label: "Emoção transmitida", type: "text" },
  { key: "target_audience", label: "Público sugerido", type: "text" },
  { key: "commemorative_date", label: "Data comemorativa", type: "text" },
  { key: "suggested_category", label: "Categoria sugerida", type: "text" },
  { key: "suggested_collection", label: "Coleção sugerida", type: "text" },
  { key: "typography_type", label: "Tipo de tipografia", type: "text" },
  { key: "keywords", label: "Palavras-chave (separadas por vírgula)", type: "array" },
  { key: "tags", label: "Tags (separadas por vírgula)", type: "array" },
  { key: "predominant_colors", label: "Cores predominantes (separadas por vírgula)", type: "array" },
  { key: "objects", label: "Objetos encontrados (separados por vírgula)", type: "array" },
  { key: "decorative_elements", label: "Elementos decorativos (separados por vírgula)", type: "array" },
  { key: "compatible_products", label: "Produtos compatíveis (separados por vírgula)", type: "array" },
  { key: "has_people", label: "Possui pessoas", type: "boolean" },
  { key: "has_animals", label: "Possui animais", type: "boolean" },
] as const;

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

type FieldKey = (typeof EDITABLE_FIELDS)[number]["key"];

export function ArtworkAIPanel({ artworkId, hasImage, onAutoFill }: Props) {
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeArtworks);
  const [local, setLocal] = useState<Record<string, string>>({});
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const metaQ = useQuery({
    queryKey: queryKeys.ai.metadata(artworkId),
    queryFn: () => aiMetadataRepo.getByArtwork(artworkId),
  });

  const hasManualEdits = Object.keys(manual).length > 0;

  useEffect(() => {
    if (!metaQ.data) return;
    const m = metaQ.data;
    const next: Record<string, string> = {};
    for (const f of EDITABLE_FIELDS) {
      const v = (m as unknown as Record<string, unknown>)[f.key];
      if (f.type === "boolean") next[f.key] = String(Boolean(v));
      else if (f.type === "array") next[f.key] = Array.isArray(v) ? (v as string[]).join(", ") : "";
      else next[f.key] = (v as string | null) ?? "";
    }
    setLocal(next);
    setManual((m.manually_edited ?? {}) as Record<string, boolean>);
  }, [metaQ.data]);

  const handleAnalyze = () => {
    if (metaQ.data && hasManualEdits) {
      setConfirmOverwrite(true);
    } else {
      generateMut.mutate();
    }
  };

  const generateMut = useMutation({
    mutationFn: async () => analyze({ data: { artworkIds: [artworkId] } }),
    onSuccess: async (res) => {
      const first = res.outcomes[0];
      if (first?.ok) {
        toast.success("Análise concluída");
        qc.invalidateQueries({ queryKey: queryKeys.ai.metadata(artworkId) });
        qc.invalidateQueries({ queryKey: queryKeys.ai.history() });
        qc.invalidateQueries({ queryKey: queryKeys.ai.stats });
        if (onAutoFill) {
          const meta = await aiMetadataRepo.getByArtwork(artworkId);
          if (meta?.title_suggested || meta?.description) {
            onAutoFill(meta.title_suggested ?? "", meta.description ?? "");
          }
        }
      } else {
        toast.error(first?.error ?? "Falha na análise");
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const existingId = metaQ.data?.id;
      if (!existingId) throw new Error("Nenhum metadado para salvar.");
      const patch: Record<string, unknown> = {};
      const newManual: Record<string, boolean> = { ...manual };
      for (const f of EDITABLE_FIELDS) {
        const raw = local[f.key] ?? "";
        if (f.type === "boolean") {
          patch[f.key] = raw === "true";
        } else if (f.type === "array") {
          patch[f.key] = raw.split(",").map((s) => s.trim()).filter(Boolean);
        } else {
          patch[f.key] = raw.trim() || null;
        }
        const original = (metaQ.data as unknown as Record<string, unknown>)[f.key];
        const originalStr =
          f.type === "boolean"
            ? String(Boolean(original))
            : f.type === "array"
              ? Array.isArray(original)
                ? (original as string[]).join(", ")
                : ""
              : (original as string | null) ?? "";
        if (raw !== originalStr) newManual[f.key] = true;
      }
      patch.manually_edited = newManual;
      return aiMetadataRepo.update(existingId, patch);
    },
    onSuccess: () => {
      toast.success("Metadados atualizados");
      qc.invalidateQueries({ queryKey: queryKeys.ai.metadata(artworkId) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const clearManual = (key: FieldKey) => {
    setManual((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    toast.info("Campo será sobrescrito na próxima análise.");
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Catalogação por IA</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {metaQ.isLoading
              ? "Carregando…"
              : metaQ.isError
                ? "Erro ao carregar metadados."
                : metaQ.data?.last_generated_at
                  ? `Última análise: ${new Date(metaQ.data.last_generated_at).toLocaleString("pt-BR")}`
                  : "Ainda não analisada."}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleAnalyze}
          disabled={!hasImage || generateMut.isPending}
        >
          {generateMut.isPending ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-3.5 w-3.5" />
          )}
          {metaQ.data ? "Reanalisar" : "Analisar imagem"}
        </Button>
      </div>

      {!hasImage ? (
        <p className="text-xs text-muted-foreground">Faça upload de uma imagem para habilitar a análise.</p>
      ) : null}

      {metaQ.isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando metadados…</span>
        </div>
      ) : metaQ.isError ? (
        <div className="flex items-center justify-center gap-2 py-8 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Erro ao carregar dados da IA.</span>
        </div>
      ) : metaQ.data ? (
        <div className="space-y-3">
          {EDITABLE_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={`ai-${f.key}`} className="text-xs">
                  {f.label}
                </Label>
                {manual[f.key] ? (
                  <button
                    type="button"
                    onClick={() => clearManual(f.key)}
                    className="flex items-center gap-1 text-[10px] text-amber-600 hover:underline"
                  >
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      editado
                    </Badge>
                    <RotateCcw className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
              {f.type === "textarea" ? (
                <Textarea
                  id={`ai-${f.key}`}
                  rows={3}
                  value={local[f.key] ?? ""}
                  onChange={(e) => setLocal((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              ) : f.type === "boolean" ? (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`ai-${f.key}`}
                      checked={local[f.key] === "true"}
                      onChange={() => setLocal((p) => ({ ...p, [f.key]: "true" }))}
                    />
                    Sim
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`ai-${f.key}`}
                      checked={local[f.key] === "false"}
                      onChange={() => setLocal((p) => ({ ...p, [f.key]: "false" }))}
                    />
                    Não
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`ai-${f.key}`}
                      checked={local[f.key] !== "true" && local[f.key] !== "false"}
                      onChange={() => setLocal((p) => ({ ...p, [f.key]: "" }))}
                    />
                    Indeterminado
                  </label>
                </div>
              ) : (
                <Input
                  id={`ai-${f.key}`}
                  value={local[f.key] ?? ""}
                  onChange={(e) => setLocal((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
            >
              {saveMut.isPending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-2 h-3.5 w-3.5" />
              )}
              Salvar edições
            </Button>
          </div>
        </div>
      ) : null}

      <AlertDialog open={confirmOverwrite} onOpenChange={setConfirmOverwrite}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir edições manuais?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta arte possui campos editados manualmente. A análise substituirá os valores existentes
              pelos gerados pela IA, a menos que o selo "editado" seja removido.
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmOverwrite(false); generateMut.mutate(); }}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
