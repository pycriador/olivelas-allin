export type AiProviderType = 'openai' | 'openai-compatible' | 'gemini' | 'anthropic' | 'azure' | 'ollama';

export interface ProviderModel {
  id: string;
  label: string;
}

export interface AiProviderConfig {
  id: string;
  slug: string;
  name: string;
  providerType: AiProviderType;
  baseUrl: string | null;
  apiKey: string | null;
  models: ProviderModel[];
  config: Record<string, unknown>;
  isActive: boolean;
  isSystem: boolean;
}

export interface AiProviderInstance {
  slug: string;
  name: string;
  type: AiProviderType;
  chat: (params: ChatParams) => Promise<ChatResult>;
  streamChat: (params: ChatParams) => Promise<ReadableStream<string>>;
}

export interface ChatParams {
  model: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatResult {
  content: string;
  model: string;
  provider: string;
  tokensUsed?: number;
  executionTimeMs?: number;
}

export interface AiUsageRecord {
  userId: string;
  providerSlug: string;
  model: string;
  tokens: number;
  executionTimeMs: number;
}
