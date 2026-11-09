import { Image as ImageIcon, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { campaignMediaPublicUrl } from "@/services/campaign.service";
import type { CampaignSettingsInput } from "@/schemas/campaign.schema";
import type { CampaignImage } from "@/types/campaign";

export interface SEOEditorProps {
  value: CampaignSettingsInput;
  onChange: (patch: Partial<CampaignSettingsInput>) => void;
  images?: CampaignImage[];
}

function ImagePicker({
  id,
  label,
  hint,
  value,
  images,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  images?: CampaignImage[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder="Caminho da imagem ou URL https://…"
        value={value}
        list={images && images.length > 0 ? `${id}-options` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {images && images.length > 0 ? (
        <datalist id={`${id}-options`}>
          {images.map((image) => (
            <option key={image.id} value={image.storage_path}>
              {image.filename}
            </option>
          ))}
        </datalist>
      ) : null}
      <p className="text-xs text-muted-foreground">{hint}</p>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-border p-2">
          <ImageIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <img
            src={value.startsWith("http") ? value : (campaignMediaPublicUrl(value) ?? "")}
            alt=""
            loading="lazy"
            className="size-14 rounded-md object-cover"
          />
          <span className="truncate text-xs text-muted-foreground">{value}</span>
        </div>
      ) : null}
    </div>
  );
}

export function SEOEditor({ value, onChange, images }: SEOEditorProps) {
  const title = value.seo_title ?? "";
  const description = value.seo_description ?? "";

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 rounded-xl border bg-card p-5">
        <h4 className="text-sm font-semibold">Meta tags principais</h4>

        <div className="grid gap-2">
          <Label htmlFor="seo-title">Meta title</Label>
          <Input
            id="seo-title"
            placeholder="Ex.: Rifa Solidária — Prêmios incríveis"
            value={title}
            maxLength={70}
            onChange={(event) => onChange({ seo_title: event.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            {title.length}/70 caracteres — recomendado até 60.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="seo-description">Meta description</Label>
          <Textarea
            id="seo-description"
            placeholder="Resumo exibido no Google e nas redes sociais."
            value={description}
            maxLength={160}
            rows={3}
            onChange={(event) => onChange({ seo_description: event.target.value })}
          />
          <p className="text-xs text-muted-foreground">{description.length}/160 caracteres.</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="seo-keywords">Palavras-chave</Label>
          <Input
            id="seo-keywords"
            placeholder="rifa, sorteio, prêmio"
            value={value.seo_keywords ?? ""}
            onChange={(event) => onChange({ seo_keywords: event.target.value })}
          />
          <p className="text-xs text-muted-foreground">Separadas por vírgula.</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="seo-canonical">URL canônica</Label>
          <Input
            id="seo-canonical"
            placeholder="https://olivelas-raffle.lovable.app/r/minha-rifa"
            value={value.canonical_url ?? ""}
            onChange={(event) => onChange({ canonical_url: event.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Deixe em branco para usar automaticamente o endereço público da campanha.
          </p>
        </div>
      </div>

      <div className="grid gap-5 rounded-xl border bg-card p-5">
        <h4 className="text-sm font-semibold">Open Graph (Facebook, WhatsApp, LinkedIn)</h4>
        <div className="grid gap-2">
          <Label htmlFor="og-title">og:title</Label>
          <Input
            id="og-title"
            placeholder="Herda o meta title quando vazio"
            value={value.og_title ?? ""}
            maxLength={70}
            onChange={(event) => onChange({ og_title: event.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="og-description">og:description</Label>
          <Textarea
            id="og-description"
            rows={2}
            placeholder="Herda a meta description quando vazio"
            value={value.og_description ?? ""}
            maxLength={200}
            onChange={(event) => onChange({ og_description: event.target.value })}
          />
        </div>
        <ImagePicker
          id="og-image"
          label="og:image"
          hint="Recomendado 1200×630px."
          value={value.og_image ?? ""}
          {...(images ? { images } : {})}
          onChange={(next) => onChange({ og_image: next })}
        />
      </div>

      <div className="grid gap-5 rounded-xl border bg-card p-5">
        <h4 className="text-sm font-semibold">Twitter / X Card</h4>
        <div className="grid gap-2">
          <Label htmlFor="tw-title">twitter:title</Label>
          <Input
            id="tw-title"
            placeholder="Herda o og:title quando vazio"
            value={value.twitter_title ?? ""}
            maxLength={70}
            onChange={(event) => onChange({ twitter_title: event.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tw-description">twitter:description</Label>
          <Textarea
            id="tw-description"
            rows={2}
            placeholder="Herda o og:description quando vazio"
            value={value.twitter_description ?? ""}
            maxLength={200}
            onChange={(event) => onChange({ twitter_description: event.target.value })}
          />
        </div>
        <ImagePicker
          id="tw-image"
          label="twitter:image"
          hint="Recomendado 1200×675px."
          value={value.twitter_image ?? ""}
          {...(images ? { images } : {})}
          onChange={(next) => onChange({ twitter_image: next })}
        />
      </div>

      <div className="grid gap-5 rounded-xl border bg-card p-5">
        <h4 className="text-sm font-semibold">Compartilhamento e dados estruturados</h4>
        <ImagePicker
          id="share-image"
          label="Imagem de compartilhamento padrão"
          hint="Usada como fallback em Open Graph e Twitter Card."
          value={value.share_image ?? ""}
          {...(images ? { images } : {})}
          onChange={(next) => onChange({ share_image: next })}
        />
        <div className="grid gap-2">
          <Label htmlFor="json-ld">JSON-LD personalizado</Label>
          <Textarea
            id="json-ld"
            rows={5}
            spellCheck={false}
            placeholder='{"@context":"https://schema.org","@type":"Product"}'
            value={value.json_ld ?? ""}
            onChange={(event) => onChange({ json_ld: event.target.value })}
          />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Search aria-hidden="true" className="size-3.5" />
            Opcional. Deixe vazio para o schema automático de produto/oferta.
          </p>
        </div>
      </div>
    </div>
  );
}
