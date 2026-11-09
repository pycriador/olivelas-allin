import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isGlobalAdminEmail } from '@/constants/admin';

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-xs text-muted-foreground font-medium">Verificando sessão...</p>
      </div>
    );
  }

  if (user) {
    const isGlobal = isGlobalAdminEmail(user.email);
    return <Navigate to={isGlobal ? '/admin' : '/app'} replace />;
  }

  return <Outlet />;
}
