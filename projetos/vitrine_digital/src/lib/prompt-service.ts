import { supabase } from "@/integrations/supabase/client";
import { ANALYSIS_PROMPT } from "./analysis-schema";
import type { AiUsageLog, AiUsageMetrics, IamPrompt, PromptType } from "./prompt-types";

const STORAGE_KEYS = {
  PROMPTS: "wai_iam_prompts_v1",
  USAGE_LOGS: "wai_ai_usage_logs_v1",
};

// Flags de disponibilidade de tabelas no Supabase
const tableDisabled: Record<string, boolean> = {};

function markTableDisabled(table: string) {
  tableDisabled[table] = true;
}

function isTableAvailable(table: string): boolean {
  return !tableDisabled[table];
}

export const DEFAULT_PROMPTS: IamPrompt[] = [
  {
    id: "prompt-vision-default-01",
    name: "Prompt Oficial de Extração OCR & JSON Estruturado",
    type: "vision_extraction",
    content: ANALYSIS_PROMPT,
    description: "Prompt principal de visão computacional, extração de produtos, cardápios e dados de contato.",
    is_active: true,
    is_system_default: true,
    version: "v1.0",
    model_target: "all",
    created_at: new Date().toISOString(),
  },
  {
    id: "prompt-art-default-02",
    name: "Prompt Padrão de Geração de Arte Publicitária",
    type: "art_generation",
    content: `Crie uma peça publicitária de alta conversão, fotografia profissional e iluminação cinematográfica de estúdio para produtos e serviços locais. Utilize composição limpa, cores harmoniosas e destaque visual do produto principal.`,
    description: "Diretrizes padrão para refazer arte com geradores de imagem (Gemini Imagen, Midjourney, DALL-E).",
    is_active: true,
    is_system_default: true,
    version: "v1.0",
    model_target: "all",
    created_at: new Date().toISOString(),
  },
];

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Falha ao salvar no localStorage:", err);
  }
}

// ----------------------------------------------------
// 1. PROMPTS CRUD & GESTÃO
// ----------------------------------------------------
export async function listPrompts(type?: PromptType): Promise<IamPrompt[]> {
  if (isTableAvailable("iam_prompts")) {
    try {
      let query = supabase.from("iam_prompts").select("*").order("created_at", { ascending: false });
      if (type) {
        query = query.eq("type", type);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        setLocal(STORAGE_KEYS.PROMPTS, data);
        return data as unknown as IamPrompt[];
      }
      if (error) {
        markTableDisabled("iam_prompts");
      }
    } catch {
      markTableDisabled("iam_prompts");
    }
  }

  const cached = getLocal<IamPrompt[]>(STORAGE_KEYS.PROMPTS, DEFAULT_PROMPTS);
  if (!cached || cached.length === 0) {
    setLocal(STORAGE_KEYS.PROMPTS, DEFAULT_PROMPTS);
    return DEFAULT_PROMPTS;
  }
  if (type) {
    return cached.filter((p) => p.type === type);
  }
  return cached;
}

export async function getActivePrompt(type: PromptType = "vision_extraction"): Promise<string> {
  const prompts = await listPrompts(type);
  const active = prompts.find((p) => p.is_active);
  return active?.content || ANALYSIS_PROMPT;
}

