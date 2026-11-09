import { BaseAIProvider } from "./base";
import type { AiProviderKind } from "@/types";
import type {
  AIProviderModel,
  AIGenerateOptions,
  AICompletion,
  AIStreamEvent,
  AIEmbeddingsOptions,
  AIEmbeddingResult,
  AIModerationOptions,
  AIModerationResult,
  ExtractionUsage,
} from "../provider";

export class OpenAIProvider extends BaseAIProvider {
  readonly kind: AiProviderKind = "openai";

  protected get endpoint(): string {
    return this.baseUrl ?? "https://api.openai.com/v1";
  }

  protected headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async listModels(): Promise<AIProviderModel[]> {
    // Catálogo offline — a lista principal vem de ai_models (seed).
    return [];
  }

  async generate(options: AIGenerateOptions): Promise<AICompletion> {
    const model = this.resolveModel(options.model);
    const messages = this.buildMessages(options);
    const body = {
      model,
      messages,
      temperature: options.temperature ?? this.defaultTemperature,
      max_tokens: options.maxTokens ?? this.maxTokens,
      stream: false,
    };
    const res = await this.fetchJson(`${this.endpoint}/chat/completions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const usage: ExtractionUsage = {
      promptTokens:
        data.usage?.prompt_tokens ?? this.countTokens(messages.map((m) => m.content).join(" ")),
      completionTokens: data.usage?.completion_tokens ?? this.countTokens(content),
      totalTokens: data.usage?.total_tokens ?? 0,
    };
    usage.totalTokens = usage.totalTokens || usage.promptTokens + usage.completionTokens;
    return { text: content, usage, model };
  }

  async stream(options: AIGenerateOptions, onEvent: (e: AIStreamEvent) => void): Promise<void> {
    const model = this.resolveModel(options.model);
    const messages = this.buildMessages(options);
    const body = {
      model,
      messages,
      temperature: options.temperature ?? this.defaultTemperature,
      max_tokens: options.maxTokens ?? this.maxTokens,
      stream: true,
    };
    const res = await this.fetchJson(`${this.endpoint}/chat/completions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let started = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") break;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            onEvent({ type: "chunk", content: delta });
            started = true;
          }
        } catch {
          // ignora fragmentos parciais
        }
      }
    }
    onEvent({ type: "done" });
  }

  async embeddings(options: AIEmbeddingsOptions): Promise<AIEmbeddingResult[]> {
    const model = options.model ?? "text-embedding-3-large";
    const input = Array.isArray(options.input) ? options.input : [options.input];
    const res = await this.fetchJson(`${this.endpoint}/embeddings`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ model, input }),
    });
    if (!res.ok) throw new Error(`OpenAI embed error ${res.status}`);
    const data = await res.json();
    return (data.data ?? []).map((d: { embedding: number[] }) => ({ vector: d.embedding }));
  }

  async moderation(options: AIModerationOptions): Promise<AIModerationResult> {
    const input = Array.isArray(options.input) ? options.input : [options.input];
    const res = await this.fetchJson(`${this.endpoint}/moderations`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ input }),
    });
    if (!res.ok) throw new Error(`OpenAI moderation error ${res.status}`);
    const data = await res.json();
    const result = data.results?.[0];
    return {
      flagged: !!result?.flagged,
      categories: result?.categories,
      scores: result?.category_scores,
    };
  }
}
