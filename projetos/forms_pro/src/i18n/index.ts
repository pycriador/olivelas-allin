import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { ptBR } from "./locales/pt-BR";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { enterpriseEn, enterpriseEs, enterprisePtBR } from "./locales/enterprise";

export const SUPPORTED_LANGS = ["pt-BR", "en", "es"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const isBrowser = typeof window !== "undefined";

type Dict = Record<string, unknown>;

/** Deep merge so enterprise sections can extend existing namespaces (e.g. nav). */
function deepMerge(base: Dict, extra: Dict): Dict {
  const out: Dict = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const current = out[key];
    if (
      value && typeof value === "object" && !Array.isArray(value) &&
      current && typeof current === "object" && !Array.isArray(current)
    ) {
      out[key] = deepMerge(current as Dict, value as Dict);
    } else {
      out[key] = value;
    }
  }
  return out;
}

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        "pt-BR": { translation: deepMerge(ptBR as unknown as Dict, enterprisePtBR as unknown as Dict) },
        en: { translation: deepMerge(en as unknown as Dict, enterpriseEn as unknown as Dict) },
        es: { translation: deepMerge(es as unknown as Dict, enterpriseEs as unknown as Dict) },
      },
      lng: "pt-BR",
      fallbackLng: "pt-BR",
      supportedLngs: SUPPORTED_LANGS as unknown as string[],
      interpolation: { escapeValue: false },
    });
}


export const LANG_STORAGE_KEY = "iam-pro-lang";

export function detectStoredLang(): SupportedLang {
  if (!isBrowser) return "pt-BR";
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored && (SUPPORTED_LANGS as readonly string[]).includes(stored)) {
    return stored as SupportedLang;
  }
  return "pt-BR";
}

export default i18n;
