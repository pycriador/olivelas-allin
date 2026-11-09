import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — RaffleHub SaaS" },
      { name: "description", content: "Acesse sua conta RaffleHub para gerenciar campanhas e organizações." },
      { property: "og:title", content: "Entrar — RaffleHub SaaS" },
      { property: "og:description", content: "Acesse sua conta RaffleHub para gerenciar campanhas e organizações." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void navigate({ to: "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function signIn() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Não foi possível entrar com o Google. Tente novamente.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">Entrar no RaffleHub</CardTitle>
          <CardDescription>
            Plataforma multiempresa para gestão de campanhas. Use sua conta Google para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" size="lg" onClick={() => void signIn()} disabled={loading}>
            {loading ? "Redirecionando…" : "Continuar com Google"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Ao continuar você concorda com os termos de uso da plataforma.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
