import { Palette } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { campaignMediaPublicUrl } from "@/services/campaign.service";
import type { CampaignSettingsInput } from "@/schemas/campaign.schema";
import {
  CAMPAIGN_FONT_LABELS,
  CAMPAIGN_FONT_STACKS,
  CAMPAIGN_FONT_VALUES,
  CAMPAIGN_THEME_LABELS,
  CAMPAIGN_THEME_VALUES,
} from "@/types/campaign";

export interface ThemeEditorProps {
  value: CampaignSettingsInput;
  onChange: (patch: Partial<CampaignSettingsInput>) => void;
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} — seletor de cor`}
          value={/^#([0-9a-fA-F]{6})$/.test(value) ? value : "#111111"}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
        />
        <Input
          id={id}
          placeholder="#111111"
          value={value}
          maxLength={7}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

export function ThemeEditor({ value, onChange }: ThemeEditorProps) {
  const fontStack = CAMPAIGN_FONT_STACKS[value.font_family] ?? CAMPAIGN_FONT_STACKS.inter;
  const backgroundUrl = value.background_image
    ? value.background_image.startsWith("http")
      ? value.background_image
      : campaignMediaPublicUrl(value.background_image)
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-5">
        <div className="grid gap-5 rounded-xl border bg-card p-5">
          <h4 className="text-sm font-semibold">Tema e tipografia</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="theme-mode">Tema da página pública</Label>
              <Select
                value={value.theme}
                onValueChange={(next) =>
                  onChange({ theme: next as CampaignSettingsInput["theme"] })
                }
              >
                <SelectTrigger id="theme-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_THEME_VALUES.map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {CAMPAIGN_THEME_LABELS[theme]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="theme-font">Família de fonte</Label>
              <Select
                value={value.font_family}
                onValueChange={(next) =>
                  onChange({ font_family: next as CampaignSettingsInput["font_family"] })
                }
              >
                <SelectTrigger id="theme-font">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_FONT_VALUES.map((font) => (
                    <SelectItem key={font} value={font}>
                      {CAMPAIGN_FONT_LABELS[font]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid gap-5 rounded-xl border bg-card p-5">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Palette aria-hidden="true" className="size-4" />
            Cores da campanha
          </h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <ColorField
              id="color-primary"
              label="Cor primária"
              value={value.primary_color ?? ""}
              onChange={(next) => onChange({ primary_color: next })}
            />
            <ColorField
              id="color-secondary"
              label="Cor secundária"
              value={value.secondary_color ?? ""}
              onChange={(next) => onChange({ secondary_color: next })}
            />
            <ColorField
              id="color-button"
              label="Cor dos botões"
              value={value.button_color ?? ""}
              onChange={(next) => onChange({ button_color: next })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Deixe em branco para herdar as cores padrão da plataforma.
          </p>
        </div>

        <div className="grid gap-5 rounded-xl border bg-card p-5">
          <h4 className="text-sm font-semibold">Identidade visual</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="visual-logo">Logo da campanha</Label>
              <Input
                id="visual-logo"
                placeholder="URL ou caminho"
                value={value.campaign_logo ?? ""}
                onChange={(event) => onChange({ campaign_logo: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="visual-banner">Banner</Label>
              <Input
                id="visual-banner"
                placeholder="URL ou caminho"
                value={value.banner_image ?? ""}
                onChange={(event) => onChange({ banner_image: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="visual-bg">Imagem de fundo</Label>
              <Input
                id="visual-bg"
                placeholder="URL ou caminho"
                value={value.background_image ?? ""}
                onChange={(event) => onChange({ background_image: event.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Pré-visualização</p>
        <div
          className="overflow-hidden rounded-xl border border-border bg-cover bg-center p-5"
          style={{
            fontFamily: fontStack,
            ...(backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : {}),
          }}
        >
          <div className="space-y-3 rounded-lg bg-background/90 p-4 backdrop-blur">
            <p
              className="text-lg font-semibold tracking-tight"
              style={value.primary_color ? { color: value.primary_color } : undefined}
            >
              Título da campanha
            </p>
            <p
              className="text-sm"
              style={
                value.secondary_color
                  ? { color: value.secondary_color }
                  : { color: "var(--muted-foreground)" }
              }
            >
              Descrição curta com a cor secundária aplicada ao texto de apoio.
            </p>
            <button
              type="button"
              className="w-full rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: value.button_color || value.primary_color || "#111111" }}
            >
              Escolher números
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
