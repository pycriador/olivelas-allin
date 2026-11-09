import type {
  AIProviderType, AIModelType, AIProvider, OCRResult, OCRField,
  VisionResult, VisionDetection, PlaygroundSession, AIHistoryEntry,
} from "./types";

export interface AIProviderInterface {
  analyze(prompt: string, context?: Record<string, unknown>): Promise<{ text: string; confidence: number; tokensUsed: number }>;
  extract(text: string, fields: string[]): Promise<Record<string, { value: string; confidence: number }>>;
  classify(text: string, categories: string[]): Promise<{ category: string; confidence: number }>;
  summarize(text: string, maxLength?: number): Promise<{ summary: string; confidence: number }>;
  generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<{ text: string; confidence: number; tokensUsed: number }>;
  chat(messages: { role: "user" | "assistant" | "system"; content: string }[]): Promise<{ text: string; confidence: number; tokensUsed: number }>;
  vision(imageData: string, instruction: string): Promise<{ text: string; detections: VisionDetection[]; confidence: number }>;
  ocr(imageData: string, options?: { language?: string; autoRotate?: boolean }): Promise<OCRResult>;
  validate(data: Record<string, unknown>, rules: Record<string, unknown>): Promise<{ valid: boolean; errors: string[]; confidence: number }>;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const mockProvider: AIProviderInterface = {
  async analyze(prompt, context) {
    await delay(300 + Math.random() * 400);
    return {
      text: `Análise simulada para: "${prompt.slice(0, 50)}..."`,
      confidence: 0.75 + Math.random() * 0.2,
      tokensUsed: Math.floor(50 + Math.random() * 200),
    };
  },

  async extract(text, fields) {
    await delay(200 + Math.random() * 300);
    const result: Record<string, { value: string; confidence: number }> = {};
    for (const field of fields) {
      result[field] = {
        value: `Valor simulado para ${field}`,
        confidence: 0.6 + Math.random() * 0.35,
      };
    }
    return result;
  },

  async classify(text, categories) {
    await delay(150 + Math.random() * 200);
    const idx = Math.floor(Math.random() * categories.length);
    return { category: categories[idx], confidence: 0.7 + Math.random() * 0.25 };
  },

  async summarize(text, maxLength) {
    await delay(400 + Math.random() * 400);
    const summary = text.length > 100 ? text.slice(0, maxLength || 100) + "..." : text;
    return { summary, confidence: 0.8 + Math.random() * 0.15 };
  },

  async generate(prompt, options) {
    await delay(500 + Math.random() * 500);
    return {
      text: `[MOCK] Resposta gerada para: "${prompt.slice(0, 60)}..."`,
      confidence: 0.8 + Math.random() * 0.15,
      tokensUsed: Math.floor(100 + Math.random() * 500),
    };
  },

  async chat(messages) {
    await delay(300 + Math.random() * 500);
    const lastMsg = messages[messages.length - 1]?.content || "";
    return {
      text: `[MOCK] Resposta para: "${lastMsg.slice(0, 60)}..."`,
      confidence: 0.75 + Math.random() * 0.2,
      tokensUsed: Math.floor(50 + Math.random() * 300),
    };
  },

  async vision(imageData, instruction) {
    await delay(600 + Math.random() * 600);
    const detections: VisionDetection[] = [
      { type: "document-recognition", value: "Documento simulado", confidence: 0.85, boundingBox: { x: 10, y: 10, width: 200, height: 300 } },
      { type: "qr-code", value: "SIMULATED-QR-001", confidence: 0.9, boundingBox: { x: 50, y: 50, width: 50, height: 50 } },
    ];
    return { text: `[MOCK] Visão: ${instruction}`, detections, confidence: 0.8 + Math.random() * 0.15 };
  },

  async ocr(imageData, options) {
    await delay(800 + Math.random() * 1000);
    const fields: OCRField[] = [
      { name: "cliente_nome", value: "João Silva", confidence: 0.92, status: "identified" },
      { name: "cliente_cpf", value: "123.456.789-00", confidence: 0.85, status: "identified" },
      { name: "os_numero", value: "OS-2024-00123", confidence: 0.88, status: "identified" },
      { name: "aparelho_modelo", value: "iPhone 15 Pro Max", confidence: 0.78, status: "identified" },
      { name: "aparelho_serial", value: "SN-987654321", confidence: 0.65, status: "identified" },
      { name: "defeito_relatado", value: "Tela trincada e não liga", confidence: 0.91, status: "identified" },
      { name: "valor_servico", value: "R$ 450,00", confidence: 0.73, status: "identified" },
      { name: "telefone", value: "(11) 99999-8888", confidence: 0.45, status: "identified" },
    ];
    return {
      id: uid(),
      sourceId: "mock-source",
      sourceType: "image",
      rawText: "ORDEM DE SERVIÇO\nCliente: João Silva\nCPF: 123.456.789-00\nOS: OS-2024-00123\nAparelho: iPhone 15 Pro Max\nDefeito: Tela trincada",
      structuredText: JSON.stringify(fields),
      fields,
      confidence: 0.78,
      processingTime: 950,
      status: "completed",
      createdAt: new Date().toISOString(),
    };
  },

  async validate(data, rules) {
    await delay(200 + Math.random() * 300);
    const errors: string[] = [];
    let confidence = 1;
    for (const [key, value] of Object.entries(data)) {
      if (!value && rules[key as keyof typeof rules]) {
        errors.push(`Campo "${key}" é obrigatório`);
        confidence -= 0.1;
      }
    }
    return { valid: errors.length === 0, errors, confidence: Math.max(0, confidence) };
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const providerInstances = new Map<AIProviderType, AIProviderInterface>();
providerInstances.set("mock", mockProvider);

export function getAIProvider(type: AIProviderType): AIProviderInterface {
  const provider = providerInstances.get(type);
  if (!provider) return mockProvider;
  return provider;
}

export function registerAIProvider(type: AIProviderType, instance: AIProviderInterface): void {
  providerInstances.set(type, instance);
}

export const AI_PROVIDER_CONFIGS: Record<AIProviderType, { name: string; models: AIModelType[]; defaultModel: AIModelType }> = {
  mock: { name: "Mock Provider", models: ["mock-model"], defaultModel: "mock-model" },
  openai: { name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"], defaultModel: "gpt-4o" },
  gemini: { name: "Google Gemini", models: ["gemini-2.0-flash", "gemini-2.0-pro"], defaultModel: "gemini-2.0-flash" },
  claude: { name: "Anthropic Claude", models: ["claude-3.5-sonnet", "claude-3-haiku"], defaultModel: "claude-3.5-sonnet" },
  ollama: { name: "Ollama", models: ["llama-3.3-70b", "mistral-7b", "local-llama", "local-mistral"], defaultModel: "llama-3.3-70b" },
  openrouter: { name: "OpenRouter", models: ["openrouter-gpt-4o", "openrouter-claude-3.5"], defaultModel: "openrouter-gpt-4o" },
  "azure-openai": { name: "Azure OpenAI", models: ["azure-gpt-4o"], defaultModel: "azure-gpt-4o" },
  "aws-bedrock": { name: "AWS Bedrock", models: ["bedrock-claude-3.5"], defaultModel: "bedrock-claude-3.5" },
  local: { name: "Modelo Local", models: ["local-llama", "local-mistral"], defaultModel: "local-llama" },
};

export const allAIModels: AIModelType[] = [
  "mock-model",
  "gpt-4o", "gpt-4o-mini", "gpt-4-turbo",
  "gemini-2.0-flash", "gemini-2.0-pro",
  "claude-3.5-sonnet", "claude-3-haiku",
  "llama-3.3-70b", "mistral-7b",
  "openrouter-gpt-4o", "openrouter-claude-3.5",
  "azure-gpt-4o", "bedrock-claude-3.5",
  "local-llama", "local-mistral",
];
