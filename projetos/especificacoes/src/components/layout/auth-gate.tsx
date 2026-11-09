import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useSessionWatcher } from "@/hooks/iam";
import { AppShell } from "./app-shell";
import { AuthScreen } from "@/components/auth/auth-screen";
import { Button } from "@/components/ui/button";

/** Renders the app only for an approved, authenticated session. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, phase, locked, init, refresh } = useAuthStore();

  useEffect(() => {
    void init();
  }, [init]);

  useSessionWatcher();

  if (!ready || phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando SpecForge…
      </div>
    );
  }

  if (locked && phase === "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-sm text-muted-foreground">Sua sessão expirou.</p>
        <Button onClick={() => void refresh()}>Reconectar</Button>
      </div>
    );
  }

  if (phase !== "ready") return <AuthScreen />;

  return <AppShell>{children}</AppShell>;
}
