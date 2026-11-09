import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { ANALYSIS_PROMPT, PROCESSING_VERSION, analysisSchema } from "./analysis-schema";

export const LOVABLE_VISION_MODELS = [
  { id: "openai/gpt-6-astra", name: "Lovable GPT-6 Astra (Recomendado)", description: "Mais rápido, preciso e com raciocínio multimodal de ponta" },
  { id: "gpt-4.1", name: "Lovable GPT-4.1", description: "Alta fidelidade na extração de texto e detalhes visuais" },
  { id: "openai/gpt-5", name: "Lovable GPT-5", description: "Raciocínio lógico avançado e categorização complexa" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash (via Lovable Gateway)", description: "Velocidade ultrarrápida via gateway Lovable" },
];

export const LOVABLE_IMAGE_MODELS = [
  { id: "dall-e-3", name: "Lovable DALL-E 3 (Padrão)", description: "Geração de artes publicitárias em alta definição com tipografia coerente" },
  { id: "black-forest-labs/flux-1.1-pro", name: "Flux 1.1 Pro (Lovable Gateway)", description: "Extremo realismo e detalhes visuais cinematográficos" },
  { id: "black-forest-labs/flux-schnell", name: "Flux Schnell (Lovable Gateway)", description: "Geração ultrarrápida otimizada para rascunhos e mídias sociais" },
];

const Input = z.object({
  id: z.string().uuid(),
  path: z.string().min(1),
  provider: z.enum(["lovable", "gemini", "auto"]).optional(),
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().optional(),
  groupId: z.string().optional(),
  groupApiKey: z.string().optional(),
  customPrompt: z.string().optional(),
});

const ListModelsInput = z.object({
  apiKey: z.string().min(1),
  filter: z.enum(["vision", "image", "all"]).optional(),
});

const GenerateImageInput = z.object({
  prompt: z.string().min(5),
  provider: z.enum(["lovable", "gemini", "auto"]).optional(),
  groupId: z.string().optional(),
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().optional(),
  aspectRatio: z.string().optional(),
  targetArtId: z.string().optional(),
  referenceImageUrl: z.string().optional(),
  referenceImagePath: z.string().optional(),
});

const DeleteAnalysisImageInput = z.object({
  analysisId: z.string().uuid(),
  galleryItemId: z.string().optional(),
  targetType: z.enum(["original", "generated", "gallery_item"]).optional(),
  imagePath: z.string().optional(),
  imageUrl: z.string().optional(),
});

const SetActiveImageInput = z.object({
  analysisId: z.string().uuid(),
  imageUrl: z.string().min(1),
  imagePath: z.string().optional(),
});

function serverClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

function extractJson(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("A IA não retornou um JSON válido.");
  return JSON.parse(candidate.slice(start, end + 1));
}

/** Obtém o prompt ativo configurado no banco de dados ou usa o padrão */
async function getEffectivePrompt(supabase: ReturnType<typeof serverClient>, custom?: string): Promise<string> {
  if (custom?.trim()) return custom.trim();
  try {
    const { data } = await supabase
      .from("iam_prompts")
      .select("content")
      .eq("type", "vision_extraction")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (data?.content) {
      return data.content;
    }
  } catch {
    /* fallback para o prompt padrão */
  }
  return ANALYSIS_PROMPT;
}

/** Chamada à API oficial do Google Gemini */
async function callGeminiVision(base64Data: string, mimeType: string, apiKey: string, model: string, promptText: string) {
  const modelName = model || "gemini-2.5-flash";
  const cleanModel = modelName.replace(/^models\//, "");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    if (res.status === 400 || res.status === 403) {
      throw new Error(`Erro na chave do Gemini (${res.status}): Verifique se a chave é válida e possui acesso.`);
    }
    if (res.status === 429) {
      throw new Error("Limite de requisições do Gemini atingido. Tente novamente em instantes.");
    }
    throw new Error(`Falha na API do Gemini (${res.status}): ${errorBody.slice(0, 300)}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("O modelo Gemini não retornou nenhum texto estruturado.");
  }
  return text;
}

/** Chamada de visão Lovable AI Gateway / OpenAI (Responses API com streaming) */
async function callVision(imageDataUrl: string, model: string, promptText: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const openAiKey = process.env["OPENAI_API_KEY"];

  let endpoint = "https://ai.gateway.lovable.dev/v1/responses";
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (lovableKey) {
    endpoint = "https://ai.gateway.lovable.dev/v1/responses";
    headers["Lovable-API-Key"] = lovableKey;
    headers["X-Lovable-AIG-SDK"] = "fetch";
  } else if (openAiKey) {
    endpoint = "https://api.openai.com/v1/responses";
    headers["Authorization"] = `Bearer ${openAiKey}`;
  } else {
    throw new Error("Chave de API Lovable (LOVABLE_API_KEY) ou OpenAI ausente.");
  }

  const selectedModel = model || (lovableKey ? "openai/gpt-6-astra" : "gpt-4.1");
  const isReasoning = /gpt-6|gpt-5/.test(selectedModel);

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: selectedModel,
      stream: true,
      ...(isReasoning ? { reasoning: { effort: "low" } } : {}),
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: promptText },
            { type: "input_image", image_url: imageDataUrl },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos para continuar.");
    throw new Error(`Falha na análise (${res.status}): ${body.slice(0, 300)}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload);
        if (parsed.type === "response.output_text.delta" && typeof parsed.delta === "string") {
          text += parsed.delta;
        } else if (parsed.type === "response.completed" && !text) {
          const out = parsed.response?.output ?? [];
          for (const item of out) {
            for (const part of item?.content ?? []) {
              if (typeof part?.text === "string") text += part.text;
            }
          }
        }
      } catch {
        /* ignore partial frames */
      }
    }
  }

  if (!text.trim()) throw new Error("A IA não retornou nenhum texto estruturado.");
  return text;
}

