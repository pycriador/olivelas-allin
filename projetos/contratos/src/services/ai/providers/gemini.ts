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

export class GeminiProvider extends BaseAIProvider {
  readonly kind = "gemini" as const;

  private get endpoint(): string {
    return this.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta";
  }

  private url(path: string): string {
    return `${this.endpoint}${path}?key=${this.apiKey}`;
  }

  private headers() {
    return { "Content-Type": "application/json" };
  }

  private toContents(options: AIGenerateOptions) {
    const messages = this.buildMessages(options);
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    const system = messages.find((m) => m.role === "system")?.content;
    return { contents, systemInstruction: system ? { parts: [{ text: system }] } : undefined };
  }

  async listModels(): Promise<AIProviderModel[]> {
    const res = await this.fetchJson(this.url("/models"), { headers: this.headers() });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models ?? [])
      .filter((m: { supportedGenerationMethods?: string[] }) =>
        m.supportedGenerationMethods?.includes("generateContent"),
      )
      .map((m: { name: string; displayName?: string }) => ({
        key: m.name.replace("models/", ""),
        displayName: m.displayName ?? m.name.replace("models/", ""),
      }));
  }

  async generate(options: AIGenerateOptions): Promise<AICompletion> {
    const model = this.resolveModel(options.model);
    const { contents, systemInstruction } = this.toContents(options);
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? this.defaultTemperature,
        maxOutputTokens: options.maxTokens ?? this.maxTokens,
      },
    };
    if (systemInstruction) body["systemInstruction"] = systemInstruction;

    const res = await this.fetchJson(this.url(`/models/${model}:generateContent`), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
      "";
    const usage = data.usageMetadata;
    const usageOut: ExtractionUsage = {
      promptTokens:
        usage?.promptTokenCount ??
        this.countTokens(contents.map((c) => c.parts.map((p) => p.text).join(" ")).join(" ")),
      completionTokens: usage?.candidatesTokenCount ?? this.countTokens(text),
      totalTokens: usage?.totalTokenCount ?? 0,
    };
    usageOut.totalTokens =
      usageOut.totalTokens || usageOut.promptTokens + usageOut.completionTokens;
    return { text, usage: usageOut, model };
  }

  async stream(options: AIGenerateOptions, onEvent: (e: AIStreamEvent) => void): Promise<void> {
    const model = this.resolveModel(options.model);
    const { contents, systemInstruction } = this.toContents(options);
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? this.defaultTemperature,
        maxOutputTokens: options.maxTokens ?? this.maxTokens,
      },
    };
    if (systemInstruction) body["systemInstruction"] = systemInstruction;

    const res = await this.fetchJson(this.url(`/models/${model}:streamGenerateContent`), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
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
          const part = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (part) onEvent({ type: "chunk", content: part });
        } catch {
          // ignora fragmentos parciais
        }
      }
    }
    onEvent({ type: "done" });
  }

  async embeddings(options: AIEmbeddingsOptions): Promise<AIEmbeddingResult[]> {
    const model = options.model ?? "text-embedding-004";
    const input = Array.isArray(options.input) ? options.input : [options.input];
    const results: AIEmbeddingResult[] = [];
    for (const text of input) {
      const res = await this.fetchJson(this.url(`/models/${model}:embedContent`), {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ content: { parts: [{ text }] } }),
      });
      if (!res.ok) throw new Error(`Gemini embed error ${res.status}`);
      const data = await res.json();
      results.push({ vector: data.embedding?.values ?? [] });
    }
    return results;
  }

  async moderation(options: AIModerationOptions): Promise<AIModerationResult> {
    // Gemini não possui endpoint público de moderação via REST estável; retorna seguro.
    return { flagged: false };
  }
}
