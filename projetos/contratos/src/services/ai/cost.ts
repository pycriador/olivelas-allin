import type { ExtractionUsage } from "./provider";

/**
 * Estimativa de tokens e custo. Determinística e independente de provedor
 * (aproximação por caracteres), ideal para exibição em playground/custos.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const ascii = [...text].filter((ch) => ch.charCodeAt(0) < 128).length;
  const nonAscii = text.length - ascii;
  return Math.ceil(ascii / 4) + Math.ceil(nonAscii * 0.5);
}

export function estimateUsage(prompt: string, completion: string): ExtractionUsage {
  const promptTokens = estimateTokens(prompt);
  const completionTokens = estimateTokens(completion);
  return { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens };
}

export function estimateCostUsd(
  usage: ExtractionUsage,
  price: { input1M?: number; output1M?: number },
): number {
  const inputUsd = ((usage.promptTokens ?? 0) / 1_000_000) * (price.input1M ?? 0);
  const outputUsd = ((usage.completionTokens ?? 0) / 1_000_000) * (price.output1M ?? 0);
  return inputUsd + outputUsd;
}

export function formatUsd(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export interface PriceLookup {
  (modelKey: string): { input1M?: number; output1M?: number };
}
