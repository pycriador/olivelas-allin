import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublicationChecklist } from "@/features/campaigns/components/publication-checklist";
import { SEOEditor } from "@/features/campaigns/components/seo-editor";
import { SharePreview } from "@/features/campaigns/components/share-preview";
import { ThemeEditor } from "@/features/campaigns/components/theme-editor";
import { useUpdateCampaignSettings } from "@/features/campaigns/hooks/use-campaigns";
import type { CampaignSettingsInput } from "@/schemas/campaign.schema";
import type { Campaign, CampaignImage, CampaignSettings } from "@/types/campaign";
import { PAYMENT_GATEWAY_LABELS, PAYMENT_GATEWAY_VALUES } from "@/types/payment";

export interface CampaignSettingsProps {
  campaignId: string;
  settings: CampaignSettings | null;
  images?: CampaignImage[];
  campaign?: Campaign;
  canPublish?: boolean;
}

type ToggleKey =
  | "show_progress_bar"
  | "show_percentage_sold"
  | "show_total_numbers"
  | "show_remaining_numbers"
  | "show_product_value"
  | "show_product_description"
  | "show_gallery"
  | "show_statistics"
  | "show_purchase_counter"
  | "show_recent_buyers"
  | "show_rules"
  | "show_contact_information"
  | "enable_comments"
  | "enable_faq"
  | "enable_whatsapp"
  | "enable_share";

const DISPLAY_TOGGLES: { key: ToggleKey; label: string }[] = [
  { key: "show_progress_bar", label: "Barra de progresso" },
  { key: "show_percentage_sold", label: "Percentual vendido" },
  { key: "show_total_numbers", label: "Total de números" },
  { key: "show_remaining_numbers", label: "Números restantes" },
  { key: "show_product_value", label: "Valor por número" },
  { key: "show_product_description", label: "Descrição do produto" },
  { key: "show_gallery", label: "Galeria de imagens" },
  { key: "show_statistics", label: "Estatísticas públicas" },
  { key: "show_purchase_counter", label: "Contador de compras" },
  { key: "show_recent_buyers", label: "Compradores recentes" },
  { key: "show_rules", label: "Regras e regulamento" },
  { key: "show_contact_information", label: "Informações de contato" },
  { key: "enable_comments", label: "Comentários" },
  { key: "enable_faq", label: "Perguntas frequentes" },
  { key: "enable_whatsapp", label: "Botão de WhatsApp" },
  { key: "enable_share", label: "Compartilhamento social" },
];

