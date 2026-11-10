/**
 * AI Provider abstraction.
 *
 * Currently backed by the Lovable AI Gateway (no API key required). The
 * factory is written so we can add Gemini/OpenAI/Anthropic/Azure/Ollama
 * providers later without touching call sites in the chat routes.
 */
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export type AiProviderId = "lovable";

export const DEFAULT_MODEL = "google/gemini-2.5-flash";

export const SUPPORTED_MODELS = [
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (rápido)" },
  { id: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (mais rápido)" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (avançado)" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  { id: "openai/gpt-5", label: "GPT-5 (top)" },
] as const;

export function getModel(modelId: string, initialRunId?: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LOVABLE_API_KEY não configurada. Ative o Lovable AI Gateway nas configurações.",
    );
  }
  const gateway = createLovableAiGatewayProvider(apiKey, initialRunId);
  return gateway(modelId);
}