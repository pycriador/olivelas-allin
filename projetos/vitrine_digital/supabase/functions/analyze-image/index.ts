import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { z } from "npm:zod@3.24.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const analysisSchema = z.object({
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

const ANALYSIS_PROMPT = `Você é um especialista em OCR, visão computacional e extração estruturada de informações.

Analise profundamente a imagem enviada.
Extraia absolutamente TODAS as informações disponíveis.
Utilize OCR para identificar todo texto presente.

Atenção especial a PRODUTOS PARA VENDA, CARDÁPIOS, CATÁLOGOS E ALIMENTOS:
- Identifique e extraia detalhadamente todos os produtos à venda (ex.: doces, bolos, tortas, brigadeiros, trufas, salgados, coxinhas, pastéis, empadas, lanches, pizzas, marmitas, bebidas ou qualquer mercadoria).
- Extraia sabores, itens individuais, combos, porções e valores em "products", "prices" e "promotions".
- Inclua termos de alimentos e produtos identificados também em "objectsDetected" e "keywords" (ex.: doces, salgados, bolo, coxinha, pastel, confeitaria, salgateria).

Identifique:
• Tipo da imagem • Idioma • Nome da empresa • Categoria • Subcategoria • Serviços • Produtos para venda
• Promoções • Preços • Telefones • WhatsApp • Emails • Site • Redes sociais • Endereço completo
• Horário de funcionamento • Pessoas • Animais • Objetos • Logotipos • Marcas • Cores predominantes
• Palavras-chave • Chamadas para ação • Objetivo da propaganda • Texto OCR completo

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
  "possibleIntent": "", "ocrText": "",
  "metadata": { "containsPhone": false, "containsEmail": false, "containsWebsite": false, "containsPrice": false, "containsAddress": false, "containsQRCode": false, "containsLogo": false }
}`;

function extractJson(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("A IA não retornou um JSON válido.");
  return JSON.parse(candidate.slice(start, end + 1));
}

async function callVisionModel(imageDataUrl: string, model: string) {
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  let endpoint = "https://api.openai.com/v1/chat/completions";
  let apiKey = openAiKey;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (openAiKey) {
    headers["Authorization"] = `Bearer ${openAiKey}`;
  } else if (lovableKey) {
    endpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
    headers["Lovable-API-Key"] = lovableKey;
    apiKey = lovableKey;
  }

  if (!apiKey) {
    throw new Error("Chave de API da OpenAI (OPENAI_API_KEY) ou Lovable Gateway ausente.");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model || (openAiKey ? "gpt-4o" : "openai/gpt-4.1-mini"),
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: ANALYSIS_PROMPT },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("Limite de requisições da IA atingido. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    throw new Error(`Falha na análise da IA (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Resposta vazia recebida do modelo de IA.");
  return content;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const customApiKey = req.headers.get("x-api-key") || req.headers.get("X-API-Key");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let isAuthorized = false;

    // 1. Verifica autenticação via JWT Supabase
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      if (!authError && userData?.user) {
        isAuthorized = true;
      }
    }

    // 2. Verifica autenticação via X-API-Key se JWT não presente
    if (!isAuthorized && customApiKey) {
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(customApiKey.trim()));
      const tokenHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const { data: tokenRecord } = await supabase
        .from("iam_api_tokens")
        .select("id, is_active, expires_at")
        .eq("token_hash", tokenHash)
        .eq("is_active", true)
        .maybeSingle();

      if (tokenRecord) {
        const notExpired = !tokenRecord.expires_at || new Date(tokenRecord.expires_at) > new Date();
        if (notExpired) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Acesso não autorizado. Envie um token de autenticação válido no header Authorization." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { id, path, imageUrl } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "ID da análise obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = Deno.env.get("VISION_MODEL") || "gpt-4o";

    await supabase
      .from("image_analysis")
      .update({ status: "processing", error_message: null })
      .eq("id", id);

    let dataUrl = imageUrl;
    if (!dataUrl && path) {
      const file = await supabase.storage.from("images").download(path);
      if (file.error || !file.data) throw new Error("Não foi possível carregar a imagem do Storage.");
      const arrayBuffer = await file.data.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const mime = file.data.type || "image/jpeg";
      dataUrl = `data:${mime};base64,${base64}`;
    }

    if (!dataUrl) {
      throw new Error("Nenhuma imagem fornecida para análise.");
    }

    const raw = await callVisionModel(dataUrl, model);
    const parsed = analysisSchema.parse(extractJson(raw));

    const keywords = (Array.isArray(parsed.keywords) ? parsed.keywords : []).map((k: unknown) => {
      if (typeof k === "string") return k;
      if (typeof k === "object" && k !== null) {
        const rec = k as Record<string, unknown>;
        return String(rec["name"] || rec["keyword"] || rec["label"] || JSON.stringify(k));
      }
      return String(k);
    });

    const searchable = [
      parsed.title,
      parsed.summary,
      parsed.business.name,
      parsed.business.category,
      keywords.join(" "),
      parsed.ocrText,
    ]
      .filter(Boolean)
      .join(" \n ");

    const { data: row, error } = await supabase
      .from("image_analysis")
      .update({
        status: "completed",
        image_type: parsed.imageType,
        business_name: parsed.business.name,
        category: parsed.business.category,
        title: parsed.title,
        summary: parsed.summary,
        searchable_text: searchable,
        keywords,
        confidence: parsed.confidence,
        analysis: parsed,
        model_used: model,
        processing_version: "v1",
        error_message: null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ ok: true, row, analysis: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido na análise da imagem.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
