import type { AiProviderConfig, AiProviderInstance, AiProviderType } from './types';

const providers = new Map<string, () => AiProviderInstance>();

export function registerProvider(slug: string, factory: () => AiProviderInstance): void {
  providers.set(slug, factory);
}

export function getProvider(slug: string): AiProviderInstance | undefined {
  const factory = providers.get(slug);
  if (!factory) return undefined;
  return factory();
}

export function hasProvider(slug: string): boolean {
  return providers.has(slug);
}

export function listProviders(): string[] {
  return Array.from(providers.keys());
}

export async function chat(params: {
  providerSlug: string;
  model: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}): Promise<{
  content: string;
  model: string;
  provider: string;
  tokensUsed?: number;
  executionTimeMs?: number;
}> {
  const provider = getProvider(params.providerSlug);
  if (!provider) throw new Error(`Provider "${params.providerSlug}" não encontrado`);
  const start = Date.now();
  const result = await provider.chat({
    model: params.model,
    messages: params.messages,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    systemPrompt: params.systemPrompt,
  });
  return {
    ...result,
    executionTimeMs: Date.now() - start,
  };
}

export function createStream(params: {
  providerSlug: string;
  model: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}): Promise<ReadableStream<string>> {
  const provider = getProvider(params.providerSlug);
  if (!provider) throw new Error(`Provider "${params.providerSlug}" não encontrado`);
  return provider.streamChat({
    model: params.model,
    messages: params.messages,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    systemPrompt: params.systemPrompt,
  });
}

export function createProviderFromConfig(config: AiProviderConfig): AiProviderInstance {
  switch (config.providerType) {
    case 'openai':
    case 'openai-compatible':
      return createOpenAiCompatibleProvider(config);
    case 'gemini':
      return createGeminiProvider(config);
    case 'anthropic':
      return createAnthropicProvider(config);
    case 'ollama':
      return createOllamaProvider(config);
    case 'azure':
      return createAzureProvider(config);
    default:
      throw new Error(`Tipo de provider não suportado: ${config.providerType}`);
  }
}

function createOpenAiCompatibleProvider(config: AiProviderConfig): AiProviderInstance {
  return {
    slug: config.slug,
    name: config.name,
    type: config.providerType,
    chat: async ({ model, messages, temperature, maxTokens, systemPrompt }) => {
      const body: Record<string, unknown> = {
        model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages,
        ],
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 4096,
        stream: false,
      };
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
          ...config.config,
        } as Record<string, string>,
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Provider ${config.slug} error ${response.status}: ${err}`);
      }
      const data = await response.json();
      return {
        content: data.choices?.[0]?.message?.content ?? '',
        model: data.model ?? model,
        provider: config.slug,
        tokensUsed: data.usage?.total_tokens,
      };
    },
    streamChat: async ({ model, messages, temperature, maxTokens, systemPrompt }) => {
      const body: Record<string, unknown> = {
        model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages,
        ],
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 4096,
        stream: true,
      };
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
          ...config.config,
        } as Record<string, string>,
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Provider ${config.slug} error ${response.status}: ${err}`);
      }
      return response.body as unknown as ReadableStream<string>;
    },
  };
}

function createGeminiProvider(config: AiProviderConfig): AiProviderInstance {
  return {
    slug: config.slug,
    name: config.name,
    type: config.providerType,
    chat: async ({ model, messages, temperature, systemPrompt }) => {
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      }));
      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: temperature ?? 0.7,
        },
        ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
      };
      const url = `${config.baseUrl}/models/${model}:generateContent${config.apiKey ? `?key=${config.apiKey}` : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Gemini error ${response.status}: ${err}`);
      }
      const data = await response.json();
      return {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
        model,
        provider: config.slug,
      };
    },
    streamChat: async ({ model, messages, temperature, systemPrompt }) => {
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      }));
      const body: Record<string, unknown> = {
        contents,
        generationConfig: { temperature: temperature ?? 0.7 },
        ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
      };
      const url = `${config.baseUrl}/models/${model}:streamGenerateContent${config.apiKey ? `?key=${config.apiKey}` : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Gemini error ${response.status}: ${err}`);
      }
      return response.body as unknown as ReadableStream<string>;
    },
  };
}

