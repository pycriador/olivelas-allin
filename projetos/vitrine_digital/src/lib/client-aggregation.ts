import { supabase } from "@/integrations/supabase/client";

export interface ClientServiceItem {
  id: string;
  name: string;
  price?: string;
  type: "service" | "product" | "promotion";
  description?: string;
  category?: string;
  sourceArtId: string;
  sourceImageUrl?: string;
  sourceBusinessName?: string;
  sourceCreatedAt: string;
}

export interface ClientPortfolio {
  clientId: string;
  normalizedPhone: string;
  formattedPhone: string;
  clientName: string;
  totalArts: number;
  totalServices: number;
  services: ClientServiceItem[];
  arts: Array<{
    id: string;
    imageUrl?: string;
    businessName?: string;
    category?: string;
    createdAt: string;
    status?: string;
  }>;
}

/**
 * Normaliza qualquer formato de telefone brasileiro para formato numérico do WhatsApp.
 * Exemplos:
 * "(11) 99999-9999" -> "5511999999999"
 * "+55 11 98888-7777" -> "5511988887777"
 * "11999999999" -> "5511999999999"
 */
export function cleanPhoneForWhatsApp(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";

  // Se tem 10 ou 11 dígitos (DDD + número), prefixa com 55 (Brasil)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Se já começa com 55 e tem 12 ou 13 dígitos
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  return digits;
}

/**
 * Formata número de telefone para exibição amigável
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  const digits = cleanPhoneForWhatsApp(phone);
  if (!digits) return "";

  // Formato: +55 (11) 99999-9999
  if (digits.length === 13 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const part1 = digits.slice(4, 9);
    const part2 = digits.slice(9);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  if (digits.length === 12 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const part1 = digits.slice(4, 8);
    const part2 = digits.slice(8);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  return phone ? String(phone) : "";
}

/**
 * Gera um identificador de cliente legível baseado no telefone normalizado
 */
export function generateClientId(phone: string | null | undefined): string {
  const cleaned = cleanPhoneForWhatsApp(phone);
  if (!cleaned) return "CLI-ANONIMO";
  return `CLI-WPP-${cleaned.slice(-8).toUpperCase()}`;
}

/**
 * Extrai telefone WhatsApp e telefones de contato de um registro de análise
 */
export function extractContactsFromAnalysis(analysis: unknown, fallbackPhone?: string | null): {
  whatsapp: string | null;
  phones: string[];
} {
  const phones: string[] = [];
  let whatsapp: string | null = null;

  if (fallbackPhone) {
    const cleanFallback = cleanPhoneForWhatsApp(fallbackPhone);
    if (cleanFallback) {
      phones.push(cleanFallback);
      whatsapp = cleanFallback;
    }
  }

  if (analysis && typeof analysis === "object") {
    const a = analysis as Record<string, unknown>;
    const c = a["contacts"] as Record<string, unknown> | undefined;

    if (c) {
      if (typeof c["whatsapp"] === "string" && c["whatsapp"].trim()) {
        const cleaned = cleanPhoneForWhatsApp(c["whatsapp"]);
        if (cleaned) {
          whatsapp = cleaned;
          if (!phones.includes(cleaned)) phones.push(cleaned);
        }
      }

      if (Array.isArray(c["phones"])) {
        c["phones"].forEach((p) => {
          if (typeof p === "string" && p.trim()) {
            const cleaned = cleanPhoneForWhatsApp(p);
            if (cleaned && !phones.includes(cleaned)) {
              phones.push(cleaned);
              if (!whatsapp) whatsapp = cleaned;
            }
          }
        });
      }
    }
  }

  return { whatsapp, phones };
}

/**
 * Extrai todos os itens de serviços, produtos e promoções de um registro
 */
