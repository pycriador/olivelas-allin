export interface SeoOptions {
  title: string;
  description?: string | null;
  url?: string | null;
  image?: string | null;
  keywords?: string | null;
  type?: string;
  publishedTime?: string | null;
  modifiedTime?: string | null;
}

export function buildSeoMeta(options: SeoOptions): Array<Record<string, string>> {
  const meta: Array<Record<string, string>> = [];
  meta.push({ title: options.title });
  if (options.description) {
    meta.push({ name: "description", content: options.description });
    meta.push({ property: "og:description", content: options.description });
    meta.push({ name: "twitter:description", content: options.description });
  }
  meta.push({ property: "og:title", content: options.title });
  meta.push({ property: "og:type", content: options.type ?? "website" });
  if (options.url) meta.push({ property: "og:url", content: options.url });
  if (options.image) {
    meta.push({ property: "og:image", content: options.image });
    meta.push({ property: "og:image:width", content: "1200" });
    meta.push({ property: "og:image:height", content: "630" });
    meta.push({ name: "twitter:image", content: options.image });
  }
  meta.push({
    name: "twitter:card",
    content: options.image ? "summary_large_image" : "summary",
  });
  meta.push({ name: "twitter:title", content: options.title });
  if (options.keywords) meta.push({ name: "keywords", content: options.keywords });
  return meta;
}

export interface JsonLdProductOptions {
  name: string;
  description?: string | null;
  image?: string | null;
  price: number;
  currency?: string;
  url?: string | null;
  availability?: string;
  brand?: string | null;
}

export function buildJsonLdProduct(options: JsonLdProductOptions): {
  type: string;
  children: string;
} {
  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: options.name,
    description: options.description ?? undefined,
    image: options.image ?? undefined,
    url: options.url ?? undefined,
    brand: options.brand ? { "@type": "Brand", name: options.brand } : undefined,
    offers: {
      "@type": "Offer",
      price: options.price,
      priceCurrency: options.currency ?? "BRL",
      availability: options.availability ?? "https://schema.org/InStock",
    },
  };
  return { type: "application/ld+json", children: JSON.stringify(product) };
}

export function buildJsonLdWebPage(options: {
  title: string;
  description?: string | null;
  url?: string | null;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  image?: string | null;
}): { type: string; children: string } {
  const page = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: options.title,
    description: options.description ?? undefined,
    url: options.url ?? undefined,
    image: options.image ?? undefined,
    datePublished: options.publishedTime ?? undefined,
    dateModified: options.modifiedTime ?? undefined,
  };
  return { type: "application/ld+json", children: JSON.stringify(page) };
}
