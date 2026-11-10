import React, { useState, useRef, useEffect } from 'react';
import {
  Cloud,
  FolderPlus,
  RefreshCw,
  Square,
  History,
  Settings,
  Bell,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  X,
  Radio,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { AuthStatus, SyncFolder, NotificationItem } from '../types.js';
import { formatBytes, formatRelativeTime } from '../lib/utils.js';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  authStatus: AuthStatus | null;
  folders: SyncFolder[];
  notifications: NotificationItem[];
  unreadCount: number;
  isSyncingAny: boolean;
  onOpenNewFolder: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onSyncAll: () => void;
  onStopAll: () => void;
  onMarkNotificationRead: (id?: number, all?: boolean) => void;
  activeFilterStatus: string;
  onSelectFilterStatus: (status: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  authStatus,
  folders,
  notifications,
  unreadCount,
  isSyncingAny,
  onOpenNewFolder,
  onOpenSettings,
  onOpenHistory,
  onSyncAll,
  onStopAll,
  onMarkNotificationRead,
  activeFilterStatus,
  onSelectFilterStatus,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile();
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCloseMobile]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalFolders = folders.length;
  const activeFolders = folders.filter((f) => f.is_active).length;
  const syncingFolders = folders.filter((f) => f.is_syncing).length;
  const pausedFolders = folders.filter((f) => !f.is_active).length;
  const errorFolders = folders.filter((f) => f.last_sync_status === 'error').length;
  const watchedFolders = folders.filter((f) => f.is_active && f.watch_enabled).length;

  const quotaLimit = authStatus?.storageQuota?.limit ? Number(authStatus.storageQuota.limit) : 0;
  const quotaUsage = authStatus?.storageQuota?.usage ? Number(authStatus.storageQuota.usage) : 0;
  const quotaPercent = quotaLimit > 0 ? Math.round((quotaUsage / quotaLimit) * 100) : 0;

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-5 justify-between select-none">
      {/* Top: Logo & Close Button (Mobile) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 shadow-sm">
              <Cloud className="w-4 h-4 text-zinc-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-zinc-100">Olivelas</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/70">
                  Drive
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">Sincronizador Local</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition lg:hidden"
            title="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card de Conexão com Google Drive */}
        <div>
          {authStatus?.isConnected ? (
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-medium text-zinc-200">Conectado</span>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                  {authStatus.mode === 'oauth' ? 'OAuth' : 'Service'}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-mono truncate" title={authStatus.email}>
                {authStatus.email}
              </p>

              {quotaLimit > 0 && (
                <div className="mt-2.5 pt-2 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-zinc-400" />
                      Armazenamento
                    </span>
                    <span className="font-mono text-zinc-300 font-medium">{quotaPercent}%</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-zinc-300 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, quotaPercent)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                    {formatBytes(quotaUsage)} de {formatBytes(quotaLimit)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenSettings();
                onCloseMobile();
              }}
              className="w-full p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 text-left transition group"
            >
              <div className="flex items-center gap-1.5 text-zinc-300 mb-1 font-medium text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Drive Desconectado</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Clique para conectar sua conta ou chave.
              </p>
            </button>
          )}
        </div>

        {/* Botão Principal: Nova Pasta (Solid Crisp) */}
        <button
          onClick={() => {
            onOpenNewFolder();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 shadow-xs border border-zinc-200/20 transition active:scale-[0.99]"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Nova Pasta</span>
        </button>

        {/* Botão Sincronizar Tudo / Parar Tudo */}
        {isSyncingAny ? (
          <button
            onClick={onStopAll}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 transition"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Parar Sincronizações</span>
          </button>
        ) : (
          <button
            disabled={!authStatus?.isConnected}
            onClick={onSyncAll}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sincronizar Todas</span>
          </button>
        )}

        {/* Menu de Filtros de Pastas */}
        <div className="space-y-0.5 pt-2">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Filtros
          </p>

          <button
            onClick={() => {
              onSelectFilterStatus('all');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
              activeFilterStatus === 'all'
                ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <span>Todas as Pastas</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              {totalFolders}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectFilterStatus('syncing');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
              activeFilterStatus === 'syncing'
                ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${syncingFolders > 0 ? 'bg-blue-400' : 'bg-zinc-600'}`} />
              Sincronizando
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              {syncingFolders}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectFilterStatus('active');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
              activeFilterStatus === 'active'
                ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <span>Ativas</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              {activeFolders}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectFilterStatus('paused');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
              activeFilterStatus === 'paused'
                ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <span>Pausadas</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              {pausedFolders}
            </span>
          </button>

          {errorFolders > 0 && (
            <button
              onClick={() => {
                onSelectFilterStatus('error');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                activeFilterStatus === 'error'
                  ? 'bg-red-950/40 text-red-300 font-medium border border-red-800/60'
                  : 'text-red-400 hover:text-red-300 hover:bg-red-950/20'
              }`}
            >
              <span>Com Falha</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/80">
                {errorFolders}
              </span>
            </button>
          )}
        </div>

        {/* Links de Utilitários / Modais */}
        <div className="space-y-0.5 pt-3 border-t border-zinc-800/80">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Ações
          </p>

          {/* Histórico */}
          <button
            onClick={() => {
              onOpenHistory();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition group"
          >
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" />
              <span>Histórico de Arquivos</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-400" />
          </button>

          {/* Notificações com Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition group"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" />
                <span>Notificações</span>
              </div>
              {unreadCount > 0 ? (
                <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded bg-zinc-100 text-zinc-950">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : (
                <span className="text-[10px] text-zinc-400 font-mono">0</span>
              )}
            </button>

            {/* Painel Flutuante de Notificações */}
            {showNotifications && (
              <div className="absolute left-0 right-0 bottom-full mb-2 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden z-50 animate-fade-in max-h-72 flex flex-col">
                <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                  <span className="font-medium text-xs text-zinc-200 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-zinc-400" /> Notificações
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => onMarkNotificationRead(undefined, true)}
                      className="text-[10px] text-zinc-400 hover:text-zinc-200 transition"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto p-2 divide-y divide-zinc-800/60">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-400">
                      Nenhuma notificação recente.
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div key={n.id} className="p-2 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-200">
                          <span>{n.title}</span>
                          <span className="text-[9px] text-zinc-400">{formatRelativeTime(n.created_at)}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Configurações */}
          <button
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition group"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" />
              <span>Configurações</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Bottom Footer na Sidebar */}
      <div className="pt-3 border-t border-zinc-800/80 text-[10px] text-zinc-400 space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Radio className="w-3 h-3 text-emerald-500" />
            Watcher ativo
          </span>
          <span className="font-mono text-zinc-400">{watchedFolders} pastas</span>
        </div>
        <p className="text-zinc-400 pt-1 text-[9px]">Olivelas GDrive Sync v1.0</p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Sidebar Fixa para Desktop (>= lg: 1024px) */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-zinc-950 border-r border-zinc-800/90 z-20">
        {sidebarContent}
      </aside>

      {/* 2. Drawer Mobile com Backdrop (< lg: 1024px) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />

          <div className="relative w-72 max-w-[85vw] h-full bg-zinc-950 border-r border-zinc-800 shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
