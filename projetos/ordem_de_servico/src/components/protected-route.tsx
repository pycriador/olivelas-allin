import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Wrench } from "lucide-react";

export function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Wrench className="h-7 w-7 text-primary" />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, companiesLoading, companies, currentCompany } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({
        to: "/login",
        search: { redirect: window.location.pathname + window.location.search },
      });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || loading || companiesLoading) return;
    if (!currentCompany && companies.length === 0) {
      navigate({
        to: "/select-company",
        search: { redirect: window.location.pathname + window.location.search },
      });
    }
  }, [user, loading, companiesLoading, companies.length, currentCompany, navigate]);

  if (loading || !user || companiesLoading || (!currentCompany && companies.length === 0)) return <SplashScreen />;

  return <>{children}</>;
}
