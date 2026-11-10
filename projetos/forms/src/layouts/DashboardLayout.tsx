import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  BarChart3,
  Users,
  Shield,
  Key,
  Layers,
  FileSpreadsheet,
  History,
  Home,
  LogOut,
  Menu,
  X,
  Palette,
  Globe,
  ChevronDown,
  Sparkles,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ShieldCheck,
  Building2,
  Sun,
  Moon,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../stores/authStore';
import { useI18n } from '../i18n';
import { THEMES_LIST, getThemeById } from '../utils/themes';
import { Toaster } from 'sonner';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, switchUser, logout, isAdmin } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  // Collapsible state (stored in localStorage)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('olivelas_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('olivelas_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [themeSearch, setThemeSearch] = useState('');
  const [themeModeFilter, setThemeModeFilter] = useState<'all' | 'light' | 'dark'>('all');

  const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
    return localStorage.getItem('olivelas_active_theme') || 'olivelas-signature';
  });

  const activeTheme = getThemeById(currentThemeId);

  // Synchronize light / dark mode on document element
  useEffect(() => {
    const theme = getThemeById(currentThemeId);
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentThemeId]);

  const handleThemeChange = (id: string) => {
    setCurrentThemeId(id);
    localStorage.setItem('olivelas_active_theme', id);
    setThemeDropdownOpen(false);
  };

  const toggleLightDark = () => {
    if (activeTheme.mode === 'dark') {
      handleThemeChange('olivelas-signature');
    } else {
      handleThemeChange('obsidian-black');
    }
  };

  const primaryNavItems = [
    { label: t('nav.dashboard'), icon: Home, path: '/app' },
    { label: t('nav.forms'), icon: FileText, path: '/app/forms' },
    { label: t('nav.dashboards'), icon: BarChart3, path: '/app/dashboards' },
  ];

  const adminNavItems = isAdmin
    ? [
        { label: t('nav.users'), icon: Users, path: '/app/users' },
        { label: t('nav.groups'), icon: Shield, path: '/app/groups' },
        { label: t('nav.api_tokens'), icon: Key, path: '/app/tokens' },
        { label: t('nav.audit'), icon: History, path: '/app/audit' },
      ]
    : [];

  const integrationNavItems: any[] = [];

  // Rotas para validação do usuário (aguardando aprovação para deleção)
  const toValidateNavItems = [
    { label: 'Painel de Validação', icon: HelpCircle, path: '/app/validate', note: 'Central de rotas para revisão' },
    { label: 'Google Global (/app/integrations)', icon: FileSpreadsheet, path: '/app/integrations', note: 'Global legado' },
    { label: 'Novo Token (/app/tokens/new)', icon: Key, path: '/app/tokens/new', note: 'Criador isolado' },
    { label: 'Google Alias (/app/integrations/groups)', icon: Building2, path: '/app/integrations/groups/bcab9a01-2ce8-47b7-a406-817e74891ce4', note: 'Rota duplicada' },
  ];

  const demoUsers = [
    { email: 'willian.o.jesus@gmail.com', name: 'Willian Jesus', role: 'admin', tag: 'Supabase Admin' },
    { email: 'py.criador@gmail.com', name: 'Py Criador', role: 'creator', tag: 'Supabase Criador' },
    { email: 'admin@olivelas.com', name: 'Administrador Global', role: 'admin', tag: 'Demo' },
    { email: 'creator@olivelas.com', name: 'Carlos Criador', role: 'creator', tag: 'Demo' },
    { email: 'editor@olivelas.com', name: 'Juliana Editora', role: 'creator', tag: 'Demo' },
    { email: 'viewer@olivelas.com', name: 'Vinicius Visualizador', role: 'viewer', tag: 'Demo' },
  ];

  // Helper for rendering nav item
  const renderNavItem = (item: { label: string; icon: any; path: string }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));

    return (
      <div key={item.path} className="relative group">
        <Link
          to={item.path}
          className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            collapsed ? 'justify-center px-0' : ''
          } ${
            isActive
              ? 'text-white shadow-md shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover/80'
          }`}
          style={isActive ? { backgroundColor: activeTheme.primary } : {}}
        >
          <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>

        {/* Floating Tooltip when Collapsed */}
        {collapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center z-50 pointer-events-none">
            <div className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
              {item.label}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-screen max-h-screen w-screen bg-gradient-to-br ${activeTheme.bgGradient} flex overflow-hidden font-sans transition-colors duration-200 selection:bg-primary/20 selection:text-primary`}>
      <Toaster position="top-right" richColors />

      {/* ======================================================== */}
      {/* 1. SIDEBAR (Inteiro na página, colado na lateral, retrátil) */}
      {/* ======================================================== */}
      <aside
        className={`hidden lg:flex flex-col h-screen border-r border-border bg-surface shrink-0 transition-all duration-300 ease-in-out z-30 select-none justify-between ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Top: Brand Header & Collapse Toggle Button */}
        <div>
          <div className={`h-16 border-b border-border/80 flex items-center px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <Link to="/app" className="flex items-center gap-2.5 group overflow-hidden">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 transition-transform group-hover:scale-105"
                style={{ backgroundColor: activeTheme.primary }}
              >
                <Layers className="w-5 h-5" />
              </div>

              {!collapsed && (
                <div className="flex flex-col min-w-0 transition-opacity duration-200">
                  <span className="font-extrabold text-sm tracking-tight leading-tight flex items-center gap-1 text-foreground truncate">
                    Olivelas <span style={{ color: activeTheme.primary }}>IAM</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium truncate">
                    Enterprise Forms
                  </span>
                </div>
              )}
            </Link>

            {!collapsed && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                title="Recolher menu lateral"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Create Form Action Button */}
          <div className="p-3 border-b border-border/60">
            {collapsed ? (
              <div className="relative group flex justify-center">
                <Link
                  to="/app/forms/new"
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/25 hover:scale-105 transition-all"
                  style={{ backgroundColor: activeTheme.primary }}
                  title={t('nav.create_form')}
                >
                  <Plus className="w-5 h-5" />
                </Link>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center z-50 pointer-events-none">
                  <div className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-800">
                    {t('nav.create_form')}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/app/forms/new"
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md shadow-primary/25 hover:opacity-95 hover:scale-[1.01] transition-all"
                style={{ backgroundColor: activeTheme.primary }}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{t('nav.create_form')}</span>
              </Link>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
            {/* Main Section */}
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Navegação
                </p>
              )}
              {primaryNavItems.map(renderNavItem)}
            </div>

            {/* Admin & Governance Section */}
            {adminNavItems.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-border/50">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Governança & IAM
                  </p>
                )}
                {adminNavItems.map(renderNavItem)}
              </div>
            )}

            {/* Validar Section (Rotas em análise para exclusão) */}
            <div className="space-y-1 pt-2 border-t border-border/50">
              {!collapsed && (
                <div className="flex items-center justify-between px-3 mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <HelpCircle className="w-3 h-3" /> Validar
                  </p>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
                    {toValidateNavItems.length}
                  </span>
                </div>
              )}
              {toValidateNavItems.map(renderNavItem)}
            </div>
          </nav>
        </div>

        {/* Bottom Section: User Profile & Collapse Toggle */}
        <div className="p-3 border-t border-border/80 bg-surface/40 space-y-2">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              {/* User Avatar Compact */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer hover:scale-105 transition-all"
                style={{ backgroundColor: activeTheme.primary }}
                title={`${user.full_name} (${user.role})`}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>

              {/* Expand Button */}
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                title="Expandir menu lateral"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* User Profile Card */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface border border-border/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: activeTheme.primary }}
                  >
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{user.full_name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{user.role.toUpperCase()}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title="Sair do sistema"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Quick Collapse Toggle */}
              <button
                onClick={toggleSidebar}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
                <span>Recolher Barra Lateral</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MOBILE NAVIGATION DRAWER                              */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-surface p-5 shadow-2xl flex flex-col justify-between border-r border-border animate-in slide-in-from-left duration-250">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: activeTheme.primary }}
                  >
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-sm">Olivelas IAM Forms</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 mb-4">
                <Link
                  to="/app/forms/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white shadow-md"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  <Sparkles className="w-4 h-4" /> {t('nav.create_form')}
                </Link>
              </div>

              <nav className="space-y-4">
                <div className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Navegação
                  </p>
                  {primaryNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                        location.pathname === item.path ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-surface-hover'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>

                {adminNavItems.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-border">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Governança & IAM
                    </p>
                    {adminNavItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                          location.pathname === item.path ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-surface-hover'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="space-y-1 pt-2 border-t border-border">
                  <div className="flex items-center justify-between px-3 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                      <HelpCircle className="w-3 h-3" /> Validar
                    </p>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
                      {toValidateNavItems.length}
                    </span>
                  </div>
                  {toValidateNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                        location.pathname === item.path ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-surface-hover'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </nav>
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-destructive/20 text-destructive text-xs font-bold hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" /> {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN CONTENT WRAPPER (Direita: Header + Conteúdo)     */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Navbar (Fixa, colada no topo, background sólido opaco, sem transparência) */}
        <header className="sticky top-0 z-40 h-14 sm:h-16 shrink-0 border-b border-border bg-surface px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
          
          {/* Left: Mobile trigger & Page breadcrumb indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-border bg-surface text-muted-foreground hover:bg-surface-hover"
              aria-label="Abrir menu mobile"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={toggleSidebar}
              className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-surface-hover transition-colors"
              title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4 text-primary" /> : <PanelLeftClose className="w-4 h-4 text-muted-foreground" />}
              <span className="font-semibold">{collapsed ? 'Expandir' : 'Recolher'}</span>
            </button>
          </div>

          {/* Right Controls: 30 Themes, 3 Languages, User Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Toggle Light / Dark */}
            <button
              onClick={toggleLightDark}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground bg-surface hover:bg-surface-hover shadow-sm transition-all"
              title={activeTheme.mode === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            >
              {activeTheme.mode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {/* 30 Visual Themes */}
            <div className="relative">
              <button
                onClick={() => {
                  setThemeDropdownOpen(!themeDropdownOpen);
                  setUserDropdownOpen(false);
                  setLangDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold bg-surface hover:bg-surface-hover shadow-sm transition-all"
                title="Trocar Tema Visual (30 opções)"
              >
                <span
                  className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                  style={{ backgroundColor: activeTheme.primary }}
                />
                <span className="hidden md:inline max-w-[130px] truncate">{activeTheme.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {themeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-84 bg-surface rounded-2xl shadow-2xl border border-border py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 pb-2 border-b border-border/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-primary" /> Temas Visuais (30)
                      </p>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        {activeTheme.mode === 'dark' ? '🌙 Modo Escuro' : '☀️ Modo Claro'}
                      </span>
                    </div>

                    {/* Mode Filter Tabs */}
                    <div className="grid grid-cols-3 gap-1 p-1 bg-muted/40 rounded-xl border border-border/80 text-[11px] font-semibold">
                      <button
                        onClick={() => setThemeModeFilter('all')}
                        className={`py-1 rounded-lg transition-colors ${
                          themeModeFilter === 'all' ? 'bg-surface text-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Todos (30)
                      </button>
                      <button
                        onClick={() => setThemeModeFilter('light')}
                        className={`py-1 rounded-lg transition-colors ${
                          themeModeFilter === 'light' ? 'bg-surface text-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        ☀️ Claros (15)
                      </button>
                      <button
                        onClick={() => setThemeModeFilter('dark')}
                        className={`py-1 rounded-lg transition-colors ${
                          themeModeFilter === 'dark' ? 'bg-surface text-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        🌙 Escuros (15)
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Buscar por nome do tema..."
                      value={themeSearch}
                      onChange={(e) => setThemeSearch(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="max-h-72 overflow-y-auto px-1 py-1 space-y-0.5 custom-scrollbar">
                    {THEMES_LIST
                      .filter((t) => themeModeFilter === 'all' || t.mode === themeModeFilter)
                      .filter((t) => t.name.toLowerCase().includes(themeSearch.toLowerCase()))
                      .map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleThemeChange(t.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                            t.id === currentThemeId
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'hover:bg-surface-hover text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-3.5 h-3.5 rounded-full shadow-sm border border-black/20 shrink-0"
                              style={{ backgroundColor: t.primary }}
                            />
                            <span className="truncate">{t.name}</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold shrink-0 ${
                            t.mode === 'light' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                          }`}>
                            {t.mode === 'light' ? '☀️ Claro' : '🌙 Escuro'}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3 Languages Switcher (PT-BR, EN, ES) */}
            <div className="relative">
              <button
                onClick={() => {
                  setLangDropdownOpen(!langDropdownOpen);
                  setThemeDropdownOpen(false);
                  setUserDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold bg-surface hover:bg-surface-hover shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="uppercase">{locale}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-surface rounded-2xl shadow-xl border border-border py-1.5 z-50 glass animate-in fade-in zoom-in-95 duration-150">
                  {[
                    { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
                    { code: 'en', label: 'English', flag: '🇺🇸' },
                    { code: 'es', label: 'Español', flag: '🇪🇸' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLocale(l.code as any);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-colors ${
                        locale === l.code ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-surface-hover text-foreground'
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Persona Switcher & Supabase Accounts */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setThemeDropdownOpen(false);
                  setLangDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-hover shadow-sm"
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold leading-none">{user.full_name.split(' ')[0]}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{user.role.toUpperCase()}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-surface rounded-2xl shadow-2xl border border-border py-2 z-50 glass animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-border/80">
                    <p className="text-xs font-bold text-foreground">{user.full_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                      {user.role === 'admin' ? 'Administrador Global' : user.role === 'creator' ? 'Criador de Formulários' : 'Visualizador'}
                    </span>
                  </div>

                  <div className="px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">
                      Alternar Conta (Supabase & Demo):
                    </p>
                    <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
                      {demoUsers.map((du) => (
                        <button
                          key={du.email}
                          onClick={() => {
                            switchUser(du.email);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition-colors ${
                            user.email === du.email ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-surface-hover'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold truncate">{du.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate font-mono">{du.email}</p>
                          </div>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-muted shrink-0 font-mono">
                            {du.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border/80 pt-1.5 px-1.5 space-y-0.5">
                    <Link
                      to="/"
                      className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-surface-hover rounded-xl"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Landing Page
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-xl font-semibold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" /> {t('nav.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Scrollable Main Content (Espaçamento otimizado, sem excessos) */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full space-y-4">
            {children}
          </div>

          {/* Integrated Footer (Discreto e elegante) */}
          <footer className="max-w-7xl mx-auto w-full mt-6 pt-3 pb-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <p>© 2026 Olivelas IAM Forms. Governança, Formulários Avançados & Dashboards Inteligentes.</p>
            <div className="flex items-center gap-4">
              <Link to="/app/integrations" className="hover:text-foreground transition-colors">Google Sync</Link>
              <Link to="/app/tokens" className="hover:text-foreground transition-colors">API Docs</Link>
              <Link to="/" className="hover:text-foreground transition-colors">Landing Page</Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
