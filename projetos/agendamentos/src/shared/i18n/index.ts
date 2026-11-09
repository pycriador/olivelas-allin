import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import ptBR from "./locales/pt-BR.json";
import en from "./locales/en.json";
import es from "./locales/es.json";

export const SUPPORTED_LOCALES = ["pt-BR", "en", "es"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        "pt-BR": { translation: ptBR },
        en: { translation: en },
        es: { translation: es },
      },
      fallbackLng: "pt-BR",
      supportedLngs: SUPPORTED_LOCALES as unknown as string[],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "clinicflow.locale",
      },
    });
}

export default i18n;
