import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/app/AppShell";
import { PermissionGate } from "@/components/app/PermissionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCampaign, useUpdateCampaign } from "@/hooks/useCampaigns";
import type { CampaignInput } from "@/services/campaigns";
import { useCurrentUser, useTenant } from "@/hooks/useTenant";
import { slugify, CAMPAIGN_STATUS_LABEL, CAMPAIGN_STATUS_TONE } from "@/services/types";

const schema = z.object({
  name: z.string().min(3, "Mínimo de 3 caracteres").max(120, "Máximo de 120 caracteres"),
  slug: z.string().min(3, "Mínimo de 3 caracteres").regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Apenas letras minúsculas, números e hífens"),
  product_name: z.string().min(2, "Informe o nome do produto"),
  product_description: z.string().optional(),
  description: z.string().optional(),
  total_numbers: z.coerce.number({ invalid_type_error: "Informe um número válido" }).int("Deve ser um número inteiro").min(1, "Mínimo de 1 número"),
  number_price: z.coerce.number({ invalid_type_error: "Informe um valor válido" }).min(0.01, "Valor mínimo de R$ 0,01"),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
}).refine(
  (data) => {
    if (data.start_at && data.end_at) return new Date(data.end_at) > new Date(data.start_at);
    return true;
  },
  { message: "A data final deve ser posterior à data inicial", path: ["end_at"] },
);

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/campaigns/$campaignId/edit")({
  head: () => ({
    meta: [
      { title: `Editar campanha — RaffleHub` },
      { name: "description", content: "Edite os dados da campanha." },
    ],
  }),
  component: CampaignEdit,
});

