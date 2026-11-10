import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n, { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, SUPPORTED_LOCALES, type Locale } from "@/i18n";

function normalize(value: string | null | undefined): Locale | null {
  if (!value) return null;
  return SUPPORTED_LOCALES.find((l) => l.toLowerCase() === value.toLowerCase()) ?? null;
}

/** Locale persisted as a cookie so the server renders the same language as the client. */
export function readLocaleFromDocument(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const fromCookie = document.cookie
    .split(";")
    .map((c) => c.trim().split("="))
    .find(([key]) => key === LOCALE_STORAGE_KEY)?.[1];
  return normalize(fromCookie ? decodeURIComponent(fromCookie) : null) ?? DEFAULT_LOCALE;
}

export function setLocale(locale: Locale) {
  if (typeof document !== "undefined") {
    document.cookie = `${LOCALE_STORAGE_KEY}=${encodeURIComponent(locale)};path=/;max-age=31536000;samesite=lax`;
    document.documentElement.lang = locale;
  }
  void i18n.changeLanguage(locale);
}

/** Applies the locale resolved by the root loader synchronously, before children render. */
export function applyLocale(locale: Locale) {
  if (i18n.language !== locale) void i18n.changeLanguage(locale);
}

export function useLocale() {
  const { i18n: instance } = useTranslation();
  return {
    locale: normalize(instance.language) ?? DEFAULT_LOCALE,
    setLocale,
  };
}

/** Keeps <html lang> in sync with the active locale. */
export function useLocaleEffect(locale: Locale) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
}
