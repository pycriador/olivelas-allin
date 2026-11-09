import { OpenAIProvider } from "./openai";
import type { AiProviderKind } from "@/types";

/**
 * Local LLM (Ollama, LM Studio, llama.cpp...) — endpoint compatível com
 * a API OpenAI (/v1/chat/completions). Valor padrão: http://localhost:11434/v1.
 */
export class LocalLLMProvider extends OpenAIProvider {
  override readonly kind: AiProviderKind = "local";

  protected override get endpoint(): string {
    return this.baseUrl ?? "http://localhost:11434/v1";
  }

  protected override headers() {
    return { "Content-Type": "application/json" };
  }
}
