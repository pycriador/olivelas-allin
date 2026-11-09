import { OpenAIProvider } from "./openai";
import type { AiProviderKind } from "@/types";

/**
 * OpenRouter usa a mesma API compatível com OpenAI (/chat/completions),
 * apenas com endpoint e base_url próprios. Estende OpenAIProvider.
 */
export class OpenRouterProvider extends OpenAIProvider {
  override readonly kind: AiProviderKind = "openrouter";

  protected override get endpoint(): string {
    return this.baseUrl ?? "https://openrouter.ai/api/v1";
  }

  override async listModels() {
    const res = await this.fetchJson(`${this.endpoint}/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? []).map((m: { id: string; name?: string }) => ({
      key: m.id,
      displayName: m.name ?? m.id,
    }));
  }
}
