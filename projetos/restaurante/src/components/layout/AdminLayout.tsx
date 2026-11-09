import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Headphones,
  ScrollText,
  KeyRound,
  Shield,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  StopCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { iamService } from '@/services/iamService';
import type { SupportSession } from '@/types/iam';
import { cn } from '@/utils/cn';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSupport, setActiveSupport] = useState<SupportSession | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    setActiveSupport(iamService.getActiveSupportSession());
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Sessão encerrada com sucesso.');
      navigate('/');
    } catch {
      toast.error('Erro ao sair da conta.');
    }
  };

  const handleEndSupport = async () => {
    if (!activeSupport) return;
    try {
      const res = await iamService.endSupportSession(activeSupport.id, user?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Sessão de suporte encerrada com sucesso.');
        setActiveSupport(null);
      }
    } catch {
      toast.error('Falha ao encerrar suporte.');
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Usuários', href: '/admin/users', icon: Users },
    { label: 'Funcionários', href: '/admin/employees', icon: User },
    { label: 'Restaurantes', href: '/admin/restaurants', icon: Store },
    { label: 'Suporte', href: '/admin/support', icon: Headphones },
    { label: 'Auditoria', href: '/admin/audit', icon: ScrollText },
    { label: 'Sessões', href: '/admin/sessions', icon: KeyRound },
    { label: 'IAM & RBAC', href: '/admin/iam', icon: Shield },
    { label: 'Configurações', href: '/admin/settings', icon: Settings },
    { label: 'Meu Perfil', href: '/admin/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Admin Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/60 shrink-0">
        <div className="h-16 flex items-center justify-between px-6 border-b border-border/70">
          <Logo to="/admin" />
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            Admin
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
              Plataforma
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                        : 'text-foreground/80 hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-border/60">
            <Link
              to="/app"
              className="flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              <span className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span>Área do Restaurante</span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Admin Footer */}
        <div className="p-4 border-t border-border/70 bg-card/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
              👑
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.name || user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                global_admin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-accent transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-foreground hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Abrir menu lateral"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Painel Global Admin</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeSupport && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Suporte Ativo: {activeSupport.restaurant?.name || 'Restaurante'}</span>
                <button
                  type="button"
                  onClick={handleEndSupport}
                  className="ml-1 text-destructive hover:underline text-[11px] font-semibold"
                >
                  Encerrar
                </button>
              </div>
            )}

            <ThemeToggle />

            <Link
              to="/app"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/70 hover:bg-accent text-xs font-medium transition-colors"
            >
              <Store className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Restaurantes</span>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sair
            </Button>
          </div>
        </header>

        {/* Active Support Banner if open */}
        {activeSupport && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 sm:px-6 lg:px-8 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 text-amber-950 dark:text-amber-100">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>
                <strong>Sessão de Suporte em Andamento:</strong> Você iniciou suporte no restaurante{' '}
                <strong>{activeSupport.restaurant?.name || activeSupport.restaurant_id}</strong>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-7 text-xs border-amber-500/30 bg-amber-500/20 hover:bg-amber-500/30"
              >
                <Link to="/app">Ir para Contexto do Restaurante</Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndSupport}
                className="h-7 text-xs flex items-center gap-1"
              >
                <StopCircle className="h-3.5 w-3.5" />
                <span>Finalizar Suporte</span>
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex w-72 max-w-xs flex-col bg-card border-r border-border p-4 shadow-xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <Logo to="/admin" />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin'
                      ? location.pathname === '/admin'
                      : location.pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'text-foreground/80 hover:bg-accent'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-border space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Encerrar sessão
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
