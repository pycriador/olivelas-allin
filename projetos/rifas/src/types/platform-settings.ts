export interface PlatformSettings {
  id: string;
  platform_name: string | null;
  platform_logo: string | null;
  favicon: string | null;
  default_language: string | null;
  default_timezone: string | null;
  default_theme: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  footer_text: string | null;
  privacy_policy: string | null;
  terms_of_service: string | null;
  support_email: string | null;
  support_phone: string | null;
  created_at: string;
  updated_at: string;
}

export const PLATFORM_LANGUAGES = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Español" },
] as const;

export const PLATFORM_TIMEZONES = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Fortaleza",
  "UTC",
] as const;

export const PLATFORM_THEMES = [
  { value: "system", label: "Seguir sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
] as const;