export function extractServicesAndProducts(
  analysis: unknown,
  artId: string,
  businessName?: string | null,
  imageUrl?: string | null,
  createdAt?: string
): ClientServiceItem[] {
  if (!analysis || typeof analysis !== "object") return [];

  const a = analysis as Record<string, unknown>;
  const list: ClientServiceItem[] = [];
  const sourceDate = createdAt || new Date().toISOString();
  const bizName = businessName || (typeof (a["business"] as Record<string, unknown>)?.["name"] === "string" ? String((a["business"] as Record<string, unknown>)["name"]) : undefined);
  const category = (typeof (a["business"] as Record<string, unknown>)?.["category"] === "string" ? String((a["business"] as Record<string, unknown>)["category"]) : undefined);

  // 1. Serviços ("services")
  if (Array.isArray(a["services"])) {
    a["services"].forEach((s, idx) => {
      if (typeof s === "string" && s.trim()) {
        list.push({
          id: `${artId}_svc_${idx}`,
          name: s.trim(),
          type: "service",
          category,
          sourceArtId: artId,
          sourceImageUrl: imageUrl || undefined,
          sourceBusinessName: bizName,
          sourceCreatedAt: sourceDate,
        });
      } else if (typeof s === "object" && s !== null) {
        const rec = s as Record<string, unknown>;
        const name = String(rec["name"] || rec["title"] || rec["service"] || rec["description"] || "");
        if (name.trim()) {
          list.push({
            id: `${artId}_svc_${idx}`,
            name: name.trim(),
            price: rec["price"] ? String(rec["price"]) : undefined,
            type: "service",
            description: rec["description"] ? String(rec["description"]) : undefined,
            category,
            sourceArtId: artId,
            sourceImageUrl: imageUrl || undefined,
            sourceBusinessName: bizName,
            sourceCreatedAt: sourceDate,
          });
        }
      }
    });
  }

  // 2. Produtos ("products" & "prices")
  const prods = Array.isArray(a["products"]) ? a["products"] : [];
  const prices = Array.isArray(a["prices"]) ? a["prices"] : [];

  prods.forEach((p, idx) => {
    if (typeof p === "string" && p.trim()) {
      list.push({
        id: `${artId}_prd_${idx}`,
        name: p.trim(),
        price: typeof prices[idx] === "string" ? prices[idx] : undefined,
        type: "product",
        category,
        sourceArtId: artId,
        sourceImageUrl: imageUrl || undefined,
        sourceBusinessName: bizName,
        sourceCreatedAt: sourceDate,
      });
    } else if (typeof p === "object" && p !== null) {
      const rec = p as Record<string, unknown>;
      const name = String(rec["name"] || rec["title"] || rec["description"] || "");
      if (name.trim()) {
        list.push({
          id: `${artId}_prd_${idx}`,
          name: name.trim(),
          price: rec["price"] ? String(rec["price"]) : (typeof prices[idx] === "string" ? prices[idx] : undefined),
          type: "product",
          description: rec["description"] ? String(rec["description"]) : undefined,
          category,
          sourceArtId: artId,
          sourceImageUrl: imageUrl || undefined,
          sourceBusinessName: bizName,
          sourceCreatedAt: sourceDate,
        });
      }
    }
  });

  // 3. Promoções ("promotions")
  if (Array.isArray(a["promotions"])) {
    a["promotions"].forEach((promo, idx) => {
      if (typeof promo === "string" && promo.trim()) {
        list.push({
          id: `${artId}_prm_${idx}`,
          name: promo.trim(),
          type: "promotion",
          category,
          sourceArtId: artId,
          sourceImageUrl: imageUrl || undefined,
          sourceBusinessName: bizName,
          sourceCreatedAt: sourceDate,
        });
      }
    });
  }

  return list;
}

export interface GenericStoreRow {
  id: string;
  created_at: string;
  image_url: string | null;
  image_path?: string | null;
  business_name: string | null;
  category: string | null;
  title: string | null;
  summary: string | null;
  keywords: string[] | null;
  analysis: unknown;
  status?: string;
  sender_phone?: string | null;
  sender_name?: string | null;
}

