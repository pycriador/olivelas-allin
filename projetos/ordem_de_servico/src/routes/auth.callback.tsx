import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

const STORAGE_KEY = "sb-dadtomgctmkslwmsdxff-auth-token";

function AuthCallbackPage() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    (async () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) {
        window.location.href = "/login?error=no_hash";
        return;
      }

      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken || !refreshToken) {
        window.location.href = "/login?error=missing_tokens";
        return;
      }

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }

      try {
        const { supabase } = await import("@/lib/supabase");
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        window.location.href = error ? `/login?error=${encodeURIComponent(error.message)}` : "/dashboard";
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "unknown";
        window.location.href = `/login?error=${encodeURIComponent(msg)}`;
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Autenticando...</p>
    </div>
  );
}
