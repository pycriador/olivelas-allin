import { z } from "zod";

const flexString = z
  .preprocess((val) => {
    if (val == null) return "";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  }, z.string())
  .default("");

const flexNumber = z
  .preprocess((val) => {
    if (val == null) return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }, z.number())
  .default(0);

const flexBoolean = z
  .preprocess((val) => {
    if (typeof val === "boolean") return val;
    if (val === "true" || val === 1) return true;
    return false;
  }, z.boolean())
  .default(false);

const flexArray = z
  .preprocess((val) => {
    if (val == null) return [];
    if (Array.isArray(val)) return val;
    return [val];
  }, z.array(z.any()))
  .default([]);

const flexPeopleDetected = z
  .preprocess((val) => {
    if (val == null) return { count: 0, description: "" };
    if (typeof val === "object" && !Array.isArray(val)) {
      const count = Number((val as Record<string, unknown>)["count"] ?? 0) || 0;
      const description = String((val as Record<string, unknown>)["description"] ?? "");
      return { count, description };
    }
    if (typeof val === "number") return { count: val, description: "" };
    if (typeof val === "string") return { count: 0, description: val };
    if (Array.isArray(val)) {
      return {
        count: val.length,
        description: val.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", "),
      };
    }
    return { count: 0, description: "" };
  }, z.object({ count: z.number().default(0), description: z.string().default("") }))
  .default({ count: 0, description: "" });

export const analysisSchema = z.object({
  imageType: flexString,
  title: flexString,
  summary: flexString,
  language: flexString,
  confidence: flexNumber,
  business: z
    .preprocess(
      (val) => (typeof val === "object" && val !== null ? val : {}),
      z.object({
        name: flexString,
        category: flexString,
        subcategory: flexString,
        description: flexString,
      })
    )
    .default({ name: "", category: "", subcategory: "", description: "" }),
  services: flexArray,
  products: flexArray,
  prices: flexArray,
  promotions: flexArray,
  contacts: z
    .preprocess(
      (val) => (typeof val === "object" && val !== null ? val : {}),
      z.object({
        phones: flexArray,
        emails: flexArray,
        website: flexString,
        instagram: flexString,
        facebook: flexString,
        linkedin: flexString,
        whatsapp: flexString,
      })
    )
    .default({
      phones: [],
      emails: [],
      website: "",
      instagram: "",
      facebook: "",
      linkedin: "",
      whatsapp: "",
    }),
  address: z
    .preprocess(
      (val) => (typeof val === "object" && val !== null ? val : {}),
      z.object({
        street: flexString,
        number: flexString,
        district: flexString,
        city: flexString,
        state: flexString,
        zipcode: flexString,
        country: flexString,
      })
    )
    .default({
      street: "",
      number: "",
      district: "",
      city: "",
      state: "",
      zipcode: "",
      country: "",
    }),
  openingHours: flexArray,
  keywords: flexArray,
  texts: flexArray,
  objectsDetected: flexArray,
  peopleDetected: flexPeopleDetected,
  animalsDetected: flexArray,
  logos: flexArray,
  brands: flexArray,
  dominantColors: flexArray,
  callsToAction: flexArray,
  detailedVisualDescription: flexString,
  visualDetails: flexArray,
  possibleIntent: flexString,
  ocrText: flexString,
  metadata: z
    .preprocess(
      (val) => (typeof val === "object" && val !== null ? val : {}),
      z.object({
        containsPhone: flexBoolean,
        containsEmail: flexBoolean,
        containsWebsite: flexBoolean,
        containsPrice: flexBoolean,
        containsAddress: flexBoolean,
        containsQRCode: flexBoolean,
        containsLogo: flexBoolean,
      })
    )
    .default({
      containsPhone: false,
      containsEmail: false,
      containsWebsite: false,
      containsPrice: false,
      containsAddress: false,
      containsQRCode: false,
      containsLogo: false,
    }),
});

export type Analysis = z.infer<typeof analysisSchema>;