export interface GroupedAdvertiser {
  id: string; // Primary ID (ID do anúncio mais recente)
  advertiserKey: string;
  businessName: string;
  category?: string;
  summary?: string;
  phone?: string;
  formattedPhone?: string;
  primaryImageUrl?: string;
  images: Array<{
    id: string;
    imageUrl: string;
    createdAt: string;
    businessName?: string;
    category?: string;
  }>;
  totalPublications: number;
  productsList: Array<{ name: string; price?: string; sourceId: string }>;
  servicesList: Array<{ name: string; price?: string; sourceId: string }>;
  allServices: ClientServiceItem[];
  keywords: string[];
  rawRows: GenericStoreRow[];
  latestCreatedAt: string;
  isVisibleInStore: boolean;
}

/**
 * Normaliza o nome do anunciante para agrupamento inteligente
 */
export function normalizeAdvertiserName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

const GENERIC_NAMES = new Set([
  "comercio",
  "loja",
  "anuncio",
  "estabelecimento",
  "promocao",
  "oferta",
  "produto",
  "servico",
  "empresa",
  "vendas",
  "anunciocomercial",
]);

/**
 * Resolve a URL de uma imagem no Supabase Storage.
 * Suporta URLs assinadas existentes, URLs públicas e caminhos relativos do bucket 'images'.
 */
export function getPermanentImageUrl(url?: string | null, path?: string | null): string | null {
  // 1. Se possuir URL completa válida (seja assinada com token ou pública)
  if (url && typeof url === "string" && url.trim()) {
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
      return trimmed;
    }
  }

  // 2. Se possuir image_path do Storage, gera a URL do bucket 'images'
  if (path && typeof path === "string" && path.trim()) {
    const cleanPath = path.trim().replace(/^\/+/, "");
    if (!cleanPath.startsWith("http://") && !cleanPath.startsWith("https://")) {
      const { data } = supabase.storage.from("images").getPublicUrl(cleanPath);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }
  }

  return url?.trim() || null;
}

/**
 * Trata erros de carregamento de imagem de forma inteligente:
 * Se a URL assinada expirou -> tenta URL pública.
 * Se a URL pública falhou (bucket privado) -> tenta re-assinar em tempo real pelo cliente Supabase.
 */
export function handleImageFallback(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  const currentSrc = target.src;

  // Evita loops infinitos
  if (target.dataset["failed"] === "true") return;

  if (currentSrc.includes("/storage/v1/object/sign/images/")) {
    target.src = currentSrc.replace("/storage/v1/object/sign/images/", "/storage/v1/object/public/images/").split("?")[0];
  } else if (currentSrc.includes("/storage/v1/object/public/images/")) {
    const cleanPath = currentSrc.split("/storage/v1/object/public/images/")[1]?.split("?")[0];
    if (cleanPath) {
      supabase.storage.from("images").createSignedUrl(cleanPath, 60 * 60 * 24 * 30)
        .then(({ data }) => {
          if (data?.signedUrl && target.src !== data.signedUrl) {
            target.src = data.signedUrl;
          } else {
            target.dataset["failed"] = "true";
          }
        })
        .catch(() => {
          target.dataset["failed"] = "true";
        });
    }
  } else {
    target.dataset["failed"] = "true";
  }
}

/**
 * Verifica se um registro de análise foi concluído com sucesso e possui dados estruturados da IA.
 * Descarta registros explicitamente com erro/falha ou pendentes sem dados.
 */
