import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LayoutDashboard, Calendar, Bell, Menu } from 'lucide-react';
import { MobileMenuSheet } from './MobileMenuSheet';

export const MobileBottomNav: React.FC = () => {
  const { currentView, setCurrentView, currentUser, announcements } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const unreadAnnouncements = announcements.filter(
    (a) => !a.readByUserIds.includes(currentUser.id)
  ).length;

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 safe-bottom">
        <div className="flex items-center justify-around px-2 py-1.5">
          {/* Início */}
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentView === 'dashboard' ||
              currentView === 'trustee_dashboard' ||
              currentView === 'admin_dashboard'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Início</span>
          </button>

          {/* Agenda / Calendário */}
          <button
            onClick={() => setCurrentView('calendar')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentView === 'calendar' || currentView === 'reservations'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Agenda</span>
          </button>

          {/* Avisos */}
          <button
            onClick={() => setCurrentView('announcements')}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentView === 'announcements'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            <div className="relative">
              <Bell className="w-5 h-5 mb-0.5" />
              {unreadAnnouncements > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
            <span className="text-[10px] leading-tight">Avisos</span>
          </button>

          {/* Mais */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Sheet */}
      <MobileMenuSheet isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};
