export type AIProviderType =
  | "mock" | "openai" | "gemini" | "claude" | "ollama"
  | "openrouter" | "azure-openai" | "aws-bedrock" | "local";

export type AIModelType =
  | "mock-model"
  | "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo"
  | "gemini-2.0-flash" | "gemini-2.0-pro"
  | "claude-3.5-sonnet" | "claude-3-haiku"
  | "llama-3.3-70b" | "mistral-7b"
  | "openrouter-gpt-4o" | "openrouter-claude-3.5"
  | "azure-gpt-4o" | "bedrock-claude-3.5"
  | "local-llama" | "local-mistral";

export type AIProviderStatus = "active" | "inactive" | "error";

export interface AIProvider {
  id: string;
  name: string;
  type: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  models: AIModelType[];
  defaultModel: AIModelType;
  status: AIProviderStatus;
  temperature: number;
  maxTokens: number;
  timeout: number;
  retryCount: number;
  config: Record<string, string>;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type OCRStatus = "pending" | "processing" | "completed" | "error";
export type OCRSource = "image" | "pdf" | "scanner";

export interface OCRResult {
  id: string;
  sourceId: string;
  sourceType: OCRSource;
  rawText: string;
  structuredText: string;
  fields: OCRField[];
  confidence: number;
  processingTime: number;
  status: OCRStatus;
  error?: string;
  createdAt?: string;
}

export interface OCRField {
  name: string;
  value: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  status: OCRFieldStatus;
  notes?: string;
}

export type OCRFieldStatus = "identified" | "confirmed" | "edited" | "rejected" | "ignored";

export interface OCRRequest {
  id: string;
  sourceId: string;
  sourceType: OCRSource;
  sourceName: string;
  imageData?: string;
  documentId?: string;
  status: OCRStatus;
  result?: OCRResult;
  createdAt?: string;
  updatedAt?: string;
}

export type VisionType =
  | "document-recognition"
  | "device-recognition"
  | "label-reading"
  | "serial-number"
  | "brand-identification"
  | "qr-code"
  | "barcode"
  | "image-quality"
  | "auto-rotate"
  | "perspective-correction"
  | "multi-document";

export interface VisionResult {
  id: string;
  type: VisionType;
  sourceId: string;
  detections: VisionDetection[];
  confidence: number;
  processingTime: number;
  status: "pending" | "processing" | "completed" | "error";
  error?: string;
  createdAt?: string;
}

export interface VisionDetection {
  type: VisionType;
  value: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  metadata?: Record<string, string>;
}

export interface VisionRequest {
  id: string;
  type: VisionType;
  sourceId: string;
  imageData?: string;
  status: "pending" | "processing" | "completed" | "error";
  result?: VisionResult;
  createdAt?: string;
  updatedAt?: string;
}

export type PromptCategory =
  | "ocr" | "service-order" | "customer" | "device"
  | "financial" | "document" | "communication"
  | "summary" | "classification" | "extraction" | "validation";

export type PromptStatus = "draft" | "published" | "archived";

export interface Prompt {
  id: string;
  name: string;
  category: PromptCategory;
  description: string;
  template: string;
  version: number;
  companyId?: string;
  isGlobal: boolean;
  status: PromptStatus;
  variables: PromptVariable[];
  temperature: number;
  suggestedModel: AIModelType;
  tags: string[];
  history: PromptVersion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PromptVariable {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "entity";
  required: boolean;
  defaultValue?: string;
  options?: string[];
}

export interface PromptVersion {
  version: number;
  template: string;
  variables: PromptVariable[];
  temperature: number;
  updatedBy?: string;
  updatedAt: string;
  changelog: string;
}

export type AIQueueStatus = "pending" | "processing" | "completed" | "error" | "cancelled" | "retry";

export interface AIQueueItem {
  id: string;
  type: "ocr" | "vision" | "prompt" | "analysis" | "classification" | "extraction" | "validation";
  provider: AIProviderType;
  model: AIModelType;
  promptId?: string;
  payload: Record<string, unknown>;
  status: AIQueueStatus;
  priority: number;
  retryCount: number;
  maxRetries: number;
  result?: Record<string, unknown>;
  error?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AIHistoryEntry {
  id: string;
  type: "ocr" | "vision" | "prompt" | "analysis" | "classification" | "extraction" | "validation" | "chat";
  provider: AIProviderType;
  model: AIModelType;
  prompt: string;
  promptId?: string;
  response: string;
  processingTime: number;
  tokensUsed: number;
  confidence: number;
  userId?: string;
  companyId?: string;
  status: "success" | "error";
  error?: string;
  createdAt?: string;
}

export interface AIAuditEntry {
  id: string;
  type: "ocr" | "vision" | "prompt" | "analysis" | "classification" | "extraction" | "validation" | "config" | "queue";
  provider: AIProviderType;
  model: AIModelType;
  promptId?: string;
  promptName?: string;
  processingTime: number;
  userId?: string;
  companyId?: string;
  result: string;
  confidence: number;
  status: "success" | "error" | "warning";
  metadata?: Record<string, string>;
  createdAt?: string;
}

export interface AIConfig {
  id: string;
  defaultProvider: AIProviderType;
  defaultModel: AIModelType;
  defaultTemperature: number;
  ocr: OCRConfig;
  vision: VisionConfig;
  maxFileSize: number;
  maxPages: number;
  timeout: number;
  retryCount: number;
  updatedAt?: string;
}

export interface OCRConfig {
  enabled: boolean;
  defaultProvider: AIProviderType;
  defaultModel: AIModelType;
  language: string;
  autoRotate: boolean;
  perspectiveCorrection: boolean;
  minConfidence: number;
  supportedFormats: string[];
}

export interface VisionConfig {
  enabled: boolean;
  defaultProvider: AIProviderType;
  defaultModel: AIModelType;
  minConfidence: number;
  supportedTypes: VisionType[];
}

export interface PlaygroundSession {
  id: string;
  provider: AIProviderType;
  model: AIModelType;
  prompt: string;
  temperature: number;
  maxTokens: number;
  response: string;
  processingTime: number;
  tokensUsed: number;
  status: "idle" | "processing" | "completed" | "error";
  error?: string;
  createdAt?: string;
}

export interface ConferenceSession {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: "image" | "pdf" | "document";
  imageData?: string;
  ocrRequestId?: string;
  ocrResult?: OCRResult;
  status: "pending" | "reviewing" | "confirmed" | "rejected";
  mapping: ConferenceMapping[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ConferenceMapping {
  id: string;
  ocrField: string;
  ocrValue: string;
  ocrConfidence: number;
  mappedField: string;
  mappedValue: string;
  status: "pending" | "accepted" | "edited" | "rejected" | "ignored";
  critical: boolean;
  notes?: string;
  source?: string;
}

export interface AIPlaygroundHistory {
  id: string;
  provider: AIProviderType;
  model: AIModelType;
  prompt: string;
  response: string;
  temperature: number;
  processingTime: number;
  tokensUsed: number;
  createdAt?: string;
}
