import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { SplashScreen } from "@/components/protected-route";
import { useAuth } from "@/hooks/useAuth";
import { userRolesService } from "@/services/user-roles.service";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/admin")({
  component: AdminRoute,
});

function AdminRoute() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data: isAdmin, isPending } = useQuery({
    queryKey: ["auth", "is-admin", user?.id],
    queryFn: () => userRolesService.isAdmin(),
    enabled: !!user,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/admin" } });
  }, [loading, user, navigate]);

  if (loading || !user || isPending) return <SplashScreen />;

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Você não possui permissão de administrador para acessar esta área.
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/dashboard" })}>Voltar ao painel</Button>
      </div>
    );
  }

  return <Outlet />;
}
