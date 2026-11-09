import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function useLogin() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      toast.success("Login realizado com sucesso");
      navigate({ to: "/dashboard" });
      return true;
    } catch (e) {
      const message = extractAuthError(e);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      const message = extractAuthError(e);
      toast.error(message);
      setGoogleLoading(false);
    }
  };

  return { loginWithEmail, loginWithGoogle, isLoading, googleLoading };
}

export function extractAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Erro desconhecido";
  if (message.includes("Invalid login credentials")) {
    return "Email ou senha inválidos";
  }
  if (message.includes("User already registered")) {
    return "Este email já está cadastrado";
  }
  if (message.includes("Email not confirmed")) {
    return "Confirme seu email antes de entrar";
  }
  if (message.includes("rate limit")) {
    return "Muitas tentativas. Aguarde um momento";
  }
  return message;
}