export async function savePrompt(promptData: Omit<IamPrompt, "created_at" | "id"> & { id?: string }): Promise<IamPrompt> {
  const id = promptData.id || crypto.randomUUID();
  const item: IamPrompt = {
    id,
    name: promptData.name.trim(),
    type: promptData.type,
    content: promptData.content.trim(),
    description: promptData.description?.trim(),
    is_active: promptData.is_active ?? true,
    is_system_default: promptData.is_system_default ?? false,
    version: promptData.version || "v1.0",
    model_target: promptData.model_target || "all",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (item.is_active) {
    await deactivateOtherPrompts(item.type, id);
  }

  if (isTableAvailable("iam_prompts")) {
    try {
      const { data, error } = await supabase
        .from("iam_prompts")
        .upsert(item)
        .select()
        .single();

      if (!error && data) {
        const current = await listPrompts();
        setLocal(
          STORAGE_KEYS.PROMPTS,
          [data, ...current.filter((p) => p.id !== data.id)]
        );
        return data as unknown as IamPrompt;
      }
    } catch {
      markTableDisabled("iam_prompts");
    }
  }

  const current = getLocal<IamPrompt[]>(STORAGE_KEYS.PROMPTS, DEFAULT_PROMPTS);
  const updated = [item, ...current.filter((p) => p.id !== id)];
  setLocal(STORAGE_KEYS.PROMPTS, updated);
  return item;
}

export async function setActivePrompt(id: string, type: PromptType): Promise<void> {
  if (isTableAvailable("iam_prompts")) {
    try {
      await supabase.from("iam_prompts").update({ is_active: false }).eq("type", type);
      await supabase.from("iam_prompts").update({ is_active: true, updated_at: new Date().toISOString() }).eq("id", id);
    } catch {
      markTableDisabled("iam_prompts");
    }
  }

  const current = getLocal<IamPrompt[]>(STORAGE_KEYS.PROMPTS, DEFAULT_PROMPTS);
  const updated = current.map((p) => {
    if (p.type === type) {
      return { ...p, is_active: p.id === id };
    }
    return p;
  });
  setLocal(STORAGE_KEYS.PROMPTS, updated);
}

async function deactivateOtherPrompts(type: PromptType, exceptId: string): Promise<void> {
  if (isTableAvailable("iam_prompts")) {
    try {
      await supabase.from("iam_prompts").update({ is_active: false }).eq("type", type).neq("id", exceptId);
    } catch {
      /* ignore */
    }
  }

  const current = getLocal<IamPrompt[]>(STORAGE_KEYS.PROMPTS, DEFAULT_PROMPTS);
  const updated = current.map((p) => {
    if (p.type === type && p.id !== exceptId) {
      return { ...p, is_active: false };
    }
    return p;
  });
  setLocal(STORAGE_KEYS.PROMPTS, updated);
}

export async function deletePrompt(id: string): Promise<void> {
  if (isTableAvailable("iam_prompts")) {
    try {
      await supabase.from("iam_prompts").delete().eq("id", id);
    } catch {
      markTableDisabled("iam_prompts");
    }
  }
  const current = getLocal<IamPrompt[]>(STORAGE_KEYS.PROMPTS, DEFAULT_PROMPTS);
  setLocal(
    STORAGE_KEYS.PROMPTS,
    current.filter((p) => p.id !== id)
  );
}

export async function restoreDefaultPrompts(): Promise<IamPrompt[]> {
  setLocal(STORAGE_KEYS.PROMPTS, DEFAULT_PROMPTS);
  if (isTableAvailable("iam_prompts")) {
    try {
      for (const p of DEFAULT_PROMPTS) {
        await supabase.from("iam_prompts").upsert(p);
      }
    } catch {
      markTableDisabled("iam_prompts");
    }
  }
  return DEFAULT_PROMPTS;
}

// ----------------------------------------------------
// 2. TELEMETRIA E LOGS DE USO DE IA
// ----------------------------------------------------
export async function recordAiUsageLog(log: Omit<AiUsageLog, "id" | "created_at">): Promise<AiUsageLog> {
  const item: AiUsageLog = {
    id: crypto.randomUUID(),
    group_id: log.group_id || null,
    group_name: log.group_name || "Geral",
    user_id: log.user_id || null,
    user_email: log.user_email || null,
    model: log.model,
    estimated_input_tokens: log.estimated_input_tokens || 1200,
    estimated_output_tokens: log.estimated_output_tokens || 800,
    estimated_cost_brl: Number(log.estimated_cost_brl) || 0.05,
    status: log.status,
    error_message: log.error_message || null,
    created_at: new Date().toISOString(),
  };

  if (isTableAvailable("ai_usage_logs")) {
    try {
      await supabase.from("ai_usage_logs").insert(item);
    } catch {
      markTableDisabled("ai_usage_logs");
    }
  }

  const current = getLocal<AiUsageLog[]>(STORAGE_KEYS.USAGE_LOGS, []);
  setLocal(STORAGE_KEYS.USAGE_LOGS, [item, ...current].slice(0, 500));
  return item;
}

export async function listAiUsageLogs(groupId?: string): Promise<AiUsageLog[]> {
  if (isTableAvailable("ai_usage_logs")) {
    try {
      let query = supabase.from("ai_usage_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (groupId) {
        query = query.eq("group_id", groupId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as unknown as AiUsageLog[];
      }
      if (error) {
        markTableDisabled("ai_usage_logs");
      }
    } catch {
      markTableDisabled("ai_usage_logs");
    }
  }

  const cached = getLocal<AiUsageLog[]>(STORAGE_KEYS.USAGE_LOGS, []);
  if (groupId) {
    return cached.filter((l) => l.group_id === groupId);
  }
  return cached;
}

export async function computeAiUsageMetrics(logs: AiUsageLog[]): Promise<AiUsageMetrics> {
  let totalCostBrl = 0;
  let totalTokens = 0;
  let successfulRequests = 0;
  let errorRequests = 0;

  const byGroup: AiUsageMetrics["byGroup"] = {};
  const byModel: AiUsageMetrics["byModel"] = {};
  const dailyMap: Record<string, { requests: number; costBrl: number }> = {};

  logs.forEach((log) => {
    const cost = Number(log.estimated_cost_brl) || 0;
    const tokens = (log.estimated_input_tokens || 0) + (log.estimated_output_tokens || 0);

    totalCostBrl += cost;
    totalTokens += tokens;

    if (log.status === "success") {
      successfulRequests++;
    } else {
      errorRequests++;
    }

    const gKey = log.group_id || "geral";
    const gName = log.group_name || "Geral";
    if (!byGroup[gKey]) {
      byGroup[gKey] = {
        groupId: gKey,
        groupName: gName,
        requests: 0,
        costBrl: 0,
        tokens: 0,
      };
    }
    byGroup[gKey].requests++;
    byGroup[gKey].costBrl = Number((byGroup[gKey].costBrl + cost).toFixed(4));
    byGroup[gKey].tokens += tokens;

    const mKey = log.model || "gemini-2.5-flash";
    if (!byModel[mKey]) {
      byModel[mKey] = {
        model: mKey,
        requests: 0,
        costBrl: 0,
      };
    }
    byModel[mKey].requests++;
    byModel[mKey].costBrl = Number((byModel[mKey].costBrl + cost).toFixed(4));

    const dateStr = log.created_at ? log.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10);
    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = { requests: 0, costBrl: 0 };
    }
    dailyMap[dateStr].requests++;
    dailyMap[dateStr].costBrl = Number((dailyMap[dateStr].costBrl + cost).toFixed(4));
  });

  const totalRequests = logs.length;
  const avgCostPerRequestBrl = totalRequests > 0 ? Number((totalCostBrl / totalRequests).toFixed(4)) : 0;

  const dailyTrend = Object.entries(dailyMap)
    .map(([date, data]) => ({ date, requests: data.requests, costBrl: data.costBrl }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalRequests,
    successfulRequests,
    errorRequests,
    totalCostBrl: Number(totalCostBrl.toFixed(2)),
    totalTokens,
    avgCostPerRequestBrl,
    byGroup,
    byModel,
    dailyTrend,
  };
}
