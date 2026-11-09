import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Clock, Ban, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth.store";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

/** Google-only sign in, plus the waiting-for-approval and blocked states. */
export function AuthScreen() {
  const { phase, error, signIn, logout, profile } = useAuthStore();
  const [busy, setBusy] = useState(false);

  if (phase === "pending") {
    return (
      <Shell>
        <Card>
          <CardHeader className="items-center text-center">
            <Clock className="mb-2 h-8 w-8 text-primary" />
            <CardTitle>Aguardando aprovação do administrador</CardTitle>
            <CardDescription>
              Sua solicitação de acesso foi registrada para {profile?.email}. Você poderá entrar assim que
              um Global Admin aprovar a conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => void logout()}>
              Sair
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (phase === "suspended") {
    return (
      <Shell>
        <Card>
          <CardHeader className="items-center text-center">
            <Ban className="mb-2 h-8 w-8 text-destructive" />
            <CardTitle>Acesso bloqueado</CardTitle>
            <CardDescription>Esta conta está suspensa. Fale com um administrador.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => void logout()}>
              Sair
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (phase === "error") {
    return (
      <Shell>
        <Card>
          <CardHeader className="items-center text-center">
            <WifiOff className="mb-2 h-8 w-8 text-destructive" />
            <CardTitle>Falha de conexão</CardTitle>
            <CardDescription>{error ?? "Não foi possível falar com o servidor."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => void useAuthStore.getState().refresh()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card>
        <CardHeader className="items-center text-center">
          <ShieldCheck className="mb-2 h-8 w-8 text-primary" />
          <CardTitle>SpecForge</CardTitle>
          <CardDescription>Spec-Driven Engineering Platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full gap-2"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await signIn();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Não foi possível entrar");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
            Entrar com Google
          </Button>
          {error ? <p className="text-center text-xs text-destructive">{error}</p> : null}
          <p className="text-center text-xs text-muted-foreground">
            O primeiro acesso configura automaticamente o Global Admin e o workspace inicial.
          </p>
        </CardContent>
      </Card>
    </Shell>
  );
}
