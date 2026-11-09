import type {
  AIProviderLike,
  AIProviderModel,
  AIGenerateOptions,
  AICompletion,
  AIStreamEvent,
  AIEmbeddingsOptions,
  AIEmbeddingResult,
  AIModerationOptions,
  AIModerationResult,
  ExtractionUsage,
  AIProviderParams,
} from "../provider";
import { resolveMessages } from "../provider";
import { estimateTokens } from "../cost";

/**
 * Base para todos os providers de IA.
 * Implementa o fallback determinístico de tokens/custo e delega os formatos
 * específicos de cada vendor nas subclasses.
 */
export abstract class BaseAIProvider implements AIProviderLike {
  abstract readonly kind: AIProviderLike["kind"];

  constructor(protected params: AIProviderParams = {}) {}

  get apiKey(): string | undefined {
    return this.params.apiKey;
  }

  get baseUrl(): string | undefined {
    return this.params.baseUrl;
  }

  get defaultModel(): string | undefined {
    return this.params.defaultModel;
  }

  get timeoutMs(): number {
    return this.params.timeoutMs ?? 30000;
  }

  get defaultTemperature(): number {
    return this.params.defaultTemperature ?? 0.7;
  }

  get maxTokens(): number {
    return this.params.maxTokens ?? 4096;
  }

  async connect(): Promise<void> {}

  abstract listModels(): Promise<AIProviderModel[]>;

  abstract generate(options: AIGenerateOptions): Promise<AICompletion>;

  abstract stream(options: AIGenerateOptions, onEvent: (e: AIStreamEvent) => void): Promise<void>;

  abstract embeddings(options: AIEmbeddingsOptions): Promise<AIEmbeddingResult[]>;

  abstract moderation(options: AIModerationOptions): Promise<AIModerationResult>;

  countTokens(text: string): number {
    return estimateTokens(text);
  }

  estimateCost(usage: ExtractionUsage, model: string): number {
    return estimateUsageCost(usage, model);
  }

  protected buildMessages(options: AIGenerateOptions) {
    return resolveMessages(options.prompt, options.systemPrompt, options.messages);
  }

  protected resolveModel(model?: string): string {
    return model ?? this.defaultModel ?? "";
  }

  protected async fetchJson(url: string, init: RequestInit): Promise<Response> {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), this.timeoutMs);
    try {
      return await fetch(url, {
        ...init,
        signal: init.signal ?? ac.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

let costTable: Record<string, { input?: number; output?: number }> = {};

export function setCostTable(table: Record<string, { input?: number; output?: number }>) {
  costTable = table;
}

function estimateUsageCost(usage: ExtractionUsage, model: string): number {
  const price = costTable[model] ?? {};
  const inputUsd = ((usage.promptTokens ?? 0) / 1_000_000) * (price.input ?? 0);
  const outputUsd = ((usage.completionTokens ?? 0) / 1_000_000) * (price.output ?? 0);
  return inputUsd + outputUsd;
}
