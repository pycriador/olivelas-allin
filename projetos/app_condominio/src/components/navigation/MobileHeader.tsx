import React from 'react';
import { useApp } from '../../context/AppContext';
import { Building, Sparkles, Moon, Sun, ChevronDown } from 'lucide-react';
import { NotificationCenter } from '../ui/NotificationCenter';

export const MobileHeader: React.FC = () => {
  const {
    activeCondominium,
    setIsContextSwitcherOpen,
    setIsAiSearchOpen,
    isDarkMode,
    toggleDarkMode,
    currentUser,
    activeRole,
  } = useApp();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between safe-top">
      {/* Active Condominium Switcher Button */}
      <button
        onClick={() => setIsContextSwitcherOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold border border-slate-200/60 dark:border-slate-700/60 active:scale-95 transition-all max-w-[180px]"
      >
        <Building className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="truncate">{activeCondominium.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {/* Action Icons */}
      <div className="flex items-center gap-1">
        <NotificationCenter />

        <button
          onClick={() => setIsAiSearchOpen(true)}
          className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer"
          title="Pesquisa IA"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Alternar Tema"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        <div
          onClick={() => setIsContextSwitcherOpen(true)}
          className="relative cursor-pointer ml-0.5"
        >
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={currentUser.name}
            className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            referrerPolicy="no-referrer"
          />
          {activeRole === 'trustee' && (
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" />
          )}
        </div>
      </div>
    </header>
  );
};