function CampaignEdit() {
  const { campaignId } = useParams({ from: "/campaigns/$campaignId/edit" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isPending: authPending } = useCurrentUser();
  const { memberships, isPending: tenantPending } = useTenant();

  const { data: campaign, isPending: loading } = useCampaign(campaignId);
  const update = useUpdateCampaign();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", slug: "", product_name: "", product_description: "",
      description: "", total_numbers: 100, number_price: 10, start_at: "", end_at: "",
    },
  });

  useEffect(() => {
    if (!authPending && !user) void navigate({ to: "/auth", replace: true });
  }, [authPending, user, navigate]);

  useEffect(() => {
    if (!tenantPending && user && memberships.length === 0) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [tenantPending, user, memberships.length, navigate]);

  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name,
        slug: campaign.slug,
        product_name: campaign.product_name,
        product_description: campaign.product_description ?? "",
        description: campaign.description ?? "",
        total_numbers: campaign.total_numbers,
        number_price: campaign.number_price,
        start_at: campaign.start_at ? toLocalDatetime(campaign.start_at) : "",
        end_at: campaign.end_at ? toLocalDatetime(campaign.end_at) : "",
      });
    }
  }, [campaign, form]);

  if (loading) {
    return (<AppShell title="Editar campanha"><Skeleton className="h-96 w-full" /></AppShell>);
  }

  if (!campaign) {
    return (
      <AppShell title="Campanha não encontrada">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
          <p className="font-medium">Campanha não encontrada</p>
          <p className="max-w-md text-sm text-muted-foreground">Esta campanha não existe ou você não possui acesso a ela.</p>
          <Link to="/campaigns" className="text-sm underline text-primary">Voltar para campanhas</Link>
        </div>
      </AppShell>
    );
  }

  const isDraft = campaign.status === "DRAFT";
  const isArchived = campaign.status === "ARCHIVED";
  const slugLocked = campaign.published_at !== null;
  const criticalLocked = !isDraft && campaign.status !== "PAUSED";

  const onSubmit = form.handleSubmit(async (data) => {
    const patchObj: Record<string, unknown> = {};
    if (data.name.trim() !== campaign.name) patchObj["name"] = data.name.trim();
    if (data.slug.trim() !== campaign.slug) patchObj["slug"] = data.slug.trim();
    if (data.product_name.trim() !== campaign.product_name) patchObj["product_name"] = data.product_name.trim();
    if ((data.product_description?.trim() || null) !== (campaign.product_description || null)) patchObj["product_description"] = data.product_description?.trim() || null;
    if ((data.description?.trim() || null) !== (campaign.description || null)) patchObj["description"] = data.description?.trim() || null;
    if (data.total_numbers !== campaign.total_numbers) patchObj["total_numbers"] = data.total_numbers;
    if (data.number_price !== campaign.number_price) patchObj["number_price"] = data.number_price;
    if (data.start_at) patchObj["start_at"] = data.start_at;
    if (data.end_at) patchObj["end_at"] = data.end_at;
    if (!data.start_at && !!campaign.start_at) patchObj["clear_start_at"] = true;
    if (!data.end_at && !!campaign.end_at) patchObj["clear_end_at"] = true;

    if (Object.keys(patchObj).length === 0) {
      void navigate({ to: "/campaigns/$campaignId", params: { campaignId } });
      return;
    }

    try {
      await update.mutateAsync({
        campaignId,
        patch: patchObj as Partial<CampaignInput> & { clear_start_at?: boolean; clear_end_at?: boolean },
      });
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      void navigate({ to: "/campaigns/$campaignId", params: { campaignId } });
    } catch {
      // toast handled by mutation
    }
  });

  return (
    <AppShell
      title="Editar campanha"
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/campaigns/$campaignId" params={{ campaignId }}>
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </Button>
      }
    >
      <PermissionGate permission="campaigns.update">
        {isArchived ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
            <p className="font-medium">Campanha arquivada</p>
            <p className="max-w-md text-sm text-muted-foreground">Restaure a campanha antes de editá-la.</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={(e) => { void onSubmit(e); }} className="mx-auto max-w-2xl space-y-6">
              <div className="flex items-center gap-2">
                <Badge className={CAMPAIGN_STATUS_TONE[campaign.status]} variant="secondary">
                  {CAMPAIGN_STATUS_LABEL[campaign.status]}
                </Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Informações básicas</CardTitle>
                  <CardDescription>Nome, slug e descrição da campanha.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da campanha</FormLabel>
                      <FormControl><Input {...field} placeholder="Rifa do iPhone 17 Pro" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={slugLocked} placeholder="rifa-iphone-17-pro" onChange={(e) => field.onChange(slugify(e.target.value))} />
                      </FormControl>
                      {slugLocked && <FormDescription>O slug não pode ser alterado após a primeira publicação.</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl><Textarea {...field} placeholder="Descreva sua campanha..." rows={3} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Produto</CardTitle>
                  <CardDescription>O que está sendo rifado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="product_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto</FormLabel>
                      <FormControl><Input {...field} placeholder="iPhone 17 Pro 256GB" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="product_description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do produto (opcional)</FormLabel>
                      <FormControl><Textarea {...field} placeholder="Novo, lacrado na caixa..." rows={2} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Números e preço</CardTitle>
                  <CardDescription>{criticalLocked ? "A quantidade de números não pode ser alterada nesta situação." : "Quantidade de números e valor unitário."}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="total_numbers" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de números</FormLabel>
                        <FormControl><Input {...field} type="number" min={1} disabled={criticalLocked} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="number_price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor por número (R$)</FormLabel>
                        <FormControl><Input {...field} type="number" min={0.01} step={0.01} disabled={criticalLocked} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Datas</CardTitle>
                  <CardDescription>Período da campanha. Deixe vazio para sem data.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="start_at" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Início</FormLabel>
                        <FormControl><Input {...field} type="datetime-local" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="end_at" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fim</FormLabel>
                        <FormControl><Input {...field} type="datetime-local" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={update.isPending}>
                  {update.isPending ? "Salvando…" : "Salvar alterações"}
                </Button>
                <Button variant="outline" type="button" asChild>
                  <Link to="/campaigns/$campaignId" params={{ campaignId }}>Cancelar</Link>
                </Button>
              </div>
            </form>
          </Form>
        )}
      </PermissionGate>
    </AppShell>
  );
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}