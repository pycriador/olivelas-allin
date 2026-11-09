import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppShell } from "@/components/app/AppShell";
import { PermissionGate } from "@/components/app/PermissionGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { useCurrentUser, useTenant } from "@/hooks/useTenant";
import { slugify } from "@/services/types";

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

export const Route = createFileRoute("/campaigns/create")({
  head: () => ({
    meta: [
      { title: "Nova campanha — RaffleHub" },
      { name: "description", content: "Crie uma nova campanha de rifa." },
    ],
  }),
  component: CampaignCreate,
});

function CampaignCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isPending: authPending } = useCurrentUser();
  const { organizationId, memberships, isPending: tenantPending } = useTenant();
  const create = useCreateCampaign();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      product_name: "",
      product_description: "",
      description: "",
      total_numbers: 100,
      number_price: 10,
      start_at: "",
      end_at: "",
    },
  });

  const nameValue = form.watch("name");

  useEffect(() => {
    if (!authPending && !user) { void navigate({ to: "/auth", replace: true }); }
  }, [authPending, user, navigate]);

  useEffect(() => {
    if (!tenantPending && user && memberships.length === 0) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [tenantPending, user, memberships.length, navigate]);

  const onSubmit = form.handleSubmit(async (data) => {
    const id = await create.mutateAsync({
      name: data.name.trim(),
      slug: data.slug.trim() || slugify(data.name),
      product_name: data.product_name.trim(),
      total_numbers: data.total_numbers,
      number_price: data.number_price,
      description: data.description?.trim() || null,
      product_description: data.product_description?.trim() || null,
      start_at: data.start_at || null,
      end_at: data.end_at || null,
    });
    await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    void navigate({ to: "/campaigns/$campaignId", params: { campaignId: id }, replace: true });
  });

  return (
    <AppShell
      title="Nova campanha"
      description="Configure as informações da sua campanha de rifa."
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/campaigns">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </Button>
      }
    >
      <PermissionGate permission="campaigns.create">
        <Form {...form}>
          <form onSubmit={(e) => { void onSubmit(e); }} className="mx-auto max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Informações básicas</CardTitle>
                <CardDescription>Nome, slug e descrição da campanha.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da campanha</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Rifa do iPhone 17 Pro"
                          onChange={(e) => {
                            field.onChange(e);
                            if ((nameValue?.length ?? 0) <= 1) {
                              form.setValue("slug", slugify(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="rifa-iphone-17-pro"
                          onChange={(e) => field.onChange(slugify(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Identificador único na URL. Apenas letras, números e hífens.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descreva sua campanha..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Produto</CardTitle>
                <CardDescription>O que está sendo rifado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="product_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="iPhone 17 Pro 256GB" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="product_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do produto (opcional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Novo, lacrado na caixa..." rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Números e preço</CardTitle>
                <CardDescription>Quantidade de números e valor unitário.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="total_numbers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de números</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min={1} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="number_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor por número (R$)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min={0.01} step={0.01} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Datas (opcional)</CardTitle>
                <CardDescription>Período da campanha.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="start_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Início</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fim</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={create.isPending}>
                {create.isPending ? "Criando…" : "Criar campanha"}
              </Button>
              <Button variant="outline" type="button" asChild>
                <Link to="/campaigns">Cancelar</Link>
              </Button>
            </div>
          </form>
        </Form>
      </PermissionGate>
    </AppShell>
  );
}