export function isAnalysisReady(row: GenericStoreRow | { status?: string | null; analysis?: unknown; business_name?: string | null; title?: string | null; image_url?: string | null; image_path?: string | null } | null | undefined): boolean {
  if (!row) return false;
  const status = (row.status || "").toLowerCase().trim();

  // Status de falha explícita não pode ir para a vitrine
  if (status === "failed" || status === "error" || status === "rejected") {
    return false;
  }

  // Se estiver pendente ou em processamento sem dados
  if ((status === "pending" || status === "processing") && (!row.analysis || typeof row.analysis !== "object")) {
    return false;
  }

  // Se houver análise estruturada
  if (row.analysis && typeof row.analysis === "object") {
    const analysisObj = row.analysis as Record<string, unknown>;
    if (analysisObj["error"] || analysisObj["errorMessage"]) {
      return false;
    }
    return true;
  }

  // Se houver nome comercial, título ou imagem associada
  if (row.business_name || row.title || row.image_url || row.image_path) {
    return true;
  }

  return false;
}

/**
 * Agrupa linhas de publicações por Anunciante (Telefone WhatsApp ou Nome Comercial),
 * unificando múltiplos anúncios de um mesmo anunciante em 1 ÚNICO CARD.
 * Por padrão, inclui SOMENTE publicações com análise concluída com sucesso.
 */
