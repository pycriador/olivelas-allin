import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Informe seu email").email("Email inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export const signupSchema = z
  .object({
    fullName: z.string().min(2, "Informe seu nome completo"),
    email: z.string().min(1, "Informe seu email").email("Email inválido"),
    password: z.string().min(8, "A senha deve ter ao menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: "Você precisa aceitar os termos de uso",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z.object({
  email: z.string().min(1, "Informe seu email").email("Email inválido"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
