import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { extractAuthError } from "@/features/auth/hooks/use-login";

export function useResetPassword() {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendReset = async (email: string) => {
    setIsLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success("Instruções de recuperação enviadas para seu email");
      return true;
    } catch (e) {
      toast.error(extractAuthError(e));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendReset, isLoading, sent };
}
