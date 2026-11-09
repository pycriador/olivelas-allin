import { Navigate, Outlet } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';

export function AdminRoute() {
  const { user, loading: authLoading } = useAuth();
  const { isGlobalAdmin, isLoading: restaurantLoading } = useRestaurant();

  if (authLoading || restaurantLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-xs text-muted-foreground font-medium">Validando permissões de administrador global...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isGlobalAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Esta área é exclusiva para administradores globais da plataforma Olivelas Restaurant. Sua conta ({user.email}) não possui o papel <code>global_admin</code>.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <a href="/app">Ir para Meu Restaurante</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Página Inicial</a>
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
