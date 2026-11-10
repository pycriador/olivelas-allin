import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Link2, Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().trim().email("Informe um email válido").max(255),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres").max(72),
  displayName: z.string().trim().max(60).optional(),
});

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.96 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) navigate("/app", { replace: true });
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      toast({ title: "Dados inválidos", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { display_name: parsed.data.displayName || parsed.data.email.split("@")[0] },
          },
        });
        if (error) throw error;
        setSentEmail(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast({ title: "Bem-vindo de volta!" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast({
        title: mode === "signup" ? "Erro ao criar conta" : "Erro ao entrar",
        description:
          message.includes("Invalid login credentials")
            ? "Email ou senha incorretos."
            : message.includes("already registered")
            ? "Este email já está cadastrado. Faça login."
            : message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setGoogleLoading(false);
      toast({ title: "Erro no login com Google", description: result.error.message, variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent_70%)]" />

      <header className="relative z-10 max-w-5xl w-full mx-auto px-4 py-5">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o site
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center glow-primary mb-4">
              <Link2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {mode === "login" ? "Entrar no LinkPromo" : "Criar sua conta"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login"
                ? "Acesse seu painel de ofertas e templates."
                : "Comece a gerar mensagens promocionais em segundos."}
            </p>
          </div>

          <div className="gradient-card rounded-2xl border border-border p-6 shadow-[var(--shadow-card)]">
            {sentEmail ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <div>
                  <h2 className="font-semibold text-foreground">Confirme seu email</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enviamos um link de confirmação para <span className="text-foreground font-medium">{email}</span>.
                    Clique nele para ativar sua conta.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSentEmail(false);
                    setMode("login");
                  }}
                >
                  Voltar ao login
                </Button>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="w-full h-12 bg-secondary/40 border-border hover:bg-secondary font-medium"
                >
                  {googleLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <span className="mr-2"><GoogleIcon /></span>}
                  Continuar com Google
                </Button>

                <div className="flex items-center gap-3 my-5">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">ou</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Nome</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Como podemos te chamar?"
                        className="h-11 bg-secondary/50 border-border"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@email.com"
                      className="h-11 bg-secondary/50 border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 bg-secondary/50 border-border"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 gradient-primary text-primary-foreground font-semibold glow-primary"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        {mode === "login" ? "Entrar" : "Criar conta grátis"}
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>

          {!sentEmail && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary font-medium hover:underline"
              >
                {mode === "login" ? "Criar conta" : "Fazer login"}
              </button>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
