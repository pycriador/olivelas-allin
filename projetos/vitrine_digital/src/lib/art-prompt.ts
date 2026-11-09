/**
 * Módulo de Engenharia de Prompts para Refazer Arte Publicitária com IA
 * Suporta Midjourney v6, Flux.1, DALL-E 3, Stable Diffusion XL e Recraft
 */

export type DirectiveCategory =
  | "format"
  | "information"
  | "anti_ai"
  | "art_direction"
  | "typography"
  | "camera";

export type ArtDirective = {
  id: string;
  category: DirectiveCategory;
  label: string;
  description: string;
  defaultActive: boolean;
  promptPt: string;
  promptEn: string;
};

export const DIRECTIVE_CATEGORIES: Array<{
  id: DirectiveCategory;
  name: string;
  icon: string;
}> = [
  { id: "format", name: "Formato & Proporções", icon: "📐" },
  { id: "information", name: "Informações & Conteúdo", icon: "📝" },
  { id: "anti_ai", name: "Anti-Clichê IA & Realismo", icon: "🛡️" },
  { id: "art_direction", name: "Direção de Arte & Iluminação", icon: "🎨" },
  { id: "typography", name: "Diagramação & Tipografia", icon: "🔤" },
  { id: "camera", name: "Câmera & Qualidade Técnica", icon: "📷" },
];

