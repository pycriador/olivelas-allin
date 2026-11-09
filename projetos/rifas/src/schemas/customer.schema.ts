import { z } from "zod";

export const customerFormSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Informe o nome do cliente")
    .max(120, "Máximo de 120 caracteres"),
  phone: z
    .string()
    .trim()
    .min(8, "Informe um telefone válido (com DDD)")
    .max(30, "Máximo de 30 caracteres"),
  email: z.string().trim().email("E-mail inválido").max(120).optional().or(z.literal("")),
  city: z.string().trim().max(80, "Máximo de 80 caracteres").optional().or(z.literal("")),
  notes: z.string().trim().max(2000, "Máximo de 2.000 caracteres").optional().or(z.literal("")),
});

export type CustomerFormInput = z.infer<typeof customerFormSchema>;
