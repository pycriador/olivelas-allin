import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CampaignPreview } from "@/features/campaigns/components/campaign-preview";
import { WhatsAppMessagesManager } from "@/features/campaigns/components/whatsapp-messages-manager";
import { campaignFormSchema, type CampaignFormInput } from "@/schemas/campaign.schema";
import { slugifyTitle } from "@/services/campaign.service";
import {
  CAMPAIGN_PURCHASE_MODE_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_VISIBILITY_LABELS,
  DEFAULT_WHATSAPP_MESSAGE_TEMPLATE,
  type CampaignStatus,
} from "@/types/campaign";
import { cn } from "@/lib/utils";

export interface CampaignWizardProps {
  mode: "create" | "edit";
  initialValues?: Partial<CampaignFormInput>;
  allowedStatuses?: CampaignStatus[];
  campaignId?: string;
  onSubmit: (values: CampaignFormInput) => void;
  isSubmitting?: boolean;
}

const STEPS = [
  { title: "Dados", description: "Informações básicas da rifa" },
  { title: "Números & Preço", description: "Grade, valores e limites" },
  { title: "Vendas & Contato", description: "Modo de compra e WhatsApp" },
  { title: "Datas & Publicação", description: "Agenda, visibilidade e status" },
  { title: "Revisão", description: "Confira antes de salvar" },
];

function toLocalInput(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function CampaignWizard({
  mode,
  initialValues,
  allowedStatuses = ["DRAFT", "SCHEDULED"],
  campaignId,
  onSubmit,
  isSubmitting,
}: CampaignWizardProps) {
  const [step, setStep] = useState(0);

  const form = useForm<CampaignFormInput>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      slug: initialValues?.slug ?? "",
      product_name: initialValues?.product_name ?? "",
      short_description: initialValues?.short_description ?? "",
      description: initialValues?.description ?? "",
      number_start: initialValues?.number_start ?? 1,
      number_end: initialValues?.number_end ?? 200,
      price_per_number: initialValues?.price_per_number ?? 0,
      max_numbers_per_purchase: initialValues?.max_numbers_per_purchase ?? 1,
      reservation_timeout_minutes: initialValues?.reservation_timeout_minutes ?? 10,
      start_date: toLocalInput(initialValues?.start_date),
      end_date: toLocalInput(initialValues?.end_date),
      visibility: initialValues?.visibility ?? "PUBLIC",
      allow_random_selection: initialValues?.allow_random_selection ?? true,
      contact_name: initialValues?.contact_name ?? "",
      contact_phone: initialValues?.contact_phone ?? "",
      whatsapp_message_template: initialValues?.whatsapp_message_template ?? "",
      purchase_mode: initialValues?.purchase_mode ?? "MANUAL",
      status: (initialValues?.status as CampaignStatus | undefined) ?? "DRAFT",
    },
  });

  const watched = form.watch();

  const stepFields: Record<number, Array<keyof CampaignFormInput>> = {
    0: ["title", "slug", "product_name", "short_description", "description"],
    1: [
      "number_start",
      "number_end",
      "price_per_number",
      "max_numbers_per_purchase",
      "reservation_timeout_minutes",
    ],
    2: ["purchase_mode", "contact_name", "contact_phone", "whatsapp_message_template"],
    3: ["start_date", "end_date", "visibility", "status"],
    4: [],
  };

  const next = async () => {
    const fields = stepFields[step];
    if (fields && fields.length > 0) {
      const valid = await form.trigger(fields);
      if (!valid) return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const back = () => setStep((current) => Math.max(current - 1, 0));

  return (
    <div className="space-y-6">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((stepItem, index) => (
          <li key={stepItem.title}>
            <button
              type="button"
              onClick={() => index < step && setStep(index)}
              disabled={index > step}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                index === step
                  ? "border-primary bg-accent"
                  : index < step
                    ? "border-border hover:border-primary/40"
                    : "cursor-default border-border opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  index < step
                    ? "bg-success text-success-foreground"
                    : index === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {index < step ? <Check aria-hidden="true" className="size-4" /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{stepItem.title}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {stepItem.description}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 sm:max-w-2xl" noValidate>
          {step === 0 ? (
            <>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da campanha</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Rifa do Ano Novo" {...field} />
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
                        placeholder={slugifyTitle(watched.title) || "url-publica"}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Deixe em branco para gerar automaticamente a partir do nome.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="product_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto / brinde</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: iPhone 15 Pro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="short_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição curta</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Resumo exibido nos cards (máx. 200 caracteres)."
                        rows={2}
                        maxLength={200}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição completa</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          "Escreva em Markdown.\n\n**Título em negrito**, listas e links são suportados."
                        }
                        rows={8}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Suporta Markdown seguro: **negrito**, *itálico*, listas, títulos e links.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="number_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número inicial</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="number_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número final</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price_per_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor por número (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0.01}
                        step={0.01}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_numbers_per_purchase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite por compra</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>Máx. de números por participante.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reservation_timeout_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo de reserva (minutos)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>
                      Quanto tempo o número fica reservado no checkout.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allow_random_selection"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                    <div>
                      <FormLabel>Seleção aleatória</FormLabel>
                      <FormDescription>Permitir que o sistema sorteie números.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-6 sm:max-w-xl">
              <FormField
                control={form.control}
                name="purchase_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modo de compra</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(["MANUAL", "AUTOMATIC"] as const).map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {CAMPAIGN_PURCHASE_MODE_LABELS[mode]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Manual: o participante combina a venda pelo WhatsApp. Automático (gateway)
                      estará disponível em uma próxima fase.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de contato</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Ana (organizadora)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp de contato</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: (11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {mode === "edit" && campaignId ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Mensagens personalizadas (WhatsApp)</Label>
                    <p className="text-[0.8rem] text-muted-foreground">
                      Cadastre as mensagens que prefere usar no WhatsApp. A marcada como padrão é
                      usada automaticamente.
                    </p>
                  </div>
                  <WhatsAppMessagesManager
                    campaignId={campaignId}
                    initialContent={form.getValues("whatsapp_message_template")}
                    onTemplateChange={(content) =>
                      form.setValue("whatsapp_message_template", content, {
                        shouldDirty: true,
                        shouldValidate: false,
                      })
                    }
                  />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="whatsapp_message_template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem padrão (WhatsApp)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={5}
                          placeholder={DEFAULT_WHATSAPP_MESSAGE_TEMPLATE}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Marcadores: {"{name}"}, {"{campaign}"}, {"{numbers}"} e {"{total}"}. Deixe em
                        branco para usar o padrão.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de início</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de encerramento</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibilidade</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(["PUBLIC", "PRIVATE"] as const).map((visibility) => (
                          <SelectItem key={visibility} value={visibility}>
                            {CAMPAIGN_VISIBILITY_LABELS[visibility]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Pública gera link /r/slug para compartilhar.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      {...(field.value ? { value: field.value } : {})}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allowedStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {CAMPAIGN_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ) : null}

          {step === 4 ? <CampaignPreview campaign={watched} soldCount={0} /> : null}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
              <ChevronLeft aria-hidden="true" className="size-4" />
              Voltar
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => void next()}>
                Continuar
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : null}
                {mode === "create" ? "Criar campanha" : "Salvar alterações"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