export function groupRowsByAdvertiser<T extends GenericStoreRow>(
  rows: T[],
  options?: { requireCompleted?: boolean }
): GroupedAdvertiser[] {
  if (!rows || rows.length === 0) return [];

  const requireCompleted = options?.requireCompleted ?? true;
  const filteredRows = requireCompleted ? rows.filter((r) => isAnalysisReady(r)) : rows;

  if (filteredRows.length === 0) return [];

  // Mapeia tokens de cada linha para formar clusters conectados (Union-Find)
  const n = filteredRows.length;
  const parent: number[] = Array.from({ length: n }, (_, i) => i);

  function find(i: number): number {
    if (parent[i] === i) return i;
    parent[i] = find(parent[i]);
    return parent[i];
  }

  function union(i: number, j: number) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
    }
  }

  // Extrai chaves / tokens para cada linha
  const rowTokens: string[][] = filteredRows.map((row) => {
    const tokens: string[] = [];
    const { whatsapp, phones } = extractContactsFromAnalysis(row.analysis, row.sender_phone);

    // Telefones normalizados (últimos 8 dígitos garantem correspondência precisa mesmo com variação de DDD ou prefixo +55)
    if (whatsapp && whatsapp.length >= 8) {
      tokens.push(`phone:${whatsapp.slice(-8)}`);
    }
    phones.forEach((p) => {
      if (p && p.length >= 8) {
        tokens.push(`phone:${p.slice(-8)}`);
      }
    });

    // Nome comercial
    const bizRaw =
      row.business_name ||
      row.title ||
      ((row.analysis && typeof row.analysis === "object")
        ? ((row.analysis as Record<string, unknown>)["business"] as Record<string, unknown>)?.["name"]
        : "") ||
      "";

    const bizNorm = normalizeAdvertiserName(String(bizRaw));
    if (bizNorm.length >= 3 && !GENERIC_NAMES.has(bizNorm)) {
      tokens.push(`biz:${bizNorm}`);
    }

    // Se nenhum telefone ou nome for encontrado, chave única pelo próprio ID
    if (tokens.length === 0) {
      tokens.push(`id:${row.id}`);
    }

    return tokens;
  });

  // Mapeia cada token para os índices das linhas que o possuem
  const tokenToRows = new Map<string, number[]>();
  rowTokens.forEach((tokens, idx) => {
    tokens.forEach((tok) => {
      const list = tokenToRows.get(tok) || [];
      list.push(idx);
      tokenToRows.set(tok, list);
    });
  });

  // Realiza a união entre linhas que compartilham qualquer token
  tokenToRows.forEach((indices) => {
    if (indices.length > 1) {
      const first = indices[0];
      for (let k = 1; k < indices.length; k++) {
        union(first, indices[k]);
      }
    }
  });

  // Agrupa os índices por raiz do cluster
  const clusters = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const list = clusters.get(root) || [];
    list.push(i);
    clusters.set(root, list);
  }

  // Monta os objetos GroupedAdvertiser
  const groupedList: GroupedAdvertiser[] = [];

  clusters.forEach((indices) => {
    const clusterRows = indices.map((i) => filteredRows[i]);
    // Ordena do mais recente para o mais antigo
    clusterRows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const primaryRow = clusterRows[0];
    const latestDate = primaryRow.created_at;

    // Detecta o melhor nome do estabelecimento
    let bestName = "";
    for (const r of clusterRows) {
      const bName =
        r.business_name ||
        ((r.analysis && typeof r.analysis === "object")
          ? ((r.analysis as Record<string, unknown>)["business"] as Record<string, unknown>)?.["name"]
          : null) ||
        r.title;
      if (bName && String(bName).trim()) {
        bestName = String(bName).trim();
        break;
      }
    }
    if (!bestName) bestName = "Anúncio Comercial";

    // Detecta o melhor telefone de contato
    let bestPhone = "";
    for (const r of clusterRows) {
      const { whatsapp, phones } = extractContactsFromAnalysis(r.analysis, r.sender_phone);
      if (whatsapp) {
        bestPhone = whatsapp;
        break;
      }
      if (phones.length > 0 && phones[0]) {
        bestPhone = phones[0];
        break;
      }
    }

    // Coleta e deduplica todas as imagens das publicações
    const images: GroupedAdvertiser["images"] = [];
    const seenImages = new Set<string>();

    clusterRows.forEach((r) => {
      const resolvedImg = getPermanentImageUrl(r.image_url, r.image_path);
      if (resolvedImg && !seenImages.has(resolvedImg)) {
        seenImages.add(resolvedImg);
        images.push({
          id: r.id,
          imageUrl: resolvedImg,
          createdAt: r.created_at,
          businessName: r.business_name || r.title || undefined,
          category: r.category || undefined,
        });
      }
    });

    // Coleta todos os serviços e produtos de todas as publicações do cluster
    const allServices: ClientServiceItem[] = [];
    const productsMap = new Map<string, { name: string; price?: string; sourceId: string }>();
    const servicesMap = new Map<string, { name: string; price?: string; sourceId: string }>();

    clusterRows.forEach((r) => {
      const resolvedImg = getPermanentImageUrl(r.image_url, r.image_path);
      const extracted = extractServicesAndProducts(
        r.analysis,
        r.id,
        r.business_name,
        resolvedImg,
        r.created_at
      );
      allServices.push(...extracted);

      extracted.forEach((item) => {
        const itemKey = `${normalizeAdvertiserName(item.name)}__${item.price || ""}`;
        if (item.type === "product" || item.type === "promotion") {
          if (!productsMap.has(itemKey)) {
            productsMap.set(itemKey, {
              name: item.name,
              price: item.price,
              sourceId: item.sourceArtId,
            });
          }
        } else if (item.type === "service") {
          if (!servicesMap.has(itemKey)) {
            servicesMap.set(itemKey, {
              name: item.name,
              price: item.price,
              sourceId: item.sourceArtId,
            });
          }
        }
      });
    });

    // Coleta e deduplica todas as palavras-chave
    const allKeywords = new Set<string>();
    clusterRows.forEach((r) => {
      if (Array.isArray(r.keywords)) {
        r.keywords.forEach((kw) => {
          if (kw && typeof kw === "string" && kw.trim()) {
            allKeywords.add(kw.trim());
          }
        });
      }
    });

    // Determina visibilidade na vitrine
    let isVisible = true;
    for (const r of clusterRows) {
      if (r.analysis && typeof r.analysis === "object") {
        const a = r.analysis as Record<string, unknown>;
        if (a["is_visible_in_store"] === false || a["isVisibleInStore"] === false) {
          isVisible = false;
          break;
        }
      }
    }

    const primaryImageUrl = images[0]?.imageUrl || getPermanentImageUrl(primaryRow.image_url, primaryRow.image_path) || undefined;

    groupedList.push({
      id: primaryRow.id,
      advertiserKey: bestPhone ? `wpp:${bestPhone}` : `biz:${normalizeAdvertiserName(bestName)}`,
      businessName: bestName,
      category: primaryRow.category || clusterRows.find((r) => r.category)?.category || undefined,
      summary: primaryRow.summary || clusterRows.find((r) => r.summary)?.summary || undefined,
      phone: bestPhone || undefined,
      formattedPhone: bestPhone ? formatPhoneNumber(bestPhone) : undefined,
      primaryImageUrl,
      images,
      totalPublications: clusterRows.length,
      productsList: Array.from(productsMap.values()),
      servicesList: Array.from(servicesMap.values()),
      allServices,
      keywords: Array.from(allKeywords),
      rawRows: clusterRows,
      latestCreatedAt: latestDate,
      isVisibleInStore: isVisible,
    });
  });

  // Ordena os cards dos anunciantes do mais recente para o mais antigo
  groupedList.sort(
    (a, b) => new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime()
  );

  return groupedList;
}

