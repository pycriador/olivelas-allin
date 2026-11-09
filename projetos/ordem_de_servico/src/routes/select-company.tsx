import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { Building2, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Search { redirect?: string }

export const Route = createFileRoute("/select-company")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: SelectCompanyPage,
});

function SelectCompanyPage() {
  const { user, loading, companies, companiesLoading, currentCompany, switchCompany, logout } = useAuth();
  const { redirect } = useSearch({ from: "/select-company" });
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (currentCompany) navigate({ to: redirect || "/dashboard" });
  }, [currentCompany, redirect, navigate]);

  const busy = loading || companiesLoading;

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecionar empresa</CardTitle>
          <CardDescription>
            {companies.length === 0
              ? "Sua conta ainda não está vinculada a nenhuma empresa."
              : "Escolha a empresa que deseja acessar."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {busy ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : companies.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Peça a um administrador para vincular seu usuário ({user?.email}) a uma empresa.
              </p>
              <Button variant="outline" className="w-full" onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {companies.map((c, idx) => (
                  <li key={`${c.id}-${idx}`}>
                    <button
                      type="button"
                      onClick={() => switchCompany(c.id)}
                      className="flex w-full items-center gap-3 rounded-md border p-3 text-left transition hover:bg-accent"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt={c.name} className="h-10 w-10 rounded-md object-cover" />
                        ) : (
                          <Building2 className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{c.role.replace("_", " ")}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <Button variant="ghost" className="w-full" onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
