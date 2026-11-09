import type {
  AiModel,
  AiProvider,
  AiProviderKind,
  AiProviderStatus,
  AiAgent,
  AiPrompt,
  AiExecution,
  AiExecutionStatus,
  AiTool,
  AiConversation,
  AiMessage,
  DocumentUpload,
  DocumentAnalysis,
  DocumentRiskLevel,
  KnowledgeSource,
  Json,
} from "@/types";

export interface AIModelOption {
  id: string;
  providerKind: AiProviderKind;
  modelKey: string;
  displayName: string;
  contextTokens?: number | null;
  inputPrice1M?: number | null;
  outputPrice1M?: number | null;
  supportsStreaming?: boolean;
  supportsEmbeddings?: boolean;
  supportsModeration?: boolean;
  isBeta?: boolean;
}

export interface AIProviderConfig {
  id: string;
  workspaceId: string | null;
  name: string;
  kind: AiProviderKind;
  status: AiProviderStatus;
  baseUrl?: string | null;
  defaultModel?: string | null;
  apiKeyEncrypted?: string | null;
  apiKeyFingerprint?: string | null;
  timeoutMs?: number | null;
  defaultTemperature?: number | null;
  maxTokens?: number | null;
  isDefault?: boolean;
}

export interface AIProviderInput {
  name: string;
  kind: AiProviderKind;
  status: AiProviderStatus;
  baseUrl?: string | null;
  defaultModel?: string;
  apiKey?: string;
  timeoutMs?: number;
  defaultTemperature?: number;
  maxTokens?: number;
  isDefault?: boolean;
}

export interface AIGenerateOptions {
  model?: string;
  systemPrompt?: string;
  messages?: AIMessageLike[];
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface AIMessageLike {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIStreamEvent {
  type: "chunk" | "done" | "error";
  content?: string;
  usage?: ExtractionUsage;
  error?: string;
}

export interface ExtractionUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AICompletionResult {
  text: string;
  usage: ExtractionUsage;
  cost: number;
  model: string;
}

export interface AIEmbedding {
  vector: number[];
}

export interface AICostEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface AIModerationResult {
  flagged: boolean;
  categories?: Record<string, boolean>;
  scores?: Record<string, number>;
}

export type AIProviderKindUnion = AiProviderKind;

export type {
  AiProvider,
  AiAgent,
  AiPrompt,
  AiExecution,
  AiExecutionStatus,
  AiTool,
  AiConversation,
  AiMessage,
  DocumentUpload,
  DocumentAnalysis,
  DocumentRiskLevel,
  KnowledgeSource,
  AiModel,
  Json,
};

export interface AIProviderHelper {
  kind: AIProviderKindUnion;
  connect(): Promise<void>;
  listModels(): Promise<AIModelOption[]>;
  generate(options: AIProviderInput & { kind: AIProviderKindUnion }): Promise<AICompletionResult>;
}