function createAnthropicProvider(config: AiProviderConfig): AiProviderInstance {
  return {
    slug: config.slug,
    name: config.name,
    type: config.providerType,
    chat: async ({ model, messages, temperature, maxTokens, systemPrompt }) => {
      const body: Record<string, unknown> = {
        model,
        max_tokens: maxTokens ?? 4096,
        temperature: temperature ?? 0.7,
        messages: messages.filter(m => m.role !== 'system'),
        ...(systemPrompt ? { system: systemPrompt } : {}),
      };
      const response = await fetch(`${config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey ?? '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Anthropic error ${response.status}: ${err}`);
      }
      const data = await response.json();
      return {
        content: data.content?.[0]?.text ?? '',
        model: data.model ?? model,
        provider: config.slug,
        tokensUsed: data.usage?.output_tokens,
      };
    },
    streamChat: async ({ model, messages, temperature, maxTokens, systemPrompt }) => {
      const body: Record<string, unknown> = {
        model,
        max_tokens: maxTokens ?? 4096,
        temperature: temperature ?? 0.7,
        stream: true,
        messages: messages.filter(m => m.role !== 'system'),
        ...(systemPrompt ? { system: systemPrompt } : {}),
      };
      const response = await fetch(`${config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey ?? '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Anthropic error ${response.status}: ${err}`);
      }
      return response.body as unknown as ReadableStream<string>;
    },
  };
}

function createOllamaProvider(config: AiProviderConfig): AiProviderInstance {
  return {
    slug: config.slug,
    name: config.name,
    type: config.providerType,
    chat: async ({ model, messages, temperature, systemPrompt }) => {
      const body: Record<string, unknown> = {
        model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages,
        ],
        options: {
          temperature: temperature ?? 0.7,
        },
        stream: false,
      };
      const response = await fetch(`${config.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Ollama error ${response.status}: ${err}`);
      }
      const data = await response.json();
      return {
        content: data.message?.content ?? '',
        model: data.model ?? model,
        provider: config.slug,
      };
    },
    streamChat: async ({ model, messages, temperature, systemPrompt }) => {
      const body: Record<string, unknown> = {
        model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages,
        ],
        options: { temperature: temperature ?? 0.7 },
        stream: true,
      };
      const response = await fetch(`${config.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Ollama error ${response.status}: ${err}`);
      }
      return response.body as unknown as ReadableStream<string>;
    },
  };
}

function createAzureProvider(config: AiProviderConfig): AiProviderInstance {
  return {
    slug: config.slug,
    name: config.name,
    type: config.providerType,
    chat: async ({ model, messages, temperature, maxTokens, systemPrompt }) => {
      const endpoint = config.config['endpoint'] as string || config.baseUrl || '';
      const deployment = config.config['deployment'] as string || model;
      const apiVersion = config.config['apiVersion'] as string || '2024-02-15-preview';
      const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
      const body: Record<string, unknown> = {
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages,
        ],
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 4096,
        stream: false,
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.apiKey ?? '',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Azure error ${response.status}: ${err}`);
      }
      const data = await response.json();
      return {
        content: data.choices?.[0]?.message?.content ?? '',
        model: data.model ?? model,
        provider: config.slug,
        tokensUsed: data.usage?.total_tokens,
      };
    },
    streamChat: async ({ model, messages, temperature, maxTokens, systemPrompt }) => {
      const endpoint = config.config['endpoint'] as string || config.baseUrl || '';
      const deployment = config.config['deployment'] as string || model;
      const apiVersion = config.config['apiVersion'] as string || '2024-02-15-preview';
      const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
      const body: Record<string, unknown> = {
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages,
        ],
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 4096,
        stream: true,
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.apiKey ?? '',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Azure error ${response.status}: ${err}`);
      }
      return response.body as unknown as ReadableStream<string>;
    },
  };
}