export function CampaignSettings({
  campaignId,
  settings,
  images,
  campaign,
  canPublish = true,
}: CampaignSettingsProps) {
  const [values, setValues] = useState<CampaignSettingsInput>(() => toForm(settings));
  const save = useUpdateCampaignSettings();

  useEffect(() => {
    if (settings) setValues(toForm(settings));
  }, [settings]);

  const patch = (partial: Partial<CampaignSettingsInput>) =>
    setValues((current) => ({ ...current, ...partial }));

  const handleSave = () => {
    save.mutate(
      { campaignId, data: values },
      {
        onSuccess: () => toast.success("Configurações salvas com sucesso"),
        onError: (error) =>
          toast.error("Não foi possível salvar as configurações", { description: error.message }),
      },
    );
  };

  const publicUrl =
    typeof window !== "undefined" && campaign
      ? `${window.location.origin}/r/${campaign.slug}`
      : `/r/${campaign?.slug ?? ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Configurações da campanha</h3>
          <p className="text-sm text-muted-foreground">
            Personalize exibição, reservas, visual, SEO e publicação da página pública.
          </p>
        </div>
        <Button type="button" onClick={handleSave} disabled={save.isPending}>
          {save.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="size-4" />
          )}
          {save.isPending ? "Salvando…" : "Salvar configurações"}
        </Button>
      </div>

      <Tabs defaultValue="display">
        <TabsList className="flex-wrap">
          <TabsTrigger value="display">Exibição</TabsTrigger>
          <TabsTrigger value="reservation">Reservas</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="share">Compartilhamento</TabsTrigger>
          <TabsTrigger value="payment">Pagamento</TabsTrigger>
          {campaign ? <TabsTrigger value="publish">Publicacao</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="display" className="space-y-4 pt-4">
          <div className="space-y-3 rounded-xl border bg-card p-5">
            <h4 className="text-sm font-semibold">Página pública</h4>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Habilitar página pública /r/&lt;slug&gt;</p>
                <p className="text-xs text-muted-foreground">
                  Permite que visitantes vejam a campanha e compartilhem o link.
                </p>
              </div>
              <Switch
                id="setting-public-page"
                checked={values.enable_public_page}
                onCheckedChange={(checked) => patch({ enable_public_page: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Habilitar SEO e indexação</p>
                <p className="text-xs text-muted-foreground">
                  Quando desativado, a página recebe noindex e não gera meta tags sociais.
                </p>
              </div>
              <Switch
                checked={values.enable_seo}
                onCheckedChange={(checked) => patch({ enable_seo: checked })}
              />
            </div>
          </div>

          <div className="space-y-2 rounded-xl border bg-card p-5">
            <h4 className="text-sm font-semibold">Blocos exibidos na página</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {DISPLAY_TOGGLES.map((toggle) => (
                <div
                  key={toggle.key}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
                >
                  <span className="text-sm">{toggle.label}</span>
                  <Switch
                    aria-label={toggle.label}
                    checked={values[toggle.key]}
                    onCheckedChange={(checked) =>
                      patch({ [toggle.key]: checked } as Partial<CampaignSettingsInput>)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reservation" className="space-y-4 pt-4">
          <div className="space-y-2 rounded-xl border bg-card p-5">
            <h4 className="text-sm font-semibold">Modo de escolha</h4>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <span className="text-sm">Permitir seleção manual de números</span>
              <Switch
                checked={values.allow_manual_selection}
                onCheckedChange={(checked) => patch({ allow_manual_selection: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <span className="text-sm">Permitir escolha aleatória (surpresinha)</span>
              <Switch
                checked={values.allow_random_selection}
                onCheckedChange={(checked) => patch({ allow_random_selection: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <span className="text-sm">Reservar automaticamente ao selecionar</span>
              <Switch
                checked={values.auto_reservation}
                onCheckedChange={(checked) => patch({ auto_reservation: checked })}
              />
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="reservation-timeout">Tempo de reserva (minutos)</Label>
              <Input
                id="reservation-timeout"
                type="number"
                min={1}
                max={1440}
                value={values.reservation_timeout_minutes}
                onChange={(event) =>
                  patch({ reservation_timeout_minutes: Number(event.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max-per-purchase">Máximo de números por compra</Label>
              <Input
                id="max-per-purchase"
                type="number"
                min={1}
                max={10000}
                value={values.max_numbers_per_purchase}
                onChange={(event) =>
                  patch({ max_numbers_per_purchase: Number(event.target.value) })
                }
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="visual" className="pt-4">
          <ThemeEditor value={values} onChange={patch} />
        </TabsContent>

        <TabsContent value="seo" className="pt-4">
          {values.enable_seo ? (
            <SEOEditor value={values} onChange={patch} {...(images ? { images } : {})} />
          ) : (
            <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
              O SEO está desativado para esta campanha. Ative-o na aba “Exibição” para editar as
              meta tags.
            </p>
          )}
        </TabsContent>

        <TabsContent value="share" className="pt-4">
          <SharePreview
            value={values}
            fallbackTitle={campaign?.title ?? "Campanha"}
            fallbackDescription={campaign?.short_description ?? null}
            fallbackImage={campaign?.cover_image ?? null}
            url={publicUrl}
          />
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 pt-4">
          <div className="space-y-4 rounded-xl border bg-card p-5">
            <div>
              <h4 className="text-sm font-semibold">Checkout automatico</h4>
              <p className="text-xs text-muted-foreground">
                Quando o modo de compra da campanha for AUTOMATIC, o gateway abaixo e usado no PIX.
                Se vazio, usa o padrao global em Configuracoes.
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Habilitar PIX nesta campanha</p>
                <p className="text-xs text-muted-foreground">
                  Desative para forcar apenas fluxo manual/WhatsApp mesmo em AUTOMATIC.
                </p>
              </div>
              <Switch
                checked={values.enable_pix}
                onCheckedChange={(checked) => patch({ enable_pix: checked })}
              />
            </div>
            <div className="grid max-w-md gap-2">
              <Label htmlFor="campaign-gateway">Gateway da campanha</Label>
              <Select
                value={values.payment_gateway}
                onValueChange={(value) =>
                  patch({
                    payment_gateway: value as CampaignSettingsInput["payment_gateway"],
                  })
                }
              >
                <SelectTrigger id="campaign-gateway">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFAULT">Gateway padrao da plataforma</SelectItem>
                  {PAYMENT_GATEWAY_VALUES.map((gateway) => (
                    <SelectItem key={gateway} value={gateway}>
                      {PAYMENT_GATEWAY_LABELS[gateway]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Credenciais e teste de conexao ficam em Configuracoes → Pagamentos.
            </p>
          </div>
        </TabsContent>

        {campaign ? (
          <TabsContent value="publish" className="pt-4">
            <PublicationChecklist
              campaign={campaign}
              settings={settings}
              {...(images ? { images } : {})}
              canPublish={canPublish}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

function toForm(settings: CampaignSettings | null): CampaignSettingsInput {
  const theme = settings?.theme;
  const font = settings?.font_family;
  return {
    show_progress: settings?.show_progress ?? true,
    show_remaining_numbers: settings?.show_remaining_numbers ?? true,
    show_product_value: settings?.show_product_value ?? true,
    enable_share: settings?.enable_share ?? true,
    enable_seo: settings?.enable_seo ?? true,
    enable_public_page: settings?.enable_public_page ?? true,
    seo_title: settings?.seo_title ?? "",
    seo_description: settings?.seo_description ?? "",
    seo_keywords: settings?.seo_keywords ?? "",
    share_image: settings?.share_image ?? "",

    show_progress_bar: settings?.show_progress_bar ?? true,
    show_percentage_sold: settings?.show_percentage_sold ?? true,
    show_total_numbers: settings?.show_total_numbers ?? true,
    show_contact_information: settings?.show_contact_information ?? true,
    show_statistics: settings?.show_statistics ?? true,
    show_gallery: settings?.show_gallery ?? true,
    show_product_description: settings?.show_product_description ?? true,
    show_purchase_counter: settings?.show_purchase_counter ?? true,
    show_recent_buyers: settings?.show_recent_buyers ?? false,
    show_rules: settings?.show_rules ?? false,
    enable_comments: settings?.enable_comments ?? false,
    enable_faq: settings?.enable_faq ?? false,
    enable_whatsapp: settings?.enable_whatsapp ?? true,

    allow_manual_selection: settings?.allow_manual_selection ?? true,
    allow_random_selection: settings?.allow_random_selection ?? true,
    auto_reservation: settings?.auto_reservation ?? true,
    reservation_timeout_minutes: settings?.reservation_timeout_minutes ?? 10,
    max_numbers_per_purchase: settings?.max_numbers_per_purchase ?? 100,

    theme: theme === "light" || theme === "dark" ? theme : "system",
    primary_color: settings?.primary_color ?? "",
    secondary_color: settings?.secondary_color ?? "",
    button_color: settings?.button_color ?? "",
    font_family: font === "geist" || font === "serif" || font === "mono" ? font : "inter",
    background_image: settings?.background_image ?? "",
    banner_image: settings?.banner_image ?? "",
    campaign_logo: settings?.campaign_logo ?? "",

    canonical_url: settings?.canonical_url ?? "",
    og_title: settings?.og_title ?? "",
    og_description: settings?.og_description ?? "",
    og_image: settings?.og_image ?? "",
    twitter_title: settings?.twitter_title ?? "",
    twitter_description: settings?.twitter_description ?? "",
    twitter_image: settings?.twitter_image ?? "",
    json_ld: settings?.json_ld ?? "",

    contact_email: settings?.contact_email ?? "",
    contact_hours: settings?.contact_hours ?? "",
    contact_whatsapp: settings?.contact_whatsapp ?? "",

    enable_pix: settings?.enable_pix ?? true,
    payment_gateway:
      settings?.payment_gateway === "INFINITYPAY" ||
      settings?.payment_gateway === "MERCADO_PAGO" ||
      settings?.payment_gateway === "PAGBANK"
        ? settings.payment_gateway
        : "DEFAULT",
  };
}
