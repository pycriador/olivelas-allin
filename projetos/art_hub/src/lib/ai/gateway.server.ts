/**
 * Server-only helper for Lovable AI Gateway.
 * Reads LOVABLE_API_KEY inside call-time — never at module scope.
 */
const GATEWAY_BASE = "https://ai.gateway.lovable.dev/v1";

function requireKey(): string {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Serviço de IA indisponível.");
  return key;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  response_format?: { type: "json_object" };
  timeoutMs?: number;
}

export interface ChatCompletionResult {
  text: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  model?: string;
}

export async function chatCompletion(opts: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const key = requireKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000);
  try {
    const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.4,
        ...(opts.response_format ? { response_format: opts.response_format } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[ai] gateway error ${res.status}: ${body.slice(0, 200)}`);
      if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
      if (res.status === 429)
        throw new Error("Limite de taxa atingido. Tente novamente em instantes.");
      throw new Error(`Erro no serviço de IA (${res.status}).`);
    }
    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: ChatCompletionResult["usage"];
      model?: string;
    };
    return {
      text: data.choices?.[0]?.message?.content ?? "",
      usage: data.usage,
      model: data.model,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function createEmbedding(model: string, input: string): Promise<number[] | null> {
  const key = requireKey();
  const res = await fetch(`${GATEWAY_BASE}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({ model, input }),
  });
  if (!res.ok) {
    console.error("[ai] embedding failed", res.status);
    return null;
  }
  const data = (await res.json()) as { data?: Array<{ embedding: number[] }> };
  return data.data?.[0]?.embedding ?? null;
}

/** Extract JSON object from model text (strips ```json fences if present). */
export function parseJsonLoose<T = unknown>(text: string): T {
  let clean = text.trim();
  if (clean.startsWith("```")) {
    clean = clean
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
  }
  // Some models add prose before/after — grab the first {...} block.
  const first = clean.indexOf("{");
  const last = clean.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    clean = clean.slice(first, last + 1);
  }
  return JSON.parse(clean) as T;
}
