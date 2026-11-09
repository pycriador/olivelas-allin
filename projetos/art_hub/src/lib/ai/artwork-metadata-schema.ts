import { z } from "zod";

const strOrNull = z.union([z.string(), z.null()]).optional().transform((v) => v ?? null);
const boolOrNull = z.union([z.boolean(), z.null()]).optional().transform((v) => (v == null ? null : v));
const arr = z
  .union([z.array(z.string()), z.null()])
  .optional()
  .transform((v) => (Array.isArray(v) ? v.filter(Boolean) : []));

export const artworkMetadataSchema = z.object({
  title_suggested: strOrNull,
  description: strOrNull,
  short_summary: strOrNull,
  keywords: arr,
  tags: arr,
  theme: strOrNull,
  occasion: strOrNull,
  style: strOrNull,
  illustration_type: strOrNull,
  predominant_colors: arr,
  objects: arr,
  has_people: boolOrNull,
  has_animals: boolOrNull,
  decorative_elements: arr,
  typography_type: strOrNull,
  emotion: strOrNull,
  target_audience: strOrNull,
  commemorative_date: strOrNull,
  compatible_products: arr,
  suggested_category: strOrNull,
  suggested_collection: strOrNull,
});

export type ArtworkMetadata = z.infer<typeof artworkMetadataSchema>;

export function renderPrompt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{{${key}}}`,
  );
}

export function buildEmbeddingText(meta: ArtworkMetadata, fallbackTitle?: string | null): string {
  const parts = [
    meta.title_suggested ?? fallbackTitle ?? "",
    meta.short_summary ?? "",
    meta.description ?? "",
    meta.theme ?? "",
    meta.occasion ?? "",
    meta.style ?? "",
    meta.emotion ?? "",
    meta.target_audience ?? "",
    (meta.keywords ?? []).join(", "),
    (meta.tags ?? []).join(", "),
    (meta.objects ?? []).join(", "),
    (meta.decorative_elements ?? []).join(", "),
  ].filter(Boolean);
  return parts.join(" \n").slice(0, 4000);
}
