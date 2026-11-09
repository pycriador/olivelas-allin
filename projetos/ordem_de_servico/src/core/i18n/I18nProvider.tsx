import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { configurationService, type Language } from "../services/configuration";
import { translations } from "./translations";

interface I18nContextValue {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt-BR");

  useEffect(() => {
    configurationService.get().then((cfg) => setLanguageState(cfg.language));
  }, []);

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    void configurationService.update({ language: l });
  }, []);

  const t = useCallback(
    (key: string) => translations[language][key] ?? translations["en"][key] ?? key,
    [language],
  );

  return <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
