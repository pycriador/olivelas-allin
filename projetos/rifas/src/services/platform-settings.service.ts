import { supabase } from "@/integrations/supabase/client";
import { auditService } from "@/services/audit.service";
import type { PlatformSettingsInput } from "@/schemas/platform-settings.schema";
import type { PlatformSettings } from "@/types/platform-settings";

const COLUMNS =
  "id, platform_name, platform_logo, favicon, default_language, default_timezone, default_theme, primary_color, secondary_color, footer_text, privacy_policy, terms_of_service, support_email, support_phone, created_at, updated_at";

function toNullable(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const platformSettingsService = {
  async get(): Promise<PlatformSettings | null> {
    const { data, error } = await supabase
      .from("platform_settings")
      .select(COLUMNS)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as PlatformSettings) ?? null;
  },

  async update(id: string, input: PlatformSettingsInput): Promise<PlatformSettings> {
    const payload = {
      platform_name: input.platform_name.trim(),
      platform_logo: toNullable(input.platform_logo),
      favicon: toNullable(input.favicon),
      default_language: input.default_language,
      default_timezone: input.default_timezone,
      default_theme: input.default_theme,
      primary_color: toNullable(input.primary_color),
      secondary_color: toNullable(input.secondary_color),
      footer_text: toNullable(input.footer_text),
      privacy_policy: toNullable(input.privacy_policy),
      terms_of_service: toNullable(input.terms_of_service),
      support_email: toNullable(input.support_email),
      support_phone: toNullable(input.support_phone),
    };

    const { data, error } = await supabase
      .from("platform_settings")
      .update(payload as never)
      .eq("id", id)
      .select(COLUMNS)
      .single();
    if (error) throw error;

    await auditService.log({
      action: "UPDATE",
      entity: "platform_settings",
      entityId: id,
      newValue: payload,
    });

    return data as unknown as PlatformSettings;
  },
};

export function platformSettingsToForm(settings: PlatformSettings | null): PlatformSettingsInput {
  const theme = settings?.default_theme;
  return {
    platform_name: settings?.platform_name ?? "RaffleHub",
    platform_logo: settings?.platform_logo ?? "",
    favicon: settings?.favicon ?? "",
    default_language: settings?.default_language ?? "pt-BR",
    default_timezone: settings?.default_timezone ?? "America/Sao_Paulo",
    default_theme: theme === "light" || theme === "dark" ? theme : "system",
    primary_color: settings?.primary_color ?? "",
    secondary_color: settings?.secondary_color ?? "",
    footer_text: settings?.footer_text ?? "",
    privacy_policy: settings?.privacy_policy ?? "",
    terms_of_service: settings?.terms_of_service ?? "",
    support_email: settings?.support_email ?? "",
    support_phone: settings?.support_phone ?? "",
  };
}
