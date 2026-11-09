import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/common/image-uploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STORAGE_BUCKETS } from "@/lib/services/storage";
import { settingsRepo } from "@/lib/repositories/settings";
import { collectionsRepo } from "@/lib/repositories/collections";
import { useSettings } from "@/hooks/use-settings";
import { queryKeys } from "@/lib/query-keys";

const schema = z.object({
  company_name: z.string().min(1, "Nome obrigatório"),
  whatsapp_number: z.string().min(8, "Informe um número válido").regex(/[\d+\s-()]+/),
  whatsapp_message: z.string().min(5, "Mensagem muito curta"),
  logo_url: z.string().nullable().optional(),
  home_title: z.string().optional(),
  home_tagline: z.string().optional(),
  home_subtitle: z.string().optional(),
  home_collection_id: z.string().nullable().optional(),
});

type Values = z.infer<typeof schema>;

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useSettings();
  const collections = useQuery({
    queryKey: ["collections-settings-select"],
    queryFn: async () => {
      const result = await collectionsRepo.listPublic();
      return result;
    },
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      company_name: "",
      whatsapp_number: "",
      whatsapp_message:
        "Olá! Tenho interesse na arte {{title}} (código {{code}}) da coleção {{collection}}. Link: {{url}}",
      logo_url: null,
      home_title: "Canecas - Olivelas",
      home_tagline: "arte que veste sua caneca.",
      home_subtitle:
        "Um catálogo curado de ilustrações e estampas. Escolha a arte perfeita, envie o código pelo WhatsApp e a gente cuida do resto.",
      home_collection_id: null,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings.company_name ?? "Olivelas",
        whatsapp_number: settings.whatsapp_number ?? "",
        whatsapp_message: settings.whatsapp_message ?? "",
        logo_url: settings.logo_url ?? null,
        home_title: settings.home_title ?? "Canecas - Olivelas",
        home_tagline: settings.home_tagline ?? "arte que veste sua caneca.",
        home_subtitle:
          settings.home_subtitle ??
          "Um catálogo curado de ilustrações e estampas. Escolha a arte perfeita, envie o código pelo WhatsApp e a gente cuida do resto.",
        home_collection_id: settings.home_collection_id ?? null,
      });
    }
  }, [settings, form]);

  const mut = useMutation({
    mutationFn: (v: Values) => settingsRepo.upsert(v),
    onSuccess: () => {
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: queryKeys.settings.root });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="Ajustes globais do catálogo." />

      <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da empresa</Label>
              <Input id="company_name" disabled={isLoading} {...form.register("company_name")} />
            </div>
            <ImageUploader
              label="Logo"
              value={form.watch("logo_url")}
              onChange={(v) => form.setValue("logo_url", v, { shouldDirty: true })}
              bucket={STORAGE_BUCKETS.branding}
              prefix="logo"
              aspect="wide"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">WhatsApp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">Número (com DDI)</Label>
              <Input
                id="whatsapp_number"
                placeholder="+55 11 91234-5678"
                disabled={isLoading}
                {...form.register("whatsapp_number")}
              />
              {form.formState.errors.whatsapp_number ? (
                <p className="text-xs text-destructive">{form.formState.errors.whatsapp_number.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp_message">Mensagem padrão</Label>
              <Textarea id="whatsapp_message" rows={5} disabled={isLoading} {...form.register("whatsapp_message")} />
              <p className="text-xs text-muted-foreground">
                Variáveis disponíveis:{" "}
                <code className="rounded bg-muted px-1">{"{{title}}"}</code>{" "}
                <code className="rounded bg-muted px-1">{"{{collection}}"}</code>{" "}
                <code className="rounded bg-muted px-1">{"{{code}}"}</code>{" "}
                <code className="rounded bg-muted px-1">{"{{url}}"}</code>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Página inicial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="home_title">Título (primeira linha)</Label>
                <Input id="home_title" disabled={isLoading} {...form.register("home_title")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="home_tagline">Tagline (segunda linha)</Label>
                <Input id="home_tagline" disabled={isLoading} {...form.register("home_tagline")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="home_subtitle">Subtítulo</Label>
              <Textarea id="home_subtitle" rows={3} disabled={isLoading} {...form.register("home_subtitle")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home_collection_id">Coleção em destaque</Label>
              <Select
                value={form.watch("home_collection_id") ?? "__none__"}
                onValueChange={(v) => form.setValue("home_collection_id", v === "__none__" ? null : v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma (mostra grid)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {(collections.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Se definida, a imagem de capa (square) da coleção aparece no hero ao lado do texto.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Button type="submit" disabled={mut.isPending || isLoading}>
            {mut.isPending ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
