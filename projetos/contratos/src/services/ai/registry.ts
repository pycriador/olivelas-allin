import type { AiProviderKind } from "@/types";
import type { AIProviderLike, AIProviderParams } from "./provider";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";
import { ClaudeProvider } from "./providers/claude";
import { OpenRouterProvider } from "./providers/openrouter";
import { AzureOpenAIProvider } from "./providers/azure";
import { LocalLLMProvider } from "./providers/local";

const factories: Record<AiProviderKind, (p: AIProviderParams) => AIProviderLike> = {
  openai: (p) => new OpenAIProvider(p),
  gemini: (p) => new GeminiProvider(p),
  claude: (p) => new ClaudeProvider(p),
  openrouter: (p) => new OpenRouterProvider(p),
  azure_openai: (p) => new AzureOpenAIProvider(p),
  local: (p) => new LocalLLMProvider(p),
};

const KIND_LABEL: Record<AiProviderKind, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
  claude: "Anthropic Claude",
  openrouter: "OpenRouter",
  azure_openai: "Azure OpenAI",
  local: "Local LLM",
};

export class AIProviderRegistry {
  create(kind: AiProviderKind, params: AIProviderParams = {}): AIProviderLike {
    const factory = factories[kind];
    if (!factory) throw new Error(`Provider não suportado: ${kind}`);
    return factory(params);
  }
}

export const aiProviderRegistry = new AIProviderRegistry();

export function providerKindLabel(kind: AiProviderKind): string {
  return KIND_LABEL[kind] ?? kind;
}

export const AI_PROVIDER_KINDS: AiProviderKind[] = [
  "openai",
  "gemini",
  "claude",
  "openrouter",
  "azure_openai",
  "local",
];
