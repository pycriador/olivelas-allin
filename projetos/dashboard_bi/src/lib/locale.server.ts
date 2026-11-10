import { getRequest } from "@tanstack/react-start/server";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, SUPPORTED_LOCALES, type Locale } from "@/i18n";

/** Reads the locale cookie from the incoming request so SSR matches the client. */
export function readLocaleFromRequest(): Locale {
  try {
    const cookie = getRequest()?.headers.get("cookie") ?? "";
    const match = cookie
      .split(";")
      .map((c) => c.trim().split("="))
      .find(([key]) => key === LOCALE_STORAGE_KEY);
    const value = match?.[1] ? decodeURIComponent(match[1]) : null;
    return SUPPORTED_LOCALES.find((l) => l === value) ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}
