import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Coffee, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar – Olivelas" },
      { name: "description", content: "Acesse o painel administrativo da Olivelas Mug Gallery." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl text-foreground">Erro ao carregar</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tente recarregar a página.</p>
        <Button className="mt-6" variant="outline" onClick={() => window.location.reload()}>
          Recarregar
        </Button>
      </div>
    </div>
  ),
  pendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/admin", replace: true });
  }, [loading, user, navigate]);

  const signInGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Não foi possível entrar. Tente novamente.");
      return;
    }
    if (result.redirected) return;
    await navigate({ to: "/admin", replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-elegant"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-xl leading-none">Olivelas</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Painel administrativo</p>
          </div>
        </div>
        <h1 className="mt-8 font-display text-3xl leading-tight">Entrar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use sua conta Google para acessar a área de gestão.
        </p>
        <Button className="mt-8 w-full" size="lg" onClick={signInGoogle} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
          Entrar com Google
        </Button>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Voltar ao catálogo
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.4 14.7 2.4 12 2.4 6.7 2.4 2.5 6.6 2.5 12S6.7 21.6 12 21.6c6.9 0 9.5-4.8 9.5-7.3 0-.5-.1-.9-.1-1.3H12z"
      />
    </svg>
  );
}
