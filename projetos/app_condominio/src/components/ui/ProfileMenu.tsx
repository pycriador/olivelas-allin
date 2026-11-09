import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Building2,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Palette,
  ChevronRight,
} from 'lucide-react';
import { Badge } from './Badge';

export const ProfileMenu: React.FC = () => {
  const {
    currentUser,
    activeRole,
    activeCondominium,
    activeMembership,
    isDarkMode,
    toggleDarkMode,
    setIsContextSwitcherOpen,
    setCurrentView,
    logout,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'resident':
        return 'Morador';
      case 'trustee':
        return 'Síndico';
      case 'admin':
        return 'Administração';
      case 'global_admin':
        return 'Admin Global';
      default:
        return role;
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none focus:outline-none"
        aria-label="Menu do Usuário"
      >
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
          {currentUser.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')}
        </div>
        <div className="hidden lg:flex flex-col text-left">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
            {currentUser.name.split(' ')[0]}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {getRoleLabel(activeRole)}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-1.5 animate-in zoom-in-95 duration-150">
          {/* User Info Header */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentUser.email}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="primary" size="sm">
                    {getRoleLabel(activeRole)}
                  </Badge>
                  {activeMembership?.unitNumber && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      Apt {activeMembership.unitNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5">
            <button
              onClick={() => {
                setIsContextSwitcherOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>Meus Condomínios</span>
              </div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[90px]">
                {activeCondominium.name}
              </span>
            </button>

            <button
              onClick={() => {
                toggleDarkMode();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500" />
                )}
                <span>Aparência</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
              </span>
            </button>

            <button
              onClick={() => {
                setCurrentView('condo_settings');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Preferências & Conta</span>
            </button>

            <button
              onClick={() => {
                setCurrentView('permissions_matrix');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Permissões & Segurança</span>
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Plataforma</span>
            </button>

            <div className="pt-2 pb-1 text-center border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                Condominium Platform v0.1 (Beta)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