/** Lista modelos disponíveis para a chave do Gemini */
export const listGeminiModels = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ListModelsInput.parse(data))
  .handler(async ({ data }) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${data.apiKey.trim()}`;
    const res = await fetch(endpoint);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Chave do Gemini inválida (${res.status}): ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      models?: Array<{
        name: string;
        displayName?: string;
        description?: string;
        supportedGenerationMethods?: string[];
      }>;
    };

    const rawModels = json.models ?? [];
    const filter = data.filter ?? "all";

    const mappedModels = rawModels.map((m) => {
      const id = m.name.replace(/^models\//, "");
      return {
        id,
        name: m.displayName || id,
        description: m.description || "",
        supportedGenerationMethods: m.supportedGenerationMethods || [],
      };
    });

    let filteredModels = mappedModels;

    if (filter === "vision") {
      filteredModels = mappedModels
        .filter((m) => m.supportedGenerationMethods.includes("generateContent"))
        .filter((m) => m.id.toLowerCase().includes("gemini") || m.id.toLowerCase().includes("flash") || m.id.toLowerCase().includes("pro"));
    } else if (filter === "image") {
      // Modelos que suportam geração de imagem (Imagen ou predict)
      filteredModels = mappedModels.filter((m) =>
        m.id.toLowerCase().includes("imagen") ||
        m.id.toLowerCase().includes("image") ||
        m.supportedGenerationMethods.includes("predict") ||
        m.supportedGenerationMethods.includes("generateImages")
      );
      // Se a Google API não listar Imagen via endpoint v1beta/models, provê os modelos padrão de imagem
      if (filteredModels.length === 0) {
        filteredModels = [
          { id: "imagen-3.0-generate-002", name: "Imagen 3 (Fast / Alta Definição)", description: "Modelo oficial de geração de imagens fotográficas e artes em alta fidelidade", supportedGenerationMethods: ["predict"] },
          { id: "imagen-3.0-generate-001", name: "Imagen 3 (Versão Estável 001)", description: "Versão estável do Imagen 3", supportedGenerationMethods: ["predict"] },
          { id: "imagegeneration@006", name: "Imagen 2 (imagegeneration@006)", description: "Geração de imagem legado Google", supportedGenerationMethods: ["predict"] },
        ];
      }
    }

    return { ok: true as const, models: filteredModels, allModels: mappedModels };
  });

export const analyzeImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const defaultModel = process.env["VISION_MODEL"] ?? (process.env["OPENAI_API_KEY"] ? "gpt-4.1" : "openai/gpt-6-astra");

    await supabase
      .from("image_analysis")
      .update({ status: "processing", error_message: null })
      .eq("id", data.id);

    let effectiveGroupName = "Geral";
    let dbGroupApiKey: string | undefined;
    let dbGroupModel: string | undefined;

    if (data.groupId) {
      try {
        const { data: grp } = await supabase
          .from("iam_groups")
          .select("name, gemini_api_key, gemini_model, quota_brl, used_brl")
          .eq("id", data.groupId)
          .single();
        if (grp) {
          if (grp.quota_brl != null && grp.used_brl != null && Number(grp.used_brl) >= Number(grp.quota_brl)) {
            throw new Error(`A cota de IA do grupo "${grp.name}" foi atingida (R$ ${Number(grp.quota_brl).toFixed(2)}). Aumente o limite nas configurações.`);
          }
          if (grp.name) effectiveGroupName = grp.name;
          if (grp.gemini_api_key?.trim()) dbGroupApiKey = grp.gemini_api_key.trim();
          if (grp.gemini_model?.trim()) dbGroupModel = grp.gemini_model.trim();
        }
      } catch (grpErr) {
        if (grpErr instanceof Error && grpErr.message.includes("cota")) throw grpErr;
      }
    }

    try {
      const file = await supabase.storage.from("images").download(data.path);
      if (file.error || !file.data) throw new Error("Não foi possível ler a imagem enviada.");
      const bytes = new Uint8Array(await file.data.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      const mime = file.data.type || "image/jpeg";
      const base64 = btoa(binary);
      const dataUrl = `data:${mime};base64,${base64}`;

      // Carrega o prompt dinâmico ativo configurado no IAM
      const activePrompt = await getEffectivePrompt(supabase, data.customPrompt);

      let raw: string;
      let modelUsed: string;

      // Seleção de IA: Lovable AI ou Google Gemini
      const effectiveGeminiKey = data.geminiApiKey?.trim() || data.groupApiKey?.trim() || dbGroupApiKey;
      const isLovableExplicit = data.provider === "lovable";
      const isGeminiExplicit = data.provider === "gemini";

      if (isLovableExplicit || (!isGeminiExplicit && !effectiveGeminiKey)) {
        const lovableModel = data.geminiModel && !data.geminiModel.startsWith("gemini-")
          ? data.geminiModel
          : defaultModel;
        modelUsed = lovableModel;
        raw = await callVision(dataUrl, lovableModel, activePrompt);
      } else if (effectiveGeminiKey) {
        const selectedGeminiModel = data.geminiModel?.trim() || dbGroupModel || "gemini-2.5-flash";
        modelUsed = selectedGeminiModel;
        raw = await callGeminiVision(base64, mime, effectiveGeminiKey, selectedGeminiModel, activePrompt);
      } else {
        modelUsed = defaultModel;
        raw = await callVision(dataUrl, defaultModel, activePrompt);
      }

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
          model_used: modelUsed,
          processing_version: PROCESSING_VERSION,
          error_message: null,
        })
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Abate cota do grupo se aplicável
      if (data.groupId) {
        try {
          const { data: grp } = await supabase
            .from("iam_groups")
            .select("used_brl, quota_brl")
            .eq("id", data.groupId)
            .single();

          if (grp) {
            const nextUsed = Math.min(Number(grp.quota_brl), Number(grp.used_brl) + 0.05);
            await supabase
              .from("iam_groups")
              .update({ used_brl: nextUsed, updated_at: new Date().toISOString() })
              .eq("id", data.groupId);
          }
        } catch {
          /* ignore */
        }
      }

      // Registra telemetria de uso de IA na tabela ai_usage_logs
      try {
        await supabase.from("ai_usage_logs").insert({
          group_id: data.groupId || null,
          group_name: effectiveGroupName,
          model: modelUsed,
          estimated_input_tokens: Math.round(activePrompt.length / 4) + 1000,
          estimated_output_tokens: Math.round(raw.length / 4),
          estimated_cost_brl: 0.05,
          status: "success",
        });
      } catch {
        /* ignore telemetry error */
      }

      return { ok: true as const, row };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido na análise.";
      await supabase
        .from("image_analysis")
        .update({ status: "failed", error_message: message })
        .eq("id", data.id);

      // Registra log de erro na telemetria
      try {
        await supabase.from("ai_usage_logs").insert({
          group_id: data.groupId || null,
          group_name: effectiveGroupName,
          model: data.geminiModel || defaultModel,
          estimated_input_tokens: 1200,
          estimated_output_tokens: 0,
          estimated_cost_brl: 0.0,
          status: "error",
          error_message: message,
        });
      } catch {
        /* ignore */
      }

      return { ok: false as const, message };
    }
  });

/** Chamada à API Google Gemini Imagen 3 / Gemini Models para geração direta de arte publicitária */
async function callGeminiImagen(
  promptText: string,
  apiKey: string,
  aspectRatio?: string,
  requestedModel?: string,
  referenceImage?: { base64: string; mimeType: string } | null,
): Promise<{ base64: string; mimeType: string }> {
  const cleanRatio = aspectRatio === "9:16" ? "9:16" : aspectRatio === "16:9" ? "16:9" : aspectRatio === "4:3" ? "4:3" : aspectRatio === "3:4" ? "3:4" : "1:1";
  const cleanKey = apiKey.trim();

  const chosenModel = (requestedModel ? requestedModel.replace(/^models\//, "").trim() : "imagen-3.0-generate-002") || "imagen-3.0-generate-002";

  // Se for um modelo da família Gemini (ex: gemini-2.0-flash, gemini-2.5-flash, etc.)
  if (chosenModel.toLowerCase().startsWith("gemini")) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${cleanKey}`;

    const parts: Array<Record<string, unknown>> = [];
    if (referenceImage?.base64) {
      parts.push({
        inlineData: {
          mimeType: referenceImage.mimeType || "image/jpeg",
          data: referenceImage.base64,
        },
      });
      parts.push({
        text: `Using the provided reference image as the primary visual context for the product/business, create a brand new, stunning, high-definition advertising artwork. Follow these directives strictly:\n\n${promptText}\n\nPreserve key product identity, pricing and branding from the reference while creating a modern, professional, high-converting commercial layout. Desired aspect ratio: ${cleanRatio}.`,
      });
    } else {
      parts.push({
        text: `Generate an ultra high quality professional commercial visual advertisement in ${cleanRatio} aspect ratio. Details: ${promptText}`,
      });
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          temperature: 0.7,
        },
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const candidates = json.candidates ?? [];
      for (const cand of candidates) {
        const pList = cand.content?.parts ?? [];
        for (const part of pList) {
          if (part.inlineData?.data) {
            return {
              base64: part.inlineData.data,
              mimeType: part.inlineData.mimeType || "image/jpeg",
            };
          }
        }
      }
    }

    const errText = await res.text();
    throw new Error(`Modelo [${chosenModel}] (${res.status}): ${errText.slice(0, 300)}`);
  }

  // Se for um modelo da família Imagen (ex: imagen-3.0-generate-002, imagen-3.0-generate-001)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:predict?key=${cleanKey}`;

  const instances: Array<Record<string, unknown>> = [];
  if (referenceImage?.base64) {
    instances.push({
      prompt: `Based on product reference image: ${promptText}`,
    });
  } else {
    instances.push({ prompt: promptText });
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances,
      parameters: {
        sampleCount: 1,
        aspectRatio: cleanRatio,
        outputMimeType: "image/jpeg",
        personGeneration: "ALLOW_ADULT",
      },
    }),
  });

  if (res.ok) {
    const json = (await res.json()) as {
      predictions?: Array<{
        bytesBase64Encoded?: string;
        mimeType?: string;
      }>;
    };
    const b64 = json.predictions?.[0]?.bytesBase64Encoded;
    if (b64) {
      return { base64: b64, mimeType: json.predictions?.[0]?.mimeType || "image/jpeg" };
    }
  }

  const errorBody = await res.text();
  throw new Error(`Google Imagen [${chosenModel}] (${res.status}): ${errorBody.slice(0, 350)}`);
}

