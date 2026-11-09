import { Globe, Link2 } from "lucide-react";

import { campaignMediaPublicUrl } from "@/services/campaign.service";
import type { CampaignSettingsInput } from "@/schemas/campaign.schema";

export interface SharePreviewProps {
  value: CampaignSettingsInput;
  fallbackTitle: string;
  fallbackDescription?: string | null;
  fallbackImage?: string | null;
  url: string;
}

function resolveImage(...candidates: (string | null | undefined)[]): string | null {
  for (const candidate of candidates) {
    const trimmed = (candidate ?? "").trim();
    if (!trimmed) continue;
    return trimmed.startsWith("http") ? trimmed : (campaignMediaPublicUrl(trimmed) ?? null);
  }
  return null;
}

function pick(...candidates: (string | null | undefined)[]): string {
  for (const candidate of candidates) {
    const trimmed = (candidate ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

/** Mostra como a campanha aparece no Google e nas redes sociais. */
export function SharePreview({
  value,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
  url,
}: SharePreviewProps) {
  const title = pick(value.og_title, value.seo_title, fallbackTitle);
  const description = pick(value.og_description, value.seo_description, fallbackDescription);
  const image = resolveImage(value.og_image, value.share_image, fallbackImage);
  const twitterTitle = pick(value.twitter_title, title);
  const twitterDescription = pick(value.twitter_description, description);
  const twitterImage = resolveImage(
    value.twitter_image,
    value.og_image,
    value.share_image,
    fallbackImage,
  );
  const host = url.replace(/^https?:\/\//, "").split("/")[0] ?? "";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Resultado no Google
        </p>
        <div className="space-y-1 rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe aria-hidden="true" className="size-3.5" />
            {host}
          </p>
          <p className="line-clamp-1 text-base text-primary">{title || "Título da campanha"}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description || "Adicione uma meta description para melhorar a indexação."}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Card social (Open Graph)
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {image ? (
            <img
              src={image}
              alt=""
              loading="lazy"
              className="aspect-[1.91/1] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-muted text-xs text-muted-foreground">
              Sem imagem de compartilhamento
            </div>
          )}
          <div className="space-y-1 p-3">
            <p className="flex items-center gap-1.5 text-[11px] uppercase text-muted-foreground">
              <Link2 aria-hidden="true" className="size-3" />
              {host}
            </p>
            <p className="line-clamp-1 text-sm font-semibold">{title || "Título da campanha"}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 md:col-span-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Twitter / X Card
        </p>
        <div className="flex gap-3 overflow-hidden rounded-xl border border-border bg-card p-3">
          {twitterImage ? (
            <img
              src={twitterImage}
              alt=""
              loading="lazy"
              className="size-20 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
              Sem imagem
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <p className="line-clamp-1 text-sm font-semibold">{twitterTitle || "Título"}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{twitterDescription}</p>
            <p className="text-[11px] text-muted-foreground">{host}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
