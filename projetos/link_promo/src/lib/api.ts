import { supabase } from "@/integrations/supabase/client";

export async function scrapeProduct(url: string) {
  const { data, error } = await supabase.functions.invoke("scrape-product", {
    body: { url },
  });

  if (error) {
    throw new Error(error.message || "Erro ao coletar dados do produto");
  }

  if (!data?.success) {
    throw new Error(data?.error || "Erro ao coletar dados do produto");
  }

  return data.data;
}

export async function shortenUrl(url: string) {
  const { data, error } = await supabase.functions.invoke("shorten-url", {
    body: { url },
  });

  if (error) {
    throw new Error(error.message || "Erro ao encurtar URL");
  }

  if (!data?.success) {
    throw new Error(data?.error || "Erro ao encurtar URL");
  }

  return data.shortUrl as string;
}

export function applyTemplate(
  template: string,
  data: {
    productName: string;
    oldPrice: string;
    newPrice: string;
    installments: string;
    link: string;
  }
) {
  return template
    .replace(/\{\{nome_produto\}\}/g, data.productName || "—")
    .replace(/\{\{preco_antigo\}\}/g, data.oldPrice || "—")
    .replace(/\{\{preco_novo\}\}/g, data.newPrice || "—")
    .replace(/\{\{parcelas\}\}/g, data.installments || "—")
    .replace(/\{\{link\}\}/g, data.link || "—");
}
