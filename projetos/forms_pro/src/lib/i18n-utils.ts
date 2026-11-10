import { ptBR } from "@/i18n/locales/pt-BR";

/**
 * Safely reads an object/array value from the translations.
 * Falls back to the pt-BR bundle when the detector is not ready (SSR).
 */
export function tObject<T>(value: unknown, key: string): T {
  if (value && typeof value === "object") return value as T;
  const parts = key.split(".");
  let cur: unknown = ptBR;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return [] as unknown as T;
    }
  }
  return cur as T;
}
