import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, History, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { importStore, type ImportItem } from "@/lib/upload/import-store";
import { artworksRepo } from "@/lib/repositories/artworks";
import { aiHistoryRepo } from "@/lib/repositories/ai";
import { toast } from "sonner";

interface Props {
  item: ImportItem | null;
  onClose: () => void;
}

export function ImageDetailsDrawer({ item, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const artworkId = item?.artworkId;

  const artworkQ = useQuery({
    queryKey: ["artwork-detail-drawer", artworkId],
    queryFn: () => artworksRepo.getById(artworkId!),
    enabled: !!artworkId,
  });

  const aiHistoryQ = useQuery({
    queryKey: ["ai-history-drawer", artworkId],
    queryFn: () => aiHistoryRepo.list({ artworkId: artworkId!, pageSize: 5 }),
    enabled: !!artworkId,
  });

  const artwork = artworkQ.data;
  const aiRecord = aiHistoryQ.data?.rows?.[0];

  useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setCode(item.code ?? "");
    setDescription("");
  }, [item]);

  const save = async () => {
    if (!item) return;
    importStore.updateItem(item.id, { title, code });
    if (item.artworkId) {
      try {
        await artworksRepo.update(item.artworkId, { title, code, description });
        toast.success("Detalhes salvos");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao salvar");
      }
    }
  };

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {item ? (
          <>
            <SheetHeader className="pb-5">
              <SheetTitle>{item.title || "Sem título"}</SheetTitle>
              <SheetDescription>
                {item.code ? `#${item.code}` : "Sem código"}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              <div className="overflow-hidden rounded-xl bg-muted shadow-sm">
                <img src={item.previewUrl} alt={item.title} className="w-full object-cover" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">{item.status}</Badge>
                {item.artworkId ? <Badge variant="default">Salva no catálogo</Badge> : null}
                {artworkQ.isLoading ? <Skeleton className="h-5 w-24" /> : null}
              </div>

              <div className="space-y-4">
                <Field label="Título">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>
                <Field label="Código">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} />
                </Field>
                <Field label="Slug">
                  <Input
                    value={(artwork as unknown as Record<string, string>)?.slug ?? ""}
                    disabled
                    className="text-muted-foreground"
                  />
                </Field>
                <Field label="Descrição">
                  <Textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Adicionar descrição..."
                  />
                </Field>
                {artwork ? (
                  <>
                    <Field label="Coleção">
                      <Input value={(artwork as unknown as { collection?: { name?: string } })?.collection?.name ?? "—"} disabled className="text-muted-foreground" />
                    </Field>
                    <Field label="Categoria">
                      <Input value={(artwork as unknown as Record<string, string | null>)?.category ?? "—"} disabled className="text-muted-foreground" />
                    </Field>
                  </>
                ) : null}
              </div>

              {aiRecord ? (
                <>
                  <Separator />
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <History className="h-4 w-4 text-muted-foreground" />
                      Último processamento IA
                    </h4>
                    <div className="space-y-2 rounded-lg border border-border/60 bg-surface/40 p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={aiRecord.status === "completed" ? "default" : "destructive"} className="text-[10px]">
                          {aiRecord.status}
                        </Badge>
                      </div>
                      {aiRecord.model ? (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Modelo</span>
                          <span className="font-mono text-xs">{aiRecord.model}</span>
                        </div>
                      ) : null}
                      {aiRecord.duration_ms ? (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duração</span>
                          <span>{aiRecord.duration_ms} ms</span>
                        </div>
                      ) : null}
                      {aiRecord.error_message ? (
                        <p className="text-xs text-destructive">{aiRecord.error_message}</p>
                      ) : null}
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(aiRecord.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </>
              ) : artworkId ? (
                aiHistoryQ.isLoading ? (
                  <Skeleton className="h-24 w-full rounded-lg" />
                ) : null
              ) : null}

              {item.error ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  {item.error}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 pt-2">
                <Button className="w-full" onClick={save}>
                  Salvar alterações
                </Button>
                {item.artworkId ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => importStore.reprocessAI([item.id])}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Reprocessar IA
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
