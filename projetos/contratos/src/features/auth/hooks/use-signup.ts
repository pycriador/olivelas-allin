import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { extractAuthError } from "@/features/auth/hooks/use-login";

export function useSignup() {
  const { signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const signup = async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await signUpWithEmail(email, password);
      if (data.session) {
        toast.success("Conta criada com sucesso");
        navigate({ to: "/dashboard" });
      } else {
        toast.success("Conta criada! Verifique seu email para confirmar");
        navigate({ to: "/login" });
      }
      return true;
    } catch (e) {
      toast.error(extractAuthError(e));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { signup, isLoading };
}
