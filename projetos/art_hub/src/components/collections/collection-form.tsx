import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/common/image-uploader";
import { STORAGE_BUCKETS } from "@/lib/services/storage";
import { collectionsRepo, type CollectionRow } from "@/lib/repositories/collections";
import { queryKeys } from "@/lib/query-keys";
import { slugify } from "@/lib/services/slug";

const schema = z.object({
  name: z.string().min(2, "Informe um nome"),
  slug: z.string().min(2, "Slug obrigatório").regex(/^[a-z0-9-]+$/, "Somente letras minúsculas, números e hifens"),
  description: z.string().optional().nullable(),
  cover_image: z.string().nullable().optional(),
  banner_image: z.string().nullable().optional(),
  display_order: z.coerce.number().int().min(0),
  status: z.enum(["active", "inactive", "draft"]),
});

export type CollectionFormValues = z.infer<typeof schema>;

interface Props {
  initial?: CollectionRow;
}

export function CollectionForm({ initial }: Props) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      cover_image: initial?.cover_image ?? null,
      banner_image: initial?.banner_image ?? null,
      display_order: initial?.display_order ?? 0,
      status: (initial?.status ?? "active") as "active" | "inactive" | "draft",
    },
  });

  const name = form.watch("name");
  useEffect(() => {
    if (!initial && name && !form.getValues("slug")) {
      form.setValue("slug", slugify(name));
    }
  }, [name, initial, form]);

  const mut = useMutation({
    mutationFn: async (values: CollectionFormValues) => {
      if (initial) return collectionsRepo.update(initial.id, values);
      return collectionsRepo.create(values);
    },
    onSuccess: (row) => {
      toast.success(initial ? "Coleção atualizada" : "Coleção criada");
      qc.invalidateQueries({ queryKey: queryKeys.collections.all });
      if (!initial) navigate({ to: "/admin/collections/$id", params: { id: row.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  return (
    <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...form.register("slug")} />
          {form.formState.errors.slug ? (
            <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">URL pública: /collections/{form.watch("slug")}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" rows={4} {...form.register("description")} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <ImageUploader
              label="Capa"
              value={form.watch("cover_image")}
              onChange={(v) => form.setValue("cover_image", v, { shouldDirty: true })}
              bucket={STORAGE_BUCKETS.collections}
              prefix="covers"
              aspect="square"
            />
          </div>
          <div>
            <ImageUploader
              label="Banner (widescreen)"
              value={form.watch("banner_image")}
              onChange={(v) => form.setValue("banner_image", v, { shouldDirty: true })}
              bucket={STORAGE_BUCKETS.collections}
              prefix="banners"
              aspect="wide"
            />
          </div>
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
            <div className="space-y-2">
              <Label htmlFor="display_order">Ordem de exibição</Label>
              <Input id="display_order" type="number" min={0} {...form.register("display_order")} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
              <div>
                <p className="text-sm font-medium">Publicar</p>
                <p className="text-xs text-muted-foreground">Torna a coleção visível ao público.</p>
              </div>
              <Switch
                checked={form.watch("status") === "active"}
                onCheckedChange={(c) => form.setValue("status", c ? "active" : "draft")}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={mut.isPending}>
            {mut.isPending ? "Salvando…" : "Salvar"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/collections" })}>
            Cancelar
          </Button>
        </div>
      </aside>
    </form>
  );
}