/** Geração de imagem publicitária via Lovable AI Gateway / OpenAI (DALL-E 3, Flux, etc.) */
async function callLovableOrOpenAiImageGen(promptText: string, aspectRatio?: string, requestedModel?: string): Promise<{ base64: string; mimeType: string }> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const openAiKey = process.env["OPENAI_API_KEY"];

  let endpoint = "https://ai.gateway.lovable.dev/v1/images/generations";
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (lovableKey) {
    endpoint = "https://ai.gateway.lovable.dev/v1/images/generations";
    headers["Lovable-API-Key"] = lovableKey;
    headers["X-Lovable-AIG-SDK"] = "fetch";
  } else if (openAiKey) {
    endpoint = "https://api.openai.com/v1/images/generations";
    headers["Authorization"] = `Bearer ${openAiKey}`;
  } else {
    throw new Error("Nenhuma chave configurada para geração de imagem Lovable / OpenAI.");
  }

  const model = requestedModel && !requestedModel.startsWith("imagen-") && !requestedModel.startsWith("gemini-")
    ? requestedModel
    : "dall-e-3";

  const size = aspectRatio === "9:16" ? "1024x1792" : aspectRatio === "16:9" ? "1792x1024" : "1024x1024";

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      prompt: promptText.slice(0, 3800),
      n: 1,
      size,
      response_format: "b64_json",
      quality: "standard",
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Falha na geração Lovable AI [${model}] (${res.status}): ${errorBody.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };

  const b64 = json.data?.[0]?.b64_json;
  if (b64) return { base64: b64, mimeType: "image/jpeg" };

  const url = json.data?.[0]?.url;
  if (url) {
    const imgRes = await fetch(url);
    if (imgRes.ok) {
      const buf = await imgRes.arrayBuffer();
      return {
        base64: Buffer.from(buf).toString("base64"),
        mimeType: imgRes.headers.get("content-type") || "image/jpeg",
      };
    }
  }

  throw new Error("A IA do Lovable não retornou imagem gerada.");
}

