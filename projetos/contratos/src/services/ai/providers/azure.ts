import { OpenAIProvider } from "./openai";
import type { AiProviderKind } from "@/types";
import type { AIGenerateOptions } from "../provider";

/**
 * Azure OpenAI usa API compatível com OpenAI, porém com endpoint
 * https://{resource}.openai.azure.com/openai/deployments/{deploy}/
 * e header api-key. Estende OpenAIProvider.
 */
export class AzureOpenAIProvider extends OpenAIProvider {
  override readonly kind: AiProviderKind = "azure_openai";

  private get resource(): string {
    return this.baseUrl ?? "";
  }

  private get deployment(): string {
    return this.defaultModel ?? "";
  }

  protected override get endpoint(): string {
    return `${this.resource}/openai/deployments/${this.deployment}`;
  }

  protected override headers() {
    return {
      "Content-Type": "application/json",
      "api-key": this.apiKey ?? "",
    };
  }

  override async generate(options: AIGenerateOptions) {
    return super.generate(options);
  }

  override async stream(
    options: AIGenerateOptions,
    onEvent: Parameters<OpenAIProvider["stream"]>[1],
  ) {
    return super.stream(options, onEvent);
  }

  override async listModels() {
    return [];
  }
}
