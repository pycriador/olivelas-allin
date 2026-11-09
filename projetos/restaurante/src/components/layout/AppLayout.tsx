import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  LayoutGrid,
  FolderTree,
  ShoppingBag,
  BarChart3,
  Loader2,
  Lock,
  ShieldCheck,
  Plus,
  ChevronDown,
  ChevronRight,
  MapPin,
  Headphones,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { RestaurantSwitcher } from './RestaurantSwitcher';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { cn } from '@/utils/cn';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentRestaurant, restaurants, isLoading, userRole, isGlobalAdmin } = useRestaurant();

  // Clean logout handler
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Sessão encerrada com sucesso.');
      navigate('/');
    } catch {
      toast.error('Erro ao sair da conta.');
    }
  };

  // Mobile accordion group state (from ui-mobile.md)
  const getInitialGroup = () => {
    if (location.pathname.startsWith('/app/menu')) return 'menu';
    if (
      location.pathname.startsWith('/app/tables') ||
      location.pathname.startsWith('/app/orders') ||
      location.pathname.startsWith('/app/kds') ||
      location.pathname.startsWith('/app/cashier')
    )
      return 'operations';
    if (location.pathname.startsWith('/app/reports')) return 'intelligence';
    return 'admin';
  };

  const [mobileExpandedGroup, setMobileExpandedGroup] = useState<string | null>(getInitialGroup);

  // Close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Primary active navigation for restaurant operations
  const mainNav = [
    { label: 'Visão geral', href: '/app', icon: LayoutDashboard },
    { label: 'Restaurante', href: '/app/restaurant', icon: Store },
    { label: 'Equipe', href: '/app/team', icon: Users },
    { label: 'Configurações', href: '/app/settings', icon: Settings },
  ];

  // User-only navigation when no restaurant is active yet
  const userAccountNav = [
    { label: 'Visão Geral da Conta', href: '/app', icon: LayoutDashboard },
    { label: 'Criar Restaurante', href: '/app/setup/restaurant', icon: Store },
    { label: 'Configurações da Conta', href: '/app/settings', icon: Settings },
  ];

  // Cardápio Active Navigation (Fase 03)
  const menuNav = [
    { label: 'Visão Geral', href: '/app/menu', icon: LayoutDashboard },
    { label: 'Categorias', href: '/app/menu/categories', icon: FolderTree },
    { label: 'Produtos', href: '/app/menu/products', icon: ShoppingBag },
    { label: 'Adicionais', href: '/app/menu/add-ons', icon: LayoutGrid },
  ];

  // Operational Active Navigation
  const operationsNav = [
    { label: 'Mesas & Salão', href: '/app/tables', icon: LayoutGrid },
    { label: 'Setores & Áreas', href: '/app/tables/areas', icon: MapPin },
    { label: 'Pedidos', href: '/app/orders', icon: UtensilsCrossed },
    { label: 'Cozinha (KDS)', href: '/app/kds', icon: ChefHat },
    { label: 'Caixa & PDV', href: '/app/cashier', icon: Receipt },
  ];

  // Intelligence & Reports Navigation
  const intelligenceNav = [
    { label: 'Relatórios & Métricas', href: '/app/reports', icon: BarChart3 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-xs text-muted-foreground font-medium">Carregando dados da sua conta...</p>
      </div>
    );
  }

  const hasRestaurant = Boolean(currentRestaurant || restaurants.length > 0);

  return (
    <div className="h-dvh max-h-dvh overflow-hidden flex bg-background text-foreground">
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/40 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border/70">
          <Logo to="/app" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {!hasRestaurant ? (
            /* User Account Navigation (No Restaurant Yet) */
            <div className="space-y-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                  Minha Conta
                </div>
                <nav className="space-y-1">
                  {userAccountNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-xs'
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

              <div className="p-3.5 rounded-lg border border-border/80 bg-muted/30 text-xs space-y-2">
                <p className="font-semibold text-foreground">Novo restaurante?</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Cadastre sua unidade ou aguarde um convite enviado por um administrador para o seu e-mail.
                </p>
                <Button asChild size="sm" className="w-full h-7 text-xs mt-1">
                  <Link to="/app/setup/restaurant">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Criar Restaurante
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            /* Standard Restaurant Navigation */
            <>
              {/* Active Navigation */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                  Administração
                </div>
                <nav className="space-y-1">
                  {mainNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-xs'
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

              {/* Cardápio Section (Active - Fase 03) */}
              <div>
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Cardápio
                  </span>
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Ativo
                  </span>
                </div>
                <nav className="space-y-1">
                  {menuNav.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === '/app/menu'
                        ? location.pathname === '/app/menu'
                        : location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-xs'
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

              {/* Operação Section (Active) */}
              <div>
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Operação
                  </span>
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Ativo
                  </span>
                </div>
                <nav className="space-y-1">
                  {operationsNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-xs'
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

              {/* Inteligência & Relatórios (Active) */}
              <div>
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Inteligência
                  </span>
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Ativo
                  </span>
                </div>
                <nav className="space-y-1">
                  {intelligenceNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-xs'
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

              {/* Gestão Global SaaS Section (For Global Admin) */}
              {isGlobalAdmin && (
                <div className="pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between px-3 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Gestão Global SaaS
                    </span>
                    <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
                      Admin
                    </span>
                  </div>
                  <nav className="space-y-1">
                    <Link
                      to="/admin"
                      className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <LayoutDashboard className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>Painel Global Admin</span>
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-amber-600/70" />
                    </Link>
                    <Link
                      to="/admin/restaurants"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>Todos os Restaurantes</span>
                    </Link>
                    <Link
                      to="/admin/users"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>Gestão de Usuários</span>
                    </Link>
                    <Link
                      to="/admin/support"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <Headphones className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>Suporte &amp; Auditoria</span>
                    </Link>
                  </nav>
                </div>
              )}

              {/* Unidades & Alternância de Restaurantes */}
              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Restaurantes
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {restaurants.length} {restaurants.length === 1 ? 'unidade' : 'unidades'}
                  </span>
                </div>
                <nav className="space-y-1">
                  <Link
                    to="/app/select-restaurant"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>Ver Todas as Unidades</span>
                  </Link>
                  <Link
                    to="/app/setup/restaurant"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>Criar Novo Restaurante</span>
                  </Link>
                </nav>
              </div>
            </>
          )}
        </div>

        {/* User Role & Profile bar */}
        <div className="p-4 border-t border-border/70 flex items-center justify-between">
          <Link
            to="/app/profile"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.name?.slice(0, 2) || user?.email?.slice(0, 2) || 'OP'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.name || user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono capitalize truncate">
                {isGlobalAdmin ? '👑 Global Admin' : (userRole ? userRole.replace('_', ' ') : 'Usuário')}
              </p>
            </div>
          </Link>

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

            {currentRestaurant ? (
              <RestaurantSwitcher />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border/60">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  Sem restaurante ativo
                </span>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <Link to="/app/setup/restaurant">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Criar Restaurante
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isGlobalAdmin && (
              <Button
                asChild
                size="sm"
                className="h-8 text-xs bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold shadow-xs gap-1.5 border-0"
              >
                <Link to="/admin">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Painel</span> Global Admin
                </Link>
              </Button>
            )}

            <ThemeToggle />

            <Link
              to="/app/profile"
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border/60 hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground"
            >
              <User className="h-3.5 w-3.5" />
              <span className="truncate max-w-[120px]">
                {user?.name || user?.email?.split('@')[0]}
              </span>
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

        {/* Global Admin Support Banner */}
        {isGlobalAdmin && currentRestaurant && (
          <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 sm:px-6 lg:px-8 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              <span className="inline-flex items-center justify-center p-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span>
                <strong>Modo Suporte (Global Admin):</strong> Visualizando com permissões irrestritas o restaurante <u>{currentRestaurant.name}</u>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-mono hidden md:inline">
                {restaurants.length} {restaurants.length === 1 ? 'restaurante' : 'restaurantes'} cadastrados
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/select-restaurant')}
                className="h-7 text-xs border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200"
              >
                Trocar Restaurante
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/admin')}
                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 shadow-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Painel Geral SaaS
              </Button>
            </div>
          </div>
        )}

        {/* Mobile / Tablet Drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex w-72 max-w-xs flex-col bg-card border-r border-border p-4 shadow-xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <Logo to="/app" />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-4 overflow-y-auto">
                {!hasRestaurant ? (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1.5">
                      Minha Conta
                    </div>
                    <div className="space-y-1">
                      {userAccountNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-foreground hover:bg-accent'
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Accordion 1: Administração */}
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setMobileExpandedGroup(mobileExpandedGroup === 'admin' ? null : 'admin')
                        }
                        className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-muted/40 transition-colors"
                        aria-expanded={mobileExpandedGroup === 'admin'}
                      >
                        <span>Administração</span>
                        {mobileExpandedGroup === 'admin' ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                        )}
                      </button>
                      {mobileExpandedGroup === 'admin' && (
                        <div className="space-y-1 mt-1 pl-1">
                          {mainNav.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;
                            return (
                              <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors min-h-[44px]',
                                  isActive
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'text-foreground hover:bg-accent'
                                )}
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Accordion 2: Cardápio */}
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setMobileExpandedGroup(mobileExpandedGroup === 'menu' ? null : 'menu')
                        }
                        className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-muted/40 transition-colors"
                        aria-expanded={mobileExpandedGroup === 'menu'}
                      >
                        <div className="flex items-center gap-2">
                          <span>Cardápio</span>
                          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Ativo
                          </span>
                        </div>
                        {mobileExpandedGroup === 'menu' ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                        )}
                      </button>
                      {mobileExpandedGroup === 'menu' && (
                        <div className="space-y-1 mt-1 pl-1">
                          {menuNav.map((item) => {
                            const Icon = item.icon;
                            const isActive =
                              item.href === '/app/menu'
                                ? location.pathname === '/app/menu'
                                : location.pathname.startsWith(item.href);
                            return (
                              <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors min-h-[44px]',
                                  isActive
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'text-foreground hover:bg-accent'
                                )}
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Accordion 3: Operação */}
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setMobileExpandedGroup(
                            mobileExpandedGroup === 'operations' ? null : 'operations'
                          )
                        }
                        className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-muted/40 transition-colors"
                        aria-expanded={mobileExpandedGroup === 'operations'}
                      >
                        <div className="flex items-center gap-2">
                          <span>Operação</span>
                          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Ativo
                          </span>
                        </div>
                        {mobileExpandedGroup === 'operations' ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                        )}
                      </button>
                      {mobileExpandedGroup === 'operations' && (
                        <div className="space-y-1 mt-1 pl-1">
                          {operationsNav.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname.startsWith(item.href);
                            return (
                              <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors min-h-[44px]',
                                  isActive
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'text-foreground hover:bg-accent'
                                )}
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Accordion 4: Inteligência */}
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setMobileExpandedGroup(
                            mobileExpandedGroup === 'intelligence' ? null : 'intelligence'
                          )
                        }
                        className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-muted/40 transition-colors"
                        aria-expanded={mobileExpandedGroup === 'intelligence'}
                      >
                        <div className="flex items-center gap-2">
                          <span>Inteligência</span>
                          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Ativo
                          </span>
                        </div>
                        {mobileExpandedGroup === 'intelligence' ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                        )}
                      </button>
                      {mobileExpandedGroup === 'intelligence' && (
                        <div className="space-y-1 mt-1 pl-1">
                          {intelligenceNav.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname.startsWith(item.href);
                            return (
                              <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors min-h-[44px]',
                                  isActive
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'text-foreground hover:bg-accent'
                                )}
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Mobile: Gestão Global SaaS (For Global Admin) */}
                    {isGlobalAdmin && (
                      <div className="pt-2 border-t border-border/60">
                        <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Painel Global Admin
                          </span>
                          <span className="text-[9px] font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
                            SaaS
                          </span>
                        </div>
                        <div className="space-y-1 mt-1 pl-1">
                          <Link
                            to="/admin"
                            onClick={() => setSidebarOpen(false)}
                            className="flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 min-h-[44px]"
                          >
                            <span className="flex items-center gap-2.5">
                              <LayoutDashboard className="h-4 w-4 shrink-0 text-amber-600" />
                              <span>Painel Geral da Plataforma</span>
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 text-amber-600" />
                          </Link>
                          <Link
                            to="/admin/restaurants"
                            onClick={() => setSidebarOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium text-foreground hover:bg-accent min-h-[44px]"
                          >
                            <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span>Todos os Restaurantes</span>
                          </Link>
                          <Link
                            to="/admin/users"
                            onClick={() => setSidebarOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium text-foreground hover:bg-accent min-h-[44px]"
                          >
                            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span>Gestão de Usuários</span>
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Mobile: Unidades & Alternância */}
                    <div className="pt-2 border-t border-border/60">
                      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>Restaurantes</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{restaurants.length}</span>
                      </div>
                      <div className="space-y-1 mt-1 pl-1">
                        <Link
                          to="/app/select-restaurant"
                          onClick={() => setSidebarOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium text-foreground hover:bg-accent min-h-[44px]"
                        >
                          <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>Alternar / Ver Unidades</span>
                        </Link>
                        <Link
                          to="/app/setup/restaurant"
                          onClick={() => setSidebarOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium text-foreground hover:bg-accent min-h-[44px]"
                        >
                          <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>Criar Novo Restaurante</span>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </nav>

              {/* Mobile Drawer Bottom Utilities */}
              <div className="pt-3 border-t border-border space-y-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <Link
                    to="/app/profile"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-md border border-border/60 hover:bg-accent text-foreground transition-colors min-h-[44px]"
                  >
                    <User className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate font-medium">Perfil</span>
                  </Link>
                  <Link
                    to="/app/settings"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-md border border-border/60 hover:bg-accent text-foreground transition-colors min-h-[44px]"
                  >
                    <Settings className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate font-medium">Ajustes</span>
                  </Link>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-11 text-muted-foreground hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Encerrar sessão
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto min-w-0 p-4 sm:p-6 lg:p-8 overscroll-contain max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
