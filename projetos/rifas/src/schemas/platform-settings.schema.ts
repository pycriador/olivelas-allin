import { z } from "zod";

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const optionalText = (max: number, message?: string) =>
  z
    .string()
    .trim()
    .max(max, message ?? `Máximo de ${max} caracteres`)
    .optional()
    .or(z.literal(""));

const optionalColor = z
  .string()
  .trim()
  .regex(HEX_COLOR, "Use uma cor hexadecimal (ex.: #1A1A1A)")
  .optional()
  .or(z.literal(""));

export const platformSettingsSchema = z.object({
  platform_name: z
    .string()
    .trim()
    .min(2, "Informe o nome da plataforma")
    .max(80, "Máximo de 80 caracteres"),
  platform_logo: optionalText(500),
  favicon: optionalText(500),
  default_language: z.string().trim().min(2, "Selecione o idioma"),
  default_timezone: z.string().trim().min(2, "Selecione o fuso horário"),
  default_theme: z.enum(["system", "light", "dark"], { message: "Selecione o tema padrão" }),
  primary_color: optionalColor,
  secondary_color: optionalColor,
  footer_text: optionalText(300),
  privacy_policy: optionalText(20_000),
  terms_of_service: optionalText(20_000),
  support_email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
  support_phone: optionalText(30),
});

export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;
