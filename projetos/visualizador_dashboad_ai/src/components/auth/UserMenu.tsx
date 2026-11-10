import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon,
  LogOut,
  Settings,
  Shield,
  KeyRound,
  FileSpreadsheet,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface UserMenuProps {
  onOpenSettings?: () => void;
}

export function UserMenu({ onOpenSettings }: UserMenuProps) {
  const { user, isAuthenticated, logout, openAuthModal, googleConfigured, googleClientEmail } =
    useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openAuthModal('login')}
          className="text-xs h-8 px-3 font-semibold"
        >
          Entrar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => openAuthModal('register')}
          className="text-xs h-8 px-3 font-semibold"
        >
          Criar Conta
        </Button>
      </div>
    );
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
          {initials}
        </div>
        <div className="hidden sm:block">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
            {user.name}
          </div>
          <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.email}</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>

            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Google Cloud</span>
              {googleConfigured ? (
                <Badge variant="success" size="sm" className="gap-1 text-[10px] py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Conectado
                </Badge>
              ) : (
                <Badge variant="secondary" size="sm" className="text-[10px] py-0.5">
                  Não Configurado
                </Badge>
              )}
            </div>
          </div>

          <div className="py-1">
            {onOpenSettings && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span>Configurar Chaves e Google</span>
              </button>
            )}

            {onOpenSettings && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Configurações do Workspace</span>
              </button>
            )}
          </div>

          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
