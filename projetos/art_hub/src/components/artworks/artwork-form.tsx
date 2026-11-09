import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/common/image-uploader";
import { STORAGE_BUCKETS } from "@/lib/services/storage";
import { artworksRepo, type ArtworkRow } from "@/lib/repositories/artworks";
import { collectionsRepo } from "@/lib/repositories/collections";
import { aiSettingsRepo } from "@/lib/repositories/ai";
import { analyzeArtworks } from "@/lib/ai/analyze-artwork.functions";
import { queryKeys } from "@/lib/query-keys";

const schema = z.object({
  title: z.string().min(2, "Informe um título"),
  code: z.string().optional().nullable(),
  collection_id: z.string().uuid("Selecione uma coleção"),
  description: z.string().optional().nullable(),
  image_url: z.string().nullable().optional(),
  status: z.enum(["active", "inactive", "draft"]),
});

export type ArtworkFormValues = z.infer<typeof schema>;

interface Props {
  initial?: ArtworkRow;
  defaultCollectionId?: string;
}

export interface ArtworkFormHandle {
  setValue: (field: "title" | "description", value: string) => void;
}

export const ArtworkForm = forwardRef<ArtworkFormHandle, Props>(function ArtworkForm({ initial, defaultCollectionId }, ref) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const collections = useQuery({
    queryKey: ["collections-all-select"],
    queryFn: () => collectionsRepo.listAdmin({ pageSize: 200, sort: "name", direction: "asc" }),
  });

  const form = useForm<ArtworkFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      code: initial?.code ?? "",
      collection_id: initial?.collection_id ?? defaultCollectionId ?? "",
      description: initial?.description ?? "",
      image_url: initial?.image_url ?? null,
      status: (initial?.status ?? "active") as "active" | "inactive" | "draft",
    },
  });

  useEffect(() => {
    if (!initial && defaultCollectionId) form.setValue("collection_id", defaultCollectionId);
  }, [defaultCollectionId, form, initial]);

  const analyze = useServerFn(analyzeArtworks);
  const aiSettingsQ = useQuery({ queryKey: queryKeys.ai.settings, queryFn: () => aiSettingsRepo.get() });

  useImperativeHandle(ref, () => ({
    setValue: (field, value) => form.setValue(field, value, { shouldDirty: true }),
  }));

  const mut = useMutation({
    mutationFn: async (values: ArtworkFormValues) => {
      if (initial) return artworksRepo.update(initial.id, values);
      return artworksRepo.create({
        ...values,
        code: values.code || null,
      });
    },
    onSuccess: async (row) => {
      toast.success(initial ? "Arte atualizada" : "Arte cadastrada");
      qc.invalidateQueries({ queryKey: queryKeys.artworks.all });
      // Auto-process on upload when enabled and image is present.
      if (
        !initial &&
        row.image_url &&
        aiSettingsQ.data?.enabled &&
        aiSettingsQ.data?.auto_process_on_upload
      ) {
        toast.info("Iniciando análise por IA…");
        analyze({ data: { artworkIds: [row.id] } })
          .then((res) => {
            const ok = res.outcomes[0]?.ok;
            toast[ok ? "success" : "error"](ok ? "IA concluída" : res.outcomes[0]?.error ?? "Falha na IA");
          })
          .catch((e) => toast.error(e instanceof Error ? e.message : "Erro na IA"));
      }
      if (!initial) navigate({ to: "/admin/artworks/$id", params: { id: row.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  return (
    <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <ImageUploader
          label="Imagem da arte"
          value={form.watch("image_url")}
          onChange={(v) => form.setValue("image_url", v, { shouldDirty: true })}
          bucket={STORAGE_BUCKETS.artworks}
          prefix="items"
          aspect="square"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title ? (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input id="code" placeholder="Ex: ART-001" {...form.register("code")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Coleção</Label>
          <Select
            value={form.watch("collection_id")}
            onValueChange={(v) => form.setValue("collection_id", v, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma coleção" />
            </SelectTrigger>
            <SelectContent>
              {(collections.data?.rows ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.collection_id ? (
            <p className="text-xs text-destructive">{form.formState.errors.collection_id.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" rows={4} {...form.register("description")} />
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as "active" | "inactive" | "draft")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={mut.isPending}>
            {mut.isPending ? "Salvando…" : "Salvar"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/artworks" })}>
            Cancelar
          </Button>
        </div>
      </aside>
    </form>
  );
});