/** Server function: Gera arte diretamente com IA usando imagem de referência, salva no Supabase Storage e monta galeria */
export const generateArtImageDirect = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => GenerateImageInput.parse(data))
  .handler(async ({ data }) => {
    const supabase = serverClient();
    let effectiveGroupName = "Geral";
    let dbGroupApiKey: string | undefined;

    if (data.groupId) {
      try {
        const { data: grp } = await supabase
          .from("iam_groups")
          .select("name, gemini_api_key, quota_brl, used_brl")
          .eq("id", data.groupId)
          .single();

        if (grp) {
          if (grp.quota_brl != null && grp.used_brl != null && Number(grp.used_brl) >= Number(grp.quota_brl)) {
            throw new Error(`A cota de IA do grupo "${grp.name}" foi atingida. Aumente o limite nas configurações.`);
          }
          if (grp.name) effectiveGroupName = grp.name;
          if (grp.gemini_api_key?.trim()) dbGroupApiKey = grp.gemini_api_key.trim();
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("cota")) throw err;
      }
    }

    // 1. Busca registro atual no banco para obter imagem de referência e histórico
    let targetRow: Record<string, unknown> | null = null;
    if (data.targetArtId) {
      try {
        const { data: row } = await supabase
          .from("image_analysis")
          .select("*")
          .eq("id", data.targetArtId)
          .single();
        if (row) {
          targetRow = row as Record<string, unknown>;
        }
      } catch {
        /* ignore */
      }
    }

    // 2. Carrega bytes da imagem de referência para enriquecer a geração da IA
    let referenceImage: { base64: string; mimeType: string } | null = null;
    const currentAnalysisObj = (targetRow?.analysis as Record<string, unknown>) || {};
    const refPath =
      data.referenceImagePath ||
      (currentAnalysisObj["original_image_path"] as string) ||
      (targetRow?.image_path as string);
    const refUrl =
      data.referenceImageUrl ||
      (currentAnalysisObj["original_image_url"] as string) ||
      (targetRow?.image_url as string);

    if (refPath) {
      try {
        const { data: blob, error: dlErr } = await supabase.storage.from("images").download(refPath);
        if (!dlErr && blob) {
          const buffer = await blob.arrayBuffer();
          const b64 = Buffer.from(buffer).toString("base64");
          referenceImage = {
            base64: b64,
            mimeType: blob.type || "image/jpeg",
          };
        }
      } catch {
        /* fallback para refUrl */
      }
    }

    if (!referenceImage && refUrl && refUrl.startsWith("http")) {
      try {
        const resp = await fetch(refUrl);
        if (resp.ok) {
          const buffer = await resp.arrayBuffer();
          const b64 = Buffer.from(buffer).toString("base64");
          referenceImage = {
            base64: b64,
            mimeType: resp.headers.get("content-type") || "image/jpeg",
          };
        }
      } catch {
        /* segue sem imagem de referência */
      }
    }

    const effectiveKey = data.geminiApiKey?.trim() || dbGroupApiKey;
    let generated: { base64: string; mimeType: string };
    let modelUsed: string;

    const isLovableExplicit = data.provider === "lovable";
    const isGeminiExplicit = data.provider === "gemini";
    const isLovableModel = data.geminiModel && (
      data.geminiModel.startsWith("dall-e") ||
      data.geminiModel.startsWith("black-forest") ||
      data.geminiModel.includes("flux") ||
      data.geminiModel.startsWith("openai/")
    );

    if (isLovableExplicit || isLovableModel || (!isGeminiExplicit && !effectiveKey)) {
      modelUsed = data.geminiModel || "dall-e-3";
      generated = await callLovableOrOpenAiImageGen(data.prompt, data.aspectRatio, modelUsed);
    } else if (effectiveKey) {
      modelUsed = data.geminiModel || "imagen-3.0-generate-002";
      // Gera a imagem passando a referência visual original
      generated = await callGeminiImagen(data.prompt, effectiveKey, data.aspectRatio, data.geminiModel, referenceImage);
    } else {
      modelUsed = "dall-e-3";
      generated = await callLovableOrOpenAiImageGen(data.prompt, data.aspectRatio, modelUsed);
    }

    // Converte base64 para Uint8Array para upload
    const binaryString = atob(generated.base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Faz upload para o bucket 'images' do Supabase
    const imageId = crypto.randomUUID();
    const filePath = `generated-arts/${imageId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, bytes, {
        contentType: generated.mimeType || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Falha ao salvar a imagem no servidor: ${uploadError.message}`);
    }

    // Cria Signed URL com 30 dias de validade
    const signed = await supabase.storage.from("images").createSignedUrl(filePath, 60 * 60 * 24 * 30);
    const imageUrl = signed.data?.signedUrl || "";

    // 3. Monta e atualiza a Galeria de Imagens (Original + Versões IA)
    if (data.targetArtId && targetRow) {
      try {
        const currentAnalysis = (targetRow.analysis as Record<string, unknown>) || {};
        const originalUrl =
          (currentAnalysis["original_image_url"] as string) ||
          (targetRow.image_url as string) ||
          imageUrl;
        const originalPath =
          (currentAnalysis["original_image_path"] as string) ||
          (targetRow.image_path as string) ||
          undefined;

        let gallery: Array<{
          id: string;
          url: string;
          path?: string;
          type: "original" | "ai_generated";
          created_at: string;
          prompt?: string;
          model_used?: string;
        }> = Array.isArray(currentAnalysis["image_gallery"])
          ? [...(currentAnalysis["image_gallery"] as Array<{
              id: string;
              url: string;
              path?: string;
              type: "original" | "ai_generated";
              created_at: string;
              prompt?: string;
              model_used?: string;
            }>)]
          : [];

        // Adiciona a imagem original na galeria se ainda não constar
        if (originalUrl && !gallery.some((g) => g.type === "original")) {
          gallery.unshift({
            id: `orig-${data.targetArtId}`,
            url: originalUrl,
            path: originalPath,
            type: "original",
            created_at: (targetRow.created_at as string) || new Date().toISOString(),
          });
        }

        // Adiciona a nova arte gerada com IA na galeria
        const newGalleryItem = {
          id: `ai-${imageId}`,
          url: imageUrl,
          path: filePath,
          type: "ai_generated" as const,
          created_at: new Date().toISOString(),
          prompt: data.prompt,
          model_used: modelUsed,
        };

        gallery = [...gallery.filter((g) => g.url !== imageUrl), newGalleryItem];

        await supabase
          .from("image_analysis")
          .update({
            image_url: imageUrl,
            image_path: filePath,
            analysis: {
              ...currentAnalysis,
              original_image_url: originalUrl,
              original_image_path: originalPath,
              image_gallery: gallery,
              generated_with_ai: true,
              ai_generated_at: new Date().toISOString(),
              ai_image_prompt: data.prompt,
              ai_model_used: modelUsed,
            },
          })
          .eq("id", data.targetArtId);
      } catch (saveErr) {
        console.error("Erro ao atualizar galeria do anúncio:", saveErr);
      }
    }

    // Abate cota do grupo (~R$ 0.15 por geração de imagem)
    if (data.groupId) {
      try {
        const { data: grp } = await supabase
          .from("iam_groups")
          .select("used_brl, quota_brl")
          .eq("id", data.groupId)
          .single();

        if (grp) {
          const nextUsed = Math.min(Number(grp.quota_brl), Number(grp.used_brl) + 0.15);
          await supabase
            .from("iam_groups")
            .update({ used_brl: nextUsed, updated_at: new Date().toISOString() })
            .eq("id", data.groupId);
        }
      } catch {
        /* ignore */
      }
    }

    // Registra telemetria de geração de imagem
    try {
      await supabase.from("ai_usage_logs").insert({
        group_id: data.groupId || null,
        group_name: effectiveGroupName,
        model: modelUsed,
        estimated_input_tokens: Math.round(data.prompt.length / 4),
        estimated_output_tokens: 1024,
        estimated_cost_brl: 0.15,
        status: "success",
      });
    } catch {
      /* ignore */
    }

    return {
      ok: true as const,
      imageUrl,
      imagePath: filePath,
      modelUsed,
      base64DataUrl: `data:${generated.mimeType};base64,${generated.base64}`,
    };
  });

