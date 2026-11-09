import React from 'react';
import { useApp } from '../../context/AppContext';
import { DesktopSidebar } from '../navigation/DesktopSidebar';
import { MobileHeader } from '../navigation/MobileHeader';
import { MobileBottomNav } from '../navigation/MobileBottomNav';
import { ContextSwitcherModal } from '../navigation/ContextSwitcherModal';
import { MobileMenuSheet } from '../navigation/MobileMenuSheet';
import { DemoToolbar } from '../navigation/DemoToolbar';
import { AiSearchModal } from '../ai/AiSearchModal';
import { ToastContainer } from '../ui/ToastContainer';
import { Bell, ChevronRight, Sparkles, Building, Moon, Sun, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { getRouteConfig } from '../../utils/routes';

// Views
import { LandingView } from '../../views/LandingView';
import { LoginView } from '../../views/LoginView';
import { CondoSelectView } from '../../views/CondoSelectView';
import { ResidentDashboardView } from '../../views/ResidentDashboardView';
import { TrusteeDashboardView } from '../../views/TrusteeDashboardView';
import { AdminDashboardView } from '../../views/AdminDashboardView';
import { BillsView } from '../../views/BillsView';
import { DocumentsView } from '../../views/DocumentsView';
import { AnnouncementsView } from '../../views/AnnouncementsView';
import { ReservationsView } from '../../views/ReservationsView';
import { CalendarView } from '../../views/CalendarView';
import { RequestsView } from '../../views/RequestsView';
import { OccurrencesView } from '../../views/OccurrencesView';
import { AssembliesView } from '../../views/AssembliesView';
import { GlobalAdminView } from '../../views/GlobalAdminView';
import { PermissionsMatrixView } from '../../views/PermissionsMatrixView';
import { UnitsManagementView } from '../../views/UnitsManagementView';
import { ResourcesConfigView } from '../../views/ResourcesConfigView';
import { DesignSystemShowcaseView } from '../../views/DesignSystemShowcaseView';
import { CommandPalette } from '../ui/CommandPalette';
import { NotificationCenter } from '../ui/NotificationCenter';
import { ProfileMenu } from '../ui/ProfileMenu';

export const AppLayout: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    activeCondominium,
    currentUser,
    activeRole,
    announcements,
    setIsContextSwitcherOpen,
    setIsAiSearchOpen,
    isDarkMode,
    toggleDarkMode,
    isMobileSimulator,
    isSidebarCollapsed,
    toggleSidebarCollapse,
  } = useApp();

  const unreadCount = announcements.filter(
    (a) => !a.readByUserIds.includes(currentUser.id)
  ).length;

  const viewInfo = getRouteConfig(currentView);

  // Full-screen standalone views that don't need the application shell navigation
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-950 text-[#1E293B] dark:text-slate-100 antialiased font-sans flex flex-col">
        <DemoToolbar />
        <LandingView />
        <ToastContainer />
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-950 text-[#1E293B] dark:text-slate-100 antialiased font-sans flex flex-col">
        <DemoToolbar />
        <LoginView />
        <ToastContainer />
      </div>
    );
  }

  if (currentView === 'condo_select') {
    return (
      <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-950 text-[#1E293B] dark:text-slate-100 antialiased font-sans flex flex-col">
        <DemoToolbar />
        <CondoSelectView />
        <ToastContainer />
      </div>
    );
  }

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <ResidentDashboardView />;
      case 'trustee_dashboard':
        return <TrusteeDashboardView />;
      case 'admin_dashboard':
        return <AdminDashboardView />;
      case 'bills':
        return <BillsView />;
      case 'documents':
        return <DocumentsView />;
      case 'announcements':
        return <AnnouncementsView />;
      case 'reservations':
        return <ReservationsView />;
      case 'calendar':
        return <CalendarView />;
      case 'requests':
        return <RequestsView />;
      case 'occurrences':
        return <OccurrencesView />;
      case 'assemblies':
        return <AssembliesView />;
      case 'global_admin':
      case 'modules_management':
        return <GlobalAdminView />;
      case 'permissions_matrix':
        return <PermissionsMatrixView />;
      case 'units_management':
        return <UnitsManagementView />;
      case 'resources_config':
      case 'condo_settings':
        return <ResourcesConfigView />;
      case 'design_system':
        return <DesignSystemShowcaseView />;
      default:
        return <ResidentDashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-950 text-[#1E293B] dark:text-slate-100 antialiased font-sans flex flex-col">
      {/* Top Demo Toolbar */}
      <DemoToolbar />

      {/* Main Content Area */}
      {isMobileSimulator ? (
        <div className="flex-1 bg-slate-950 py-6 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-36px)] overflow-y-auto">
          <div className="text-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/80 text-blue-300 text-xs font-semibold">
              📱 Simulador Mobile-First Ativo
            </span>
          </div>
          {/* Smartphone Hardware Frame */}
          <div className="w-full max-w-[395px] h-[820px] max-h-[85vh] bg-slate-900 rounded-[46px] p-3 shadow-2xl border-4 border-slate-700 relative flex flex-col overflow-hidden ring-1 ring-slate-600">
            {/* Camera / Island Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-end px-2 pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-[#1a233a] border border-blue-900/40" />
            </div>

            {/* Inner Phone Screen Container */}
            <div className="flex-1 bg-[#F1F5F9] dark:bg-slate-950 rounded-[36px] overflow-hidden flex flex-col relative">
              <MobileHeader />
              <main className="flex-1 p-3.5 pb-24 overflow-y-auto">
                {renderActiveView()}
              </main>
              <MobileBottomNav />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-36px)]">
          {/* Desktop Sidebar (visible on md+) */}
          <DesktopSidebar />

          {/* Main Area */}
          <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8 overflow-x-hidden">
            {/* Desktop Header (visible on md+) */}
            <header className="hidden md:flex h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 items-center justify-between shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSidebarCollapse}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral (somente ícones)'}
                  aria-label={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <PanelLeftClose className="w-5 h-5" />
                  )}
                </button>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 font-medium">{viewInfo.section}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{viewInfo.title}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* AI Assistant Quick Pill */}
                <button
                  onClick={() => setIsAiSearchOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Buscar IA</span>
                  <kbd className="text-[10px] bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400">
                    ⌘K
                  </kbd>
                </button>

                {/* Notification Center */}
                <NotificationCenter />

                {/* Theme Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                >
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>

                <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

                {/* Profile Menu */}
                <ProfileMenu />
              </div>
            </header>

            {/* Mobile Header (visible on < md) */}
            <MobileHeader />

            {/* Dynamic Main Page Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
              {renderActiveView()}
            </main>
          </div>

          {/* Mobile Bottom Navigation (visible on < md) */}
          <MobileBottomNav />
        </div>
      )}

      {/* Global Overlays & Modals */}
      <CommandPalette />
      <ContextSwitcherModal />
      <AiSearchModal />
      <ToastContainer />
    </div>
  );
};
