import { useEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { LANG_STORAGE_KEY, detectStoredLang } from "@/i18n";

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // ensure html lang updates with i18n changes
    const update = () => {
      document.documentElement.lang = i18n.language;
      localStorage.setItem(LANG_STORAGE_KEY, i18n.language);
    };
    // apply the stored preference only after hydration to avoid SSR mismatch
    const stored = detectStoredLang();
    if (stored !== i18n.language) void i18n.changeLanguage(stored);
    update();
    i18n.on("languageChanged", update);
    return () => {
      i18n.off("languageChanged", update);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