/** Server function: Exclui uma imagem específica (original ou gerada por IA) da galeria e do storage */
export const deleteAnalysisImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DeleteAnalysisImageInput.parse(data))
  .handler(async ({ data }) => {
    const supabase = serverClient();

    const { data: targetRow, error: fetchErr } = await supabase
      .from("image_analysis")
      .select("id, image_url, image_path, analysis")
      .eq("id", data.analysisId)
      .single();

    if (fetchErr || !targetRow) throw new Error("Anúncio não encontrado no banco de dados.");

    const currentAnalysis = (targetRow.analysis as Record<string, unknown>) || {};
    let gallery: Array<{
      id: string;
      url: string;
      path?: string;
      type: "original" | "ai_generated";
      created_at: string;
      prompt?: string;
      model_used?: string;
    }> = Array.isArray(currentAnalysis["image_gallery"])
      ? [...(currentAnalysis["image_gallery"] as Array<{
          id: string;
          url: string;
          path?: string;
          type: "original" | "ai_generated";
          created_at: string;
          prompt?: string;
          model_used?: string;
        }>)]
      : [];

    let updatedImageUrl = targetRow.image_url;
    let updatedImagePath = targetRow.image_path;
    const updatedAnalysis = { ...currentAnalysis };

    // Remove do bucket se houver caminho
    if (data.imagePath) {
      try {
        await supabase.storage.from("images").remove([data.imagePath]);
      } catch {
        /* ignore storage error */
      }
    }

    if (data.galleryItemId) {
      const itemToDelete = gallery.find((g) => g.id === data.galleryItemId);
      if (itemToDelete?.path) {
        try {
          await supabase.storage.from("images").remove([itemToDelete.path]);
        } catch {
          /* ignore */
        }
      }

      if (itemToDelete?.type === "original") {
        updatedAnalysis["original_image_url"] = null;
        updatedAnalysis["original_image_path"] = null;
      }

      gallery = gallery.filter((g) => g.id !== data.galleryItemId);

      // Se a imagem deletada era a principal exibida, define outra imagem da galeria como principal
      if (
        itemToDelete &&
        (itemToDelete.url === updatedImageUrl || (itemToDelete.path && itemToDelete.path === updatedImagePath))
      ) {
        const next = gallery[gallery.length - 1] || gallery[0];
        updatedImageUrl = next ? next.url : null;
        updatedImagePath = next ? next.path || null : null;
      }
    } else if (data.targetType === "original") {
      updatedAnalysis["original_image_url"] = null;
      updatedAnalysis["original_image_path"] = null;
      gallery = gallery.filter((g) => g.type !== "original");
      if (updatedImageUrl === currentAnalysis["original_image_url"]) {
        const next = gallery[gallery.length - 1] || gallery[0];
        updatedImageUrl = next ? next.url : null;
        updatedImagePath = next ? next.path || null : null;
      }
    } else if (data.targetType === "generated") {
      if (data.imageUrl) {
        gallery = gallery.filter((g) => g.url !== data.imageUrl);
      }
      const next = gallery.find((g) => g.type === "original") || gallery[0];
      updatedImageUrl = next ? next.url : null;
      updatedImagePath = next ? next.path || null : null;
    }

    updatedAnalysis["image_gallery"] = gallery;

    const { error: updateErr } = await supabase
      .from("image_analysis")
      .update({
        image_url: updatedImageUrl,
        image_path: updatedImagePath,
        analysis: updatedAnalysis,
      })
      .eq("id", data.analysisId);

    if (updateErr) throw new Error(`Falha ao remover imagem: ${updateErr.message}`);

    return {
      ok: true as const,
      updatedImageUrl,
      updatedImagePath,
      gallery,
    };
  });

/** Server function: Define qual imagem da galeria é a principal da vitrine */
export const setActiveAnalysisImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SetActiveImageInput.parse(data))
  .handler(async ({ data }) => {
    const supabase = serverClient();

    const { error } = await supabase
      .from("image_analysis")
      .update({
        image_url: data.imageUrl,
        image_path: data.imagePath || null,
      })
      .eq("id", data.analysisId);

    if (error) throw new Error(`Falha ao definir imagem principal: ${error.message}`);

    return { ok: true as const };
  });