/**
 * Busca todo o portfólio de artes e serviços de um anúncio ou número de WhatsApp no Supabase
 */
export async function getClientPortfolio(
  targetId?: string | null,
  targetPhone?: string | null,
  targetBusinessName?: string | null
): Promise<ClientPortfolio | null> {
  try {
    const { data: analyses, error } = await supabase
      .from("image_analysis")
      .select("id, created_at, image_url, image_path, business_name, category, title, summary, keywords, analysis, status")
      .order("created_at", { ascending: false });

    if (error || !analyses || analyses.length === 0) {
      return null;
    }

    const grouped = groupRowsByAdvertiser(analyses as unknown as GenericStoreRow[]);

    // Encontra o grupo do anunciante que contém o targetId, targetPhone ou targetBusinessName
    let matchedGroup: GroupedAdvertiser | undefined;

    if (targetId) {
      matchedGroup = grouped.find((g) => g.rawRows.some((r) => r.id === targetId));
    }

    if (!matchedGroup && targetPhone) {
      const cleanTarget = cleanPhoneForWhatsApp(targetPhone);
      if (cleanTarget && cleanTarget.length >= 8) {
        matchedGroup = grouped.find(
          (g) =>
            (g.phone && g.phone.includes(cleanTarget.slice(-8))) ||
            g.rawRows.some((r) => {
              const { whatsapp, phones } = extractContactsFromAnalysis(r.analysis);
              return (
                (whatsapp && whatsapp.includes(cleanTarget.slice(-8))) ||
                phones.some((p) => p.includes(cleanTarget.slice(-8)))
              );
            })
        );
      }
    }

    if (!matchedGroup && targetBusinessName) {
      const targetNorm = normalizeAdvertiserName(targetBusinessName);
      if (targetNorm.length >= 3) {
        matchedGroup = grouped.find(
          (g) => normalizeAdvertiserName(g.businessName) === targetNorm
        );
      }
    }

    if (!matchedGroup) {
      return null;
    }

    const arts = matchedGroup.images.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      businessName: img.businessName || matchedGroup!.businessName,
      category: img.category || matchedGroup!.category,
      createdAt: img.createdAt,
    }));

    return {
      clientId: generateClientId(matchedGroup.phone),
      normalizedPhone: matchedGroup.phone || "",
      formattedPhone: matchedGroup.formattedPhone || "",
      clientName: matchedGroup.businessName,
      totalArts: matchedGroup.totalPublications,
      totalServices: matchedGroup.allServices.length,
      services: matchedGroup.allServices,
      arts,
    };
  } catch (e) {
    console.error("Erro ao agregar portfólio completo do anunciante:", e);
    return null;
  }
}

/**
 * Função de retrocompatibilidade para busca por telefone
 */
export async function getClientPortfolioByPhone(
  targetPhone: string | null | undefined
): Promise<ClientPortfolio | null> {
  return getClientPortfolio(null, targetPhone, null);
}