export const ART_DIRECTIVES: ArtDirective[] = [
  // 1. Formato & Proporções (4 itens)
  {
    id: "format_story_9_16",
    category: "format",
    label: "Formato Story / WhatsApp Status (9:16 vertical)",
    description: "Ideal para visualização em tela cheia no Instagram Stories, WhatsApp Status e TikTok.",
    defaultActive: true,
    promptPt: "Composição vertical em proporção 9:16 otimizada para Stories do Instagram e Status do WhatsApp.",
    promptEn: "Vertical 9:16 aspect ratio composition optimized for mobile Instagram Stories and WhatsApp Status --ar 9:16",
  },
  {
    id: "format_feed_portrait_4_5",
    category: "format",
    label: "Formato Feed Vertical (4:5 portrait)",
    description: "Maior retenção e área de tela no feed do Instagram e Facebook.",
    defaultActive: false,
    promptPt: "Composição vertical em proporção 4:5 para feed do Instagram com alto impacto visual.",
    promptEn: "Vertical 4:5 portrait ratio framing optimized for Instagram feed prominence --ar 4:5",
  },
  {
    id: "format_feed_square_1_1",
    category: "format",
    label: "Formato Feed Quadrado (1:1 clássico)",
    description: "Proporção clássica universal compatível com qualquer rede social e catálogo.",
    defaultActive: false,
    promptPt: "Composição quadrada 1:1 equilibrada para catálogo e postagens gerais.",
    promptEn: "Square 1:1 aspect ratio composition with centered visual balance --ar 1:1",
  },
  {
    id: "format_banner_16_9",
    category: "format",
    label: "Formato Banner Horizontal (16:9 widescreen)",
    description: "Ideal para capas, banners de sites, YouTube e telões.",
    defaultActive: false,
    promptPt: "Composição widescreen horizontal 16:9 para banners promocionais e cabeçalhos.",
    promptEn: "Widescreen horizontal 16:9 banner composition with wide visual breathing space --ar 16:9",
  },

  // 2. Informações & Conteúdo (6 itens)
  {
    id: "info_all_relevant",
    category: "information",
    label: "Todas as informações relevantes na imagem",
    description: "Inclui nome do negócio, produtos, ofertas, preços e formas de contato com máxima fidelidade.",
    defaultActive: true,
    promptPt: "Incluir todas as informações essenciais coletadas: nome da empresa, produtos, preços, contatos e chamadas de ação.",
    promptEn: "Ensure all critical business data is legibly integrated: brand name, showcased products, clear price tags, contacts and promo highlights.",
  },
  {
    id: "info_hero_product",
    category: "information",
    label: "Destacar produto / oferta principal com foco prioritário",
    description: "Dá ênfase visual de primeiro plano ao item principal com iluminação e destaque.",
    defaultActive: true,
    promptPt: "O produto principal ou oferta principal deve ser o ponto focal central e irresistível da arte.",
    promptEn: "The hero product must be the glorious central focal point with prominent staging and crisp lighting.",
  },
  {
    id: "info_clean_contacts",
    category: "information",
    label: "Contatos e WhatsApp organizados e legíveis",
    description: "Área de rodapé ou selo limpo contendo WhatsApp, Instagram e telefone.",
    defaultActive: true,
    promptPt: "Área de contato moderna e ultra legível contendo ícones sutis de WhatsApp, Instagram e telefone.",
    promptEn: "Modern and ultra-legible contact strip with clean WhatsApp number, Instagram handle, and address badge.",
  },
  {
    id: "info_accurate_pricing",
    category: "information",
    label: "Selo de preço e valores em destaque",
    description: "Formata os valores em etiquetas/tags sofisticadas sem poluir o visual.",
    defaultActive: true,
    promptPt: "Exibir os preços em selos gráficos elegantes com tipografia destacada e moedas formatadas.",
    promptEn: "Display product prices inside elegant graphic badges with sharp typography and formatted currency tags.",
  },
  {
    id: "info_clear_cta",
    category: "information",
    label: "Chamada para ação destacada (CTA / Peça Já)",
    description: "Adiciona botões visuais como 'Peça já pelo WhatsApp', 'Clique aqui' ou 'Garanta o seu'.",
    defaultActive: true,
    promptPt: "Botão ou faixa chamativa de chamada para ação convidando o cliente a entrar em contato imediatamente.",
    promptEn: "Distinct call-to-action button or ribbon such as 'Order Now on WhatsApp' or 'Limited Time Offer'.",
  },
  {
    id: "info_exact_visual_fidelity",
    category: "information",
    label: "Descrever produtos exatamente como são (fidelidade física e visual)",
    description: "Ex.: brigadeiros redondos e esféricos, granulados finos, chocolate marrom escuro, forminhas plissadas, crosta dourada, etc.",
    defaultActive: true,
    promptPt: "Descrever e reproduzir os produtos com absoluta fidelidade às suas formas físicas reais: formato geométrico exato (esférico/redondo, fatias, etc.), granulados e confeitos finos perfeitamente distribuídos, cor do chocolate marrom escuro e texturas táteis autênticas.",
    promptEn: "Depict showcased products with precise real-world physical fidelity: exact geometry (perfectly round/spherical for brigadeiros), fine evenly-distributed sprinkles, rich deep brown chocolate tones, and authentic tactile textures.",
  },
  {
    id: "info_promo_badge",
    category: "information",
    label: "Selo promocional / Desconto de impacto",
    description: "Destaca termos como 'Oferta Especial', 'Promoção da Semana' ou descontos identificados.",
    defaultActive: true,
    promptPt: "Selo de promoção contemporâneo e chamativo comunicando a exclusividade da oferta.",
    promptEn: "Modern promotional badge highlighting discounts, limited edition, or special weekly deals.",
  },

  // 3. Anti-Clichê IA & Realismo (7 itens)
  {
    id: "anti_ai_look",
    category: "anti_ai",
    label: "Não deixar com cara de montagem/geração de IA",
    description: "Elimina texturas plásticas, brilhos irreais e aberrações cromáticas sintéticas.",
    defaultActive: true,
    promptPt: "Evitar estética sintética, plástica ou artificial de IA. Visual de fotografia publicitária real e autêntica.",
    promptEn: "Avoid generic AI look, no plastic skin, no CGI artifacts, look like an authentic award-winning studio photograph.",
  },
  {
    id: "anti_ai_vibrant_colors",
    category: "anti_ai",
    label: "Não colocar padrões e cores vibrantes artificiais de IA",
    description: "Evita gradientes néon, roxos saturados e explosões de partículas genéricas.",
    defaultActive: true,
    promptPt: "Evitar saturação excessiva de néon, gradientes artificiais de IA e explosões de partículas flutuantes.",
    promptEn: "No oversaturated neon gradients, no gaudy purple-magenta AI glows, no unnecessary floating particles.",
  },
  {
    id: "anti_ai_keep_faces",
    category: "anti_ai",
    label: "Não mudar o rosto / Preservar identidade de pessoas",
    description: "Mantém proporções faciais e expressões humanas naturais e realistas.",
    defaultActive: true,
    promptPt: "Preservar feições humanas realistas, textura de pele natural com poros reais, sem distorção facial.",
    promptEn: "Preserve authentic natural human facial features, realistic skin texture with visible pores, no uncanny valley.",
  },
  {
    id: "anti_ai_hands_anatomy",
    category: "anti_ai",
    label: "Evitar anomalias anatômicas e dedos extras",
    description: "Garante anatomia perfeita para mãos, braços e silhuetas.",
    defaultActive: true,
    promptPt: "Anatomia anatômica perfeita, mãos impecáveis com 5 dedos naturais e postura orgânica.",
    promptEn: "Flawless anatomical proportions, perfectly rendered hands with natural 5 fingers, authentic organic posture.",
  },
  {
    id: "anti_ai_no_clutter",
    category: "anti_ai",
    label: "Evitar poluição visual e excesso de elementos soltos",
    description: "Composição limpa onde cada elemento tem um propósito claro.",
    defaultActive: true,
    promptPt: "Sem poluição visual, sem sobrecarga de elementos decorativos flutuantes desnecessários.",
    promptEn: "Clean decluttered layout, no random floating objects, purposeful visual balance.",
  },
  {
    id: "anti_ai_natural_materials",
    category: "anti_ai",
    label: "Texturas realistas e materiais autênticos",
    description: "Madeira, vidro, metal, papel, tecido e comida com aparência tátil real.",
    defaultActive: true,
    promptPt: "Texturas táteis e materiais autênticos com reflexos físicos precisos de luz.",
    promptEn: "Tangible authentic textures: realistic condensation on glass, natural wood grain, genuine paper textures.",
  },
  {
    id: "anti_ai_natural_shadows",
    category: "anti_ai",
    label: "Sombras de contato e oclusão de ambiente naturais",
    description: "Objetos firmemente assentados no chão com sombras físicas coerentes.",
    defaultActive: true,
    promptPt: "Sombras de contato suaves e oclusão de ambiente fisicamente precisa, ancorando os produtos.",
    promptEn: "Physically accurate contact shadows and soft ambient occlusion, grounding objects firmly in the scene.",
  },

  // 4. Direção de Arte & Iluminação (8 itens)
  {
    id: "art_commercial_ad",
    category: "art_direction",
    label: "Fotografia comercial de alto padrão (Commercial Ad)",
    description: "Visual de campanha de grandes marcas e agências renomadas.",
    defaultActive: true,
    promptPt: "Direção de arte no nível de grandes campanhas publicitárias globais de alto orçamento.",
    promptEn: "High-end commercial advertising photography, Michelin-guide or premium brand commercial campaign style.",
  },
  {
    id: "art_macro_food_appeal",
    category: "art_direction",
    label: "Apetite appeal e textura visual irresistível (Food & Product Appeal)",
    description: "Realça o brilho acetinado do chocolate, granulados finos nítidos, crocância e acabamento gourmet.",
    defaultActive: true,
    promptPt: "Texturas gastronômicas de dar água na boca: granulados finos nítidos, brilho acetinado natural do chocolate, crosta dourada crocante e apresentação gourmet em forminhas/suportes adequados.",
    promptEn: "Mouth-watering gourmet product textures: crystal-clear fine chocolate sprinkles, delicate glossy chocolate sheen, golden crispy textures, and elegant plating.",
  },
  {
    id: "art_studio_lighting",
    category: "art_direction",
    label: "Iluminação de estúdio profissional (Softbox & Rim Light)",
    description: "Luz difusa suave com luz de recorte destacando os contornos.",
    defaultActive: true,
    promptPt: "Iluminação profissional de estúdio fotográfico com softbox grande, luz de preenchimento e rim light sutil.",
    promptEn: "Professional 3-point studio lighting setup with large softbox diffusion, subtle fill light and crisp rim lighting.",
  },
  {
    id: "art_cinematic_dof",
    category: "art_direction",
    label: "Profundidade de campo cinematográfica (Bokeh suave)",
    description: "Fundo suavemente desfocado com foco ultra nítido no produto/tema.",
    defaultActive: true,
    promptPt: "Profundidade de campo cinematográfica com abertura f/1.8, bokeh suave e foco cristalino no assunto principal.",
    promptEn: "Cinematic shallow depth of field shot at f/1.8, dreamy cream bokeh in the background, razor-sharp foreground.",
  },
  {
    id: "art_clean_minimalism",
    category: "art_direction",
    label: "Estilo minimalista moderno e elegante (Clean Aesthetic)",
    description: "Estética refinada, moderna e sem ruído visual.",
    defaultActive: true,
    promptPt: "Estética moderna minimalista e sofisticada, transmitindo credibilidade e elegância.",
    promptEn: "Modern minimalist clean aesthetic, elegant spatial distribution, sophisticated luxury feel.",
  },
  {
    id: "art_brand_palette",
    category: "art_direction",
    label: "Harmonia de cores baseada na identidade da marca",
    description: "Utiliza as cores dominantes identificadas na análise para manter coerência.",
    defaultActive: true,
    promptPt: "Paleta cromática harmoniosa respeitando as cores institucionais e o contraste publicitário.",
    promptEn: "Harmonious brand-cohesive color grading with high-contrast complementary color accents.",
  },
  {
    id: "art_warm_appetite",
    category: "art_direction",
    label: "Iluminação apetitosa / Acolhedora (Food & Gastronomy)",
    description: "Realça o brilho, textura e apetite appeal para alimentos e bebidas.",
    defaultActive: true,
    promptPt: "Iluminação quente e convidativa que desperta desejo e realça texturas saborosas de gastronomia.",
    promptEn: "Warm mouth-watering food photography lighting, golden highlights, glistening textures and steam accents.",
  },
  {
    id: "art_dark_luxury",
    category: "art_direction",
    label: "Estética Dark Premium / Luxo contemporâneo",
    description: "Fundos escuros e contrastados para produtos gourmet, tecnologia ou serviços premium.",
    defaultActive: false,
    promptPt: "Ambiente escuro e refinado com iluminação pontual de luxo e superfícies nobres.",
    promptEn: "Dark luxury background with moody directional spotlights, matte black and brushed metal finishes.",
  },

  // 5. Diagramação & Tipografia (4 itens)
  {
    id: "typo_editorial_hierarchy",
    category: "typography",
    label: "Diagramação editorial com hierarquia visual impecável",
    description: "Título grande, subtítulo claro e detalhes em menor escala com fácil escaneabilidade.",
    defaultActive: true,
    promptPt: "Hierarquia tipográfica editorial impecável: título de impacto, subtítulo explicativo e dados em perfeita proporção.",
    promptEn: "Flawless editorial graphic hierarchy with bold primary headline, crisp secondary subtitles, and balanced text blocks.",
  },
  {
    id: "typo_sans_serif_modern",
    category: "typography",
    label: "Fontes modernas sem serifa de alta legibilidade",
    description: "Tipografia geométrica clean (estilo Helvetica, Montserrat, Futura).",
    defaultActive: true,
    promptPt: "Tipografia moderna sem serifa de alta legibilidade, com alinhamento preciso e espaçamento harmonioso.",
    promptEn: "Clean modern geometric sans-serif typography with generous kerning and crystal-clear readability.",
  },
  {
    id: "typo_negative_space",
    category: "typography",
    label: "Uso inteligente de espaço negativo (Respiro visual)",
    description: "Garante áreas livres para a arte respirar e atrair os olhos para o essencial.",
    defaultActive: true,
    promptPt: "Excelente respiro visual com espaço negativo balanceado que valoriza o produto e os textos.",
    promptEn: "Generous negative space ensuring visual breathing room and high conversion visual focus.",
  },
  {
    id: "typo_social_optimized",
    category: "typography",
    label: "Design otimizado para conversão em redes sociais",
    description: "Elementos posicionados estrategicamente para reter atenção nos primeiros 2 segundos.",
    defaultActive: true,
    promptPt: "Design dinâmico otimizado para retenção e engajamento nos primeiros segundos de visualização.",
    promptEn: "Social-first scroll-stopping creative structure engineered for high click-through rate.",
  },

  // 6. Câmera & Qualidade Técnica (4 itens)
  {
    id: "cam_macro_sharpness",
    category: "camera",
    label: "Nitidez ultra precisa com riqueza de microdetalhes",
    description: "Renderização rica em detalhes nítidos de 8K sem granulação artificial.",
    defaultActive: true,
    promptPt: "Nitidez óptica impecável de lente macro profissional (100mm f/2.8), microdetalhes hiper-realistas.",
    promptEn: "Shot on 100mm f/2.8 macro cinema lens, ultra-sharp 8k resolution, razor-sharp micro details.",
  },
  {
    id: "cam_color_grading",
    category: "camera",
    label: "Color grading profissional de cinema/publicidade",
    description: "Cores calibradas com curvas de contraste refinadas e pretos ricos.",
    defaultActive: true,
    promptPt: "Tratamento de cor profissional calibrado com pretos densos, realces suaves e equilíbrio tonal rico.",
    promptEn: "Award-winning commercial color grading, rich tonal dynamic range, natural highlights and deep blacks.",
  },
  {
    id: "cam_composition_rules",
    category: "camera",
    label: "Composição com regra dos terços e linhas guia",
    description: "Enquadramento fotográfico harmonioso que direciona o olhar do observador.",
    defaultActive: true,
    promptPt: "Composição fotográfica equilibrada respeitando a regra dos terços e linhas condutoras.",
    promptEn: "Harmonious photographic framing with golden ratio composition and natural leading lines.",
  },
  {
    id: "cam_raw_uncompressed",
    category: "camera",
    label: "Renderização estilo foto crua e autêntica (--style raw)",
    description: "Instrui modelos como Midjourney e Flux a evitar filtros e ilustrações plásticas.",
    defaultActive: true,
    promptPt: "Estilo fotográfico direto sem pós-efeitos cartunescos ou exageros de render 3D.",
    promptEn: "Uncompressed raw photographic realism, authentic commercial shoot --style raw --v 6.1",
  },
];

