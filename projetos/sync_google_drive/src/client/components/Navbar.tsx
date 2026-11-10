import React, { useState, useRef, useEffect } from 'react';
import {
  Cloud,
  RefreshCw,
  Square,
  Settings,
  Bell,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { AuthStatus, NotificationItem } from '../types.js';
import { formatRelativeTime } from '../lib/utils.js';

interface NavbarProps {
  authStatus: AuthStatus | null;
  notifications: NotificationItem[];
  unreadCount: number;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onSyncAll: () => void;
  onStopAll: () => void;
  onMarkNotificationRead: (id?: number, all?: boolean) => void;
  isSyncingAny: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  authStatus,
  notifications,
  unreadCount,
  onOpenSettings,
  onOpenHistory,
  onSyncAll,
  onStopAll,
  onMarkNotificationRead,
  isSyncingAny,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-white">Olivelas GDrive Sync</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Sincronizador Automático & Assíncrono com Google Drive</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Status do Google Drive */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              authStatus?.isConnected
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
            }`}
            title="Clique para configurar o Google Drive"
          >
            {authStatus?.isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="max-w-[150px] truncate">{authStatus.email || 'Conectado ao Drive'}</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Conectar Google Drive</span>
              </>
            )}
          </button>

          {/* Botão Sincronizar Tudo ou Parar Tudo */}
          {isSyncingAny ? (
            <button
              onClick={onStopAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition animate-pulse"
              title="Interromper todas as sincronizações em andamento"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Parar Sincronização</span>
            </button>
          ) : (
            <button
              disabled={!authStatus?.isConnected}
              onClick={onSyncAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-40 disabled:pointer-events-none transition"
              title="Sincronizar todas as pastas agora"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sincronizar Tudo</span>
            </button>
          )}

          {/* Histórico */}
          <button
            onClick={onOpenHistory}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            title="Histórico de arquivos sincronizados"
          >
            <History className="w-5 h-5" />
          </button>

          {/* Notificações Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition relative"
              title="Notificações do sistema"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel shadow-2xl border border-slate-700/80 bg-slate-900/95 overflow-hidden z-50 animate-fade-in">
                <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs text-white">Notificações em Tempo Real</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => onMarkNotificationRead(undefined, true)}
                      className="text-[11px] text-indigo-400 hover:underline"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      Nenhuma notificação por enquanto.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl transition ${
                          n.is_read ? 'opacity-60 hover:opacity-100' : 'bg-indigo-500/10 border border-indigo-500/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-xs text-slate-200">{n.title}</p>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {formatRelativeTime(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Configurações */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            title="Configurações de Credenciais e API"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
