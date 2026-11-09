import type { AiProviderKind } from "@/types";

/**
 * Contrato único de provider de IA.
 * Toda implementação (OpenAI, Gemini, Claude, OpenRouter, Azure, Local) deve
 * expor exatamente estes métodos. Componentes React nunca importam implementações
 * — usam `aiProviderRegistry`.
 */
export interface AIProviderLike {
  readonly kind: AiProviderKind;
  connect(): Promise<void>;
  listModels(): Promise<AIProviderModel[]>;
  generate(options: AIGenerateOptions): Promise<AICompletion>;
  stream(options: AIGenerateOptions, onEvent: (e: AIStreamEvent) => void): Promise<void>;
  embeddings(options: AIEmbeddingsOptions): Promise<AIEmbeddingResult[]>;
  moderation(options: AIModerationOptions): Promise<AIModerationResult>;
  countTokens(text: string): number;
  estimateCost(usage: ExtractionUsage, model: string): number;
}

export interface AIProviderModel {
  key: string;
  displayName: string;
  contextTokens?: number;
  inputPrice1M?: number;
  outputPrice1M?: number;
  supportsStreaming?: boolean;
  supportsEmbeddings?: boolean;
  supportsModeration?: boolean;
  isBeta?: boolean;
}

export interface AIGenerateOptions {
  model?: string;
  systemPrompt?: string;
  prompt?: string;
  messages?: AIMessageLike[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface AIMessageLike {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ExtractionUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AICompletion {
  text: string;
  usage: ExtractionUsage;
  model: string;
}

export interface AIStreamEvent {
  type: "chunk" | "done" | "error";
  content?: string;
  usage?: ExtractionUsage;
  error?: string;
}

export interface AIEmbeddingsOptions {
  model?: string;
  input: string | string[];
}

export interface AIEmbeddingResult {
  vector: number[];
}

export interface AIModerationOptions {
  input: string | string[];
}

export interface AIModerationResult {
  flagged: boolean;
  categories?: Record<string, boolean>;
  scores?: Record<string, number>;
}

export interface AIProviderParams {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  defaultModel?: string;
  defaultTemperature?: number;
  maxTokens?: number;
}

export function resolveMessages(
  prompt?: string,
  systemPrompt?: string,
  messages?: AIMessageLike[],
): AIMessageLike[] {
  const result: AIMessageLike[] = [];
  if (systemPrompt) result.push({ role: "system", content: systemPrompt });
  if (messages) result.push(...messages);
  else if (prompt) result.push({ role: "user", content: prompt });
  return result;
}
