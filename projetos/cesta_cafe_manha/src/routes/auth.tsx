import { useEffect, useState } from "react";
import { Link, useNavigate, createFileRoute } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, LogIn } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession, useCurrentMember } from "@/hooks/useAuthSession";
import { STATUS_LABEL } from "@/types/domain";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar | Olivelas" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useAuthSession();
  const memberQuery = useCurrentMember(user?.id);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memberQuery.data?.profile?.status === "aprovado") {
      navigate({ to: "/painel", replace: true });
    }
  }, [memberQuery.data, navigate]);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth" },
    });
    if (signInError) {
      setError("Não foi possível iniciar o login. Tente novamente.");
      setSigningIn(false);
    }
  }

  const status = memberQuery.data?.profile?.status;
  const waiting = user && (sessionLoading || memberQuery.isLoading);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="pointer-events-none fixed inset-0 aurora-field opacity-70" aria-hidden />
      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar para o início
        </Link>
        <div className="mb-8">
          <Logo />
        </div>
        <div className="glass rounded-2xl p-7 shadow-2xl sm:p-9">
          {!user ? (
            <>
              <p className="text-sm font-medium text-accent">Plataforma Olivelas</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">Entre para continuar</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Acesso protegido para organizar sua operação de cestas de café.
              </p>
              <Button
                className="mt-8 h-11 w-full gap-2 rounded-xl"
                onClick={handleGoogleSignIn}
                disabled={signingIn}
              >
                <LogIn className="size-4" /> {signingIn ? "Conectando..." : "Continuar com Google"}
              </Button>
              {error && (
                <p className="mt-4 flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  {error}
                </p>
              )}
            </>
          ) : waiting ? (
            <div className="py-8 text-center" aria-busy="true">
              <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Verificando seu acesso...</p>
            </div>
          ) : status === "aprovado" ? null : status === "rejeitado" ? (
            <StatusMessage
              icon={AlertCircle}
              title="Acesso não aprovado"
              text="Seu cadastro foi rejeitado. Fale com um administrador da conta para revisar o acesso."
            />
          ) : (
            <StatusMessage
              icon={Clock3}
              title={STATUS_LABEL.pendente}
              text="Seu cadastro foi recebido e será analisado por um administrador. Você poderá entrar assim que for aprovado."
            />
          )}
        </div>
        {user && (
          <button
            className="mx-auto mt-5 block text-xs text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => supabase.auth.signOut()}
          >
            Sair desta conta
          </button>
        )}
      </div>
    </main>
  );
}

function StatusMessage({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Clock3;
  title: string;
  text: string;
}) {
  return (
    <div className="py-4">
      <div className="grid size-11 place-items-center rounded-full bg-accent/15 text-accent">
        <Icon className="size-5" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="size-4 text-success" /> Você será avisado quando o status mudar.
      </div>
    </div>
  );
}
