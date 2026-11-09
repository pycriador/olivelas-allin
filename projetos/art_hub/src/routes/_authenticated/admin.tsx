import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/layout/admin-shell";
import { useIsAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminGate,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-elegant">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-destructive" />
        <h1 className="font-display text-2xl">Erro no painel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro ao carregar o painel administrativo.
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          {error?.message ?? "Tente recarregar a página."}
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Recarregar
        </Button>
      </div>
    </div>
  ),
});

function AdminGate() {
  const { isAdmin, loading, user } = useIsAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-elegant">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl">Sem acesso</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta ({user?.email}) não tem permissão para o painel administrativo.
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={async () => {
              await qc.cancelQueries();
              qc.clear();
              await supabase.auth.signOut();
              await navigate({ to: "/auth", replace: true });
            }}
          >
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