export const DEFAULT_ACTIVE_DIRECTIVE_IDS = ART_DIRECTIVES.filter((d) => d.defaultActive).map((d) => d.id);

/**
 * Constrói o Prompt Mestre estruturado a partir dos dados do JSON e das diretrizes selecionadas.
 */
export function buildArtPrompt(
  analysis: Record<string, unknown> | null | undefined,
  selectedDirectiveIds: string[],
  lang: "pt" | "en" = "pt"
): string {
  if (!analysis) {
    return lang === "pt"
      ? "Nenhuma análise disponível para gerar o prompt."
      : "No analysis data available to build the prompt.";
  }

  const activeDirectives = ART_DIRECTIVES.filter((d) => selectedDirectiveIds.includes(d.id));

  const business = (analysis["business"] as Record<string, unknown>) || {};
  const businessName = String(business["name"] || analysis["business_name"] || analysis["title"] || "Negócio Comercial").trim();
  const category = String(business["category"] || analysis["category"] || "").trim();
  const subcategory = String(business["subcategory"] || "").trim();
  const summary = String(analysis["summary"] || "").trim();

  // Descrição visual minuciosa
  const detailedVisual = String(analysis["detailedVisualDescription"] || "").trim();
  const visualDetails = Array.isArray(analysis["visualDetails"])
    ? (analysis["visualDetails"] as string[]).map((v) => String(v).trim()).filter(Boolean)
    : [];

  // Produtos e Preços
  const productsRaw = Array.isArray(analysis["products"]) ? analysis["products"] : [];
  const pricesRaw = Array.isArray(analysis["prices"]) ? analysis["prices"] : [];
  const productsList: Array<{ name: string; price?: string }> = [];

  productsRaw.forEach((p, idx) => {
    if (typeof p === "string" && p.trim()) {
      productsList.push({ name: p.trim(), price: typeof pricesRaw[idx] === "string" ? pricesRaw[idx].trim() : undefined });
    } else if (typeof p === "object" && p !== null) {
      const rec = p as Record<string, unknown>;
      const pName = String(rec["name"] || rec["title"] || rec["description"] || "").trim();
      if (pName) {
        productsList.push({ name: pName, price: rec["price"] ? String(rec["price"]).trim() : undefined });
      }
    }
  });

  // Contatos
  const contacts = (analysis["contacts"] as Record<string, unknown>) || {};
  const whatsapp = String(contacts["whatsapp"] || "").trim();
  const instagram = String(contacts["instagram"] || "").trim();
  const phones = Array.isArray(contacts["phones"]) ? (contacts["phones"] as string[]).filter(Boolean) : [];
  const primaryPhone = whatsapp || phones[0] || "";

  // Elementos visuais detectados
  const objects = Array.isArray(analysis["objectsDetected"])
    ? (analysis["objectsDetected"] as string[]).map((o) => (typeof o === "string" ? o : JSON.stringify(o))).filter(Boolean)
    : [];
  const colors = Array.isArray(analysis["dominantColors"])
    ? (analysis["dominantColors"] as string[]).filter(Boolean)
    : [];
  const promotions = Array.isArray(analysis["promotions"])
    ? (analysis["promotions"] as string[]).filter(Boolean)
    : [];

  const aspectDirective = activeDirectives.find((d) => d.category === "format");
  const aspectParam = aspectDirective ? (lang === "en" ? aspectDirective.promptEn : aspectDirective.promptPt) : "";

  // Construção do bloco de fidelidade visual detalhada
  let visualFidelityPt = "";
  let visualFidelityEn = "";

  if (detailedVisual) {
    visualFidelityPt = `\nDESCRIÇÃO VISUAL E FÍSICA DOS PRODUTOS (COMO SÃO NA VIDA REAL):\n${detailedVisual}`;
    visualFidelityEn = `\nULTRA-DETAILED PHYSICAL & SENSORY SUBJECT DESCRIPTION:\n${detailedVisual}`;
  } else if (productsList.length > 0 || objects.length > 0) {
    // Fallback inteligente caso a análise seja de versão anterior sem o campo explícito
    const itemsDesc = productsList.map((p) => p.name).join(", ") || objects.join(", ");
    visualFidelityPt = `\nDESCRIÇÃO VISUAL E FÍSICA DOS PRODUTOS (COMO SÃO NA VIDA REAL):
- Reproduzir com máxima fidelidade física real: ${itemsDesc}.
- Formatos geométricos autênticos (ex.: brigadeiros perfeitamente esféricos/redondos, fatias nítidas, etc.).
- Texturas reais e palpáveis: granulados finos e uniformes de chocolate, confeitos bem definidos, brilho acetinado natural na cor marrom chocolate, crosta crocante e forminhas plissadas adequadas.`;
    visualFidelityEn = `\nULTRA-DETAILED PHYSICAL & SENSORY SUBJECT DESCRIPTION:
- Render showcased items with authentic physical reality: ${itemsDesc}.
- True geometric shapes (e.g. perfectly round/spherical brigadeiros, defined cuts and clean edges).
- Distinct tactile surface textures: fine chocolate sprinkles, authentic deep brown chocolate tones, natural glossy chocolate sheen, delicate pleating on baking cups, and tangible artisan quality.`;
  }

  if (visualDetails.length > 0) {
    visualFidelityPt += `\n- Detalhes visuais identificados: ${visualDetails.join(", ")}`;
    visualFidelityEn += `\n- Key visual attributes: ${visualDetails.join(", ")}`;
  }

  if (lang === "en") {
    const productsBlock = productsList.length > 0
      ? `\nFEATURED PRODUCTS & PRICING:\n${productsList.map((p) => `- ${p.name}${p.price ? ` (Price: ${p.price})` : ""}`).join("\n")}`
      : "";

    const promoBlock = promotions.length > 0
      ? `\nPROMOTIONAL OFFERS:\n${promotions.map((pr) => `- ${pr}`).join("\n")}`
      : "";

    const contactBlock = (primaryPhone || instagram)
      ? `\nCONTACT BADGE:\n${primaryPhone ? `- WhatsApp/Phone: ${primaryPhone}\n` : ""}${instagram ? `- Instagram: ${instagram}\n` : ""}`
      : "";

    const visualElements = objects.length > 0 ? `\nKEY VISUAL OBJECTS: ${objects.slice(0, 8).join(", ")}` : "";
    const colorElements = colors.length > 0 ? `\nBRAND COLOR ACCENTS: ${colors.slice(0, 5).join(", ")}` : "";

    const rules = activeDirectives
      .filter((d) => d.category !== "format")
      .map((d) => `• ${d.promptEn}`)
      .join("\n");

    return `MASTER COMMERCIAL ART PROMPT (High-Conversion Social Media Ad)

[CORE CONCEPT & SUBJECT]
A world-class commercial advertising creative for "${businessName}" (${category}${subcategory ? ` - ${subcategory}` : ""}).
Overview & Context: ${summary || "Professional product presentation with high visual appeal."}
${visualFidelityEn}${productsBlock}${promoBlock}${contactBlock}${visualElements}${colorElements}

[ART DIRECTION & PRODUCTION GUIDELINES]
${rules}

[FINAL PARAMETERS]
${aspectParam || "--ar 9:16"} --style raw --v 6.1 --quality 2`;
  }

  // Versão em Português
  const produtosTexto = productsList.length > 0
    ? `\nPRODUTOS EM DESTAQUE E PREÇOS:\n${productsList.map((p) => `- ${p.name}${p.price ? ` (${p.price})` : ""}`).join("\n")}`
    : "";

  const promocoesTexto = promotions.length > 0
    ? `\nOFERTAS PROMOCIONAIS:\n${promotions.map((pr) => `- ${pr}`).join("\n")}`
    : "";

  const contatosTexto = (primaryPhone || instagram)
    ? `\nINFORMAÇÕES DE CONTATO:\n${primaryPhone ? `- WhatsApp/Telefone: ${primaryPhone}\n` : ""}${instagram ? `- Instagram: ${instagram}\n` : ""}`
    : "";

  const objetosTexto = objects.length > 0 ? `\nELEMENTOS VISUAIS: ${objects.slice(0, 8).join(", ")}` : "";
  const coresTexto = colors.length > 0 ? `\nCORES DA IDENTIDADE: ${colors.slice(0, 5).join(", ")}` : "";

  const diretrizesTexto = activeDirectives
    .filter((d) => d.category !== "format")
    .map((d) => `• ${d.promptPt}`)
    .join("\n");

  return `PROMPT MESTRE PARA REFAZER ARTE PROFISSIONAL (Anúncio de Alta Conversão)

[CONCEITO PRINCIPAL E TEMA]
Criativo publicitário comercial de alto padrão para "${businessName}" (${category}${subcategory ? ` - ${subcategory}` : ""}).
Contexto: ${summary || "Apresentação profissional de produto/serviço com apelo estético impecável."}
${visualFidelityPt}${produtosTexto}${promocoesTexto}${contatosTexto}${objetosTexto}${coresTexto}

[DIRETRIZES TÉCNICAS E ESTILO VISUAL]
${diretrizesTexto}

[FORMATO & PARÂMETROS]
${aspectParam || "Proporção 9:16 (Story / WhatsApp)"}`;
}
