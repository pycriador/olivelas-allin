import { BaseAIProvider } from "./base";
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

export class ClaudeProvider extends BaseAIProvider {
  readonly kind = "claude" as const;

  private get endpoint(): string {
    return this.baseUrl ?? "https://api.anthropic.com/v1";
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey ?? "",
      "anthropic-version": "2023-06-01",
    };
  }

  private toMessages(options: AIGenerateOptions) {
    const messages = this.buildMessages(options);
    return {
      system: messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n"),
      messages: messages
        .filter((m) => m.role !== "system")
        .map(({ role, content }) => ({
          role: role === "assistant" ? "assistant" : "user",
          content,
        })),
    };
  }

  async listModels(): Promise<AIProviderModel[]> {
    return [];
  }

  async generate(options: AIGenerateOptions): Promise<AICompletion> {
    const model = this.resolveModel(options.model);
    const { system, messages } = this.toMessages(options);
    const body: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens ?? this.maxTokens,
      temperature: options.temperature ?? this.defaultTemperature,
      messages,
    };
    if (system) body["system"] = system;

    const res = await this.fetchJson(`${this.endpoint}/messages`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Claude error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = (data.content ?? [])
      .filter((b: { type?: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
    const usage: ExtractionUsage = {
      promptTokens:
        data.usage?.input_tokens ??
        this.countTokens(messages.map((m) => m.content as string).join(" ")),
      completionTokens: data.usage?.output_tokens ?? this.countTokens(text),
      totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    };
    return { text, usage, model };
  }

  async stream(options: AIGenerateOptions, onEvent: (e: AIStreamEvent) => void): Promise<void> {
    const model = this.resolveModel(options.model);
    const { system, messages } = this.toMessages(options);
    const body: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens ?? this.maxTokens,
      temperature: options.temperature ?? this.defaultTemperature,
      messages,
      stream: true,
    };
    if (system) body["system"] = system;

    const res = await this.fetchJson(`${this.endpoint}/messages`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Claude error ${res.status}: ${await res.text()}`);
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;
        try {
          const json = JSON.parse(payload);
          if (json.type === "content_block_delta" && json.delta?.text) {
            onEvent({ type: "chunk", content: json.delta.text });
          }
        } catch {
          // ignora fragmentos parciais
        }
      }
    }
    onEvent({ type: "done" });
  }

  async embeddings(options: AIEmbeddingsOptions): Promise<AIEmbeddingResult[]> {
    throw new Error("Claude não dispõe de endpoint público de embeddings via esta interface.");
  }

  async moderation(options: AIModerationOptions): Promise<AIModerationResult> {
    return { flagged: false };
  }
}