export const ANALYSIS_PROMPT = `Você é um especialista em OCR, visão computacional e extração estruturada de informações.

Analise profundamente a imagem enviada.
Extraia absolutamente TODAS as informações disponíveis.
Utilize OCR para identificar todo texto presente.

Atenção especial a PRODUTOS PARA VENDA, CARDÁPIOS, CATÁLOGOS E ALIMENTOS:
- Identifique e extraia detalhadamente todos os produtos à venda (ex.: doces, bolos, tortas, brigadeiros, trufas, salgados, coxinhas, pastéis, empadas, lanches, pizzas, marmitas, bebidas ou qualquer mercadoria).
- Extraia sabores, itens individuais, combos, porções e valores em "products", "prices" e "promotions".
- Inclua termos de alimentos e produtos identificados também em "objectsDetected" e "keywords" (ex.: doces, salgados, bolo, coxinha, pastel, confeitaria, salgateria).

REGRA FUNDAMENTAL DE DESCRIÇÃO VISUAL E FÍSICA DOS PRODUTOS ("detailedVisualDescription" e "visualDetails"):
- Descreva as imagens e os produtos EXATAMENTE COMO ELES SÃO NO MUNDO REAL com altíssimo nível de detalhe físico, sensorial e estético:
  • Formatos geométricos precisos (ex.: brigadeiros redondos e esféricos, bolo fatiado triangular, pastéis retangulares, hambúrguer em camadas cilíndricas).
  • Texturas e superfícies táteis (ex.: cobertos com granulados finos de chocolate, confeitos crocantes, crosta frita dourada, massa aveludada, calda brilhante escorrendo).
  • Cores e tonalidades exatas (ex.: chocolate marrom escuro intenso, morangos vermelhos com sementes douradas, creme branco acetinado, tons dourados de fritura).
  • Recipientes, suportes e embalagens visíveis (ex.: forminhas de papel plissado marrom/dourado, prato de louça branca, caixa de acetato transparente, tábua de madeira).
  • Acabamento de iluminação e reflexos (ex.: brilho acetinado na superfície do chocolate, gotículas de condensação em copos, textura do queijo derretido).
- No campo "detailedVisualDescription", forneça uma descrição visual completa e minuciosa de cada produto/elemento presente na imagem.
- No campo "visualDetails", liste os atributos visuais identificados (ex.: ["brigadeiros redondos", "granulados finos de chocolate", "cor do chocolate marrom escuro", "forminhas de papel plissadas"]).

Identifique:
• Tipo da imagem • Idioma • Nome da empresa • Categoria • Subcategoria • Serviços • Produtos para venda
• Promoções • Preços • Telefones • WhatsApp • Emails • Site • Redes sociais • Endereço completo
• Horário de funcionamento • Pessoas • Animais • Objetos • Logotipos • Marcas • Cores predominantes
• Descrição visual detalhada dos produtos • Palavras-chave • Chamadas para ação • Objetivo da propaganda • Texto OCR completo

Nunca invente dados.
Quando alguma informação não existir retorne null, [] ou "" conforme apropriado.
Calcule um índice de confiança entre 0 e 1.
Retorne SOMENTE JSON válido exatamente seguindo este schema:

{
  "imageType": "", "title": "", "summary": "", "language": "", "confidence": 0,
  "business": { "name": "", "category": "", "subcategory": "", "description": "" },
  "services": [], "products": [], "prices": [], "promotions": [],
  "contacts": { "phones": [], "emails": [], "website": "", "instagram": "", "facebook": "", "linkedin": "", "whatsapp": "" },
  "address": { "street": "", "number": "", "district": "", "city": "", "state": "", "zipcode": "", "country": "" },
  "openingHours": [], "keywords": [], "texts": [], "objectsDetected": [],
  "peopleDetected": { "count": 0, "description": "" },
  "animalsDetected": [], "logos": [], "brands": [], "dominantColors": [], "callsToAction": [],
  "detailedVisualDescription": "", "visualDetails": [],
  "possibleIntent": "", "ocrText": "",
  "metadata": { "containsPhone": false, "containsEmail": false, "containsWebsite": false, "containsPrice": false, "containsAddress": false, "containsQRCode": false, "containsLogo": false }
}`;

export const PROCESSING_VERSION = "v1";
