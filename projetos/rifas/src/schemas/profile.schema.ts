import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe ao menos 2 caracteres")
    .max(80, "Máximo de 80 caracteres"),
  avatar_url: z.string().trim().url("Informe uma URL válida").max(500).or(z.literal("")).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
