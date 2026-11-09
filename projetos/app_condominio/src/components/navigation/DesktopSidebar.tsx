import React from 'react';
import { useApp, AppView } from '../../context/AppContext';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Bell,
  CalendarCheck2,
  Calendar,
  LifeBuoy,
  AlertTriangle,
  Users2,
  Building,
  Sliders,
  Settings,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  Moon,
  Sun,
  LogOut,
  Layers,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export const DesktopSidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    activeCondominium,
    activeRole,
    currentUser,
    setIsContextSwitcherOpen,
    setIsAiSearchOpen,
    isDarkMode,
    toggleDarkMode,
    logout,
    announcements,
    isSidebarCollapsed,
    toggleSidebarCollapse,
  } = useApp();

  const unreadAnnouncements = announcements.filter(
    (a) => !a.readByUserIds.includes(currentUser.id)
  ).length;

  const isTrusteeOrAdmin = activeRole === 'trustee' || activeRole === 'admin' || activeRole === 'global_admin';
  const isGlobalAdmin = activeRole === 'global_admin' || currentUser.isGlobalAdmin;

  const mainNavItems: {
    key: AppView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    isAi?: boolean;
  }[] = [
    {
      key: activeRole === 'trustee' ? 'trustee_dashboard' : activeRole === 'admin' ? 'admin_dashboard' : activeRole === 'global_admin' ? 'global_admin' : 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      key: 'bills',
      label: 'Boletos',
      icon: Receipt,
      badge: '1 pendente',
    },
    {
      key: 'documents',
      label: 'Documentos',
      icon: FileText,
    },
    {
      key: 'announcements',
      label: 'Comunicados',
      icon: Bell,
      badge: unreadAnnouncements > 0 ? unreadAnnouncements : undefined,
    },
    {
      key: 'reservations',
      label: 'Reservas',
      icon: CalendarCheck2,
    },
    {
      key: 'calendar',
      label: 'Calendário',
      icon: Calendar,
    },
    {
      key: 'requests',
      label: 'Solicitações',
      icon: LifeBuoy,
    },
    {
      key: 'occurrences',
      label: 'Ocorrências',
      icon: AlertTriangle,
    },
    {
      key: 'assemblies',
      label: 'Assembleias',
      icon: Users2,
      badge: '1 ativa',
    },
  ];

  const adminNavItems: {
    key: AppView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      key: 'admin_dashboard',
      label: 'Visão Geral Gestão',
      icon: LayoutDashboard,
    },
    {
      key: 'units_management',
      label: 'Unidades & Moradores',
      icon: Building,
    },
    {
      key: 'resources_config',
      label: 'Parâmetros de Reservas',
      icon: Sliders,
    },
    {
      key: 'permissions_matrix',
      label: 'Matriz de Permissões (RBAC)',
      icon: ShieldCheck,
    },
    {
      key: 'condo_settings',
      label: 'Configurações do Condomínio',
      icon: Settings,
    },
  ];

  const globalAdminNavItems: {
    key: AppView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      key: 'global_admin',
      label: 'Tenants & Condomínios',
      icon: ShieldAlert,
    },
    {
      key: 'modules_management',
      label: 'Módulos & Feature Flags',
      icon: Layers,
    },
    {
      key: 'design_system',
      label: 'Design System & Tokens',
      icon: Layers,
    },
  ];

  return (
    <aside
      className={`hidden md:flex md:sticky md:top-0 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      } bg-[#0F172A] text-slate-300 border-r border-slate-800 flex-col h-screen shrink-0 select-none z-20 transition-all duration-300 ease-in-out`}
    >
      {/* Top Branding & Collapse Button */}
      <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} border-b border-slate-800`}>
        {!isSidebarCollapsed ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                C
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-semibold text-white tracking-tight leading-tight whitespace-nowrap">
                    Condominium <span className="text-blue-400 font-normal">SaaS</span>
                  </h1>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/80">
                    v0.1 (Beta)
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={toggleSidebarCollapse}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Recolher menu (somente ícones)"
              aria-label="Recolher menu"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              C
            </div>
            <button
              onClick={toggleSidebarCollapse}
              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Expandir menu completo"
              aria-label="Expandir menu"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* AI Assistant Quick Trigger */}
      <div className={`pt-3 ${isSidebarCollapsed ? 'px-2 flex justify-center' : 'px-3'}`}>
        {!isSidebarCollapsed ? (
          <button
            onClick={() => setIsAiSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all text-xs font-medium group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Assistente IA...</span>
            </div>
            <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
              ⌘K
            </span>
          </button>
        ) : (
          <button
            onClick={() => setIsAiSearchOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/80 text-blue-400 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-all cursor-pointer group"
            title="Assistente IA (⌘K)"
            aria-label="Assistente IA"
          >
            <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      {/* Navigation Links Scrollable Area */}
      <div className={`flex-1 overflow-y-auto p-3 ${isSidebarCollapsed ? 'px-2 space-y-2' : 'space-y-4'}`}>
        {/* Main Menu */}
        <div>
          {!isSidebarCollapsed && (
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 mb-1.5 block">
              Principal
            </span>
          )}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setCurrentView(item.key)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed
                      ? 'justify-center h-10 w-10 mx-auto rounded-xl p-0 relative'
                      : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'hover:bg-slate-800 hover:text-white text-slate-300'
                  }`}
                >
                  {isSidebarCollapsed ? (
                    <>
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      {item.badge && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0F172A]" />
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-800 text-blue-400 border border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Administration Section */}
        {isTrusteeOrAdmin && (
          <div className={`${isSidebarCollapsed ? 'pt-2 border-t border-slate-800' : 'pt-2 border-t border-slate-800'}`}>
            {!isSidebarCollapsed ? (
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 mb-1.5 block">
                Administrativo
              </span>
            ) : (
              <div className="h-px bg-slate-800 my-1 mx-1" />
            )}
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setCurrentView(item.key)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed
                        ? 'justify-center h-10 w-10 mx-auto rounded-xl p-0 relative'
                        : 'justify-between px-3 py-2 rounded-lg'
                    } text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'hover:bg-slate-800 hover:text-white text-slate-300'
                    }`}
                  >
                    {isSidebarCollapsed ? (
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                    ) : (
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Global SaaS Admin (SuperAdmin) */}
        {isGlobalAdmin && (
          <div className="pt-2 border-t border-slate-800">
            {!isSidebarCollapsed ? (
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 mb-1.5 block">
                Global SaaS
              </span>
            ) : (
              <div className="h-px bg-slate-800 my-1 mx-1" />
            )}
            <nav className="space-y-1">
              {globalAdminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setCurrentView(item.key)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed
                        ? 'justify-center h-10 w-10 mx-auto rounded-xl p-0 relative'
                        : 'justify-between px-3 py-2 rounded-lg'
                    } text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'hover:bg-slate-800 hover:text-white text-slate-300'
                    }`}
                  >
                    {isSidebarCollapsed ? (
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                    ) : (
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer Context Switcher & User Profile */}
      <div className={`p-3 border-t border-slate-800 ${isSidebarCollapsed ? 'flex flex-col items-center gap-2 px-2' : 'space-y-2'}`}>
        {!isSidebarCollapsed ? (
          <>
            {/* Condominium Context Button */}
            <button
              onClick={() => setIsContextSwitcherOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors text-left cursor-pointer border border-slate-700/50 group"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                <span className="truncate text-slate-200 font-semibold">{activeCondominium.name}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0" />
            </button>

            {/* User Card & Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 bg-blue-100 dark:bg-blue-900 rounded-full border border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs shrink-0">
                  {currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize truncate">
                    {activeRole === 'trustee'
                      ? 'Síndico'
                      : activeRole === 'admin'
                      ? 'Administração'
                      : activeRole === 'global_admin'
                      ? 'Admin Global'
                      : 'Morador'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={toggleDarkMode}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                  title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                >
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Compact Condo Switcher */}
            <button
              onClick={() => setIsContextSwitcherOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer relative"
              title={`Condomínio: ${activeCondominium.name} (Clique para alternar)`}
            >
              <Building className="w-4 h-4 text-emerald-400" />
              <span className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-800" />
            </button>

            {/* Compact User Profile */}
            <button
              onClick={() => setIsContextSwitcherOpen(true)}
              className="h-9 w-9 bg-blue-900 border border-blue-700 rounded-xl flex items-center justify-center text-blue-300 font-bold text-xs cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              title={`${currentUser.name} (${activeRole === 'trustee' ? 'Síndico' : activeRole === 'admin' ? 'Administração' : activeRole === 'global_admin' ? 'Admin Global' : 'Morador'})`}
            >
              {currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </button>

            {/* Compact Actions */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

