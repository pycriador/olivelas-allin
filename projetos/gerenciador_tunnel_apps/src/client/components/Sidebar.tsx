import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Plus,
  Play,
  Square,
  History,
  Settings,
  Bell,
  X,
  Radio,
  ChevronRight,
  Radar,
  Wifi,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ProvidersStatus, AppTunnelItem, NotificationItem } from '../types.js';
import { formatRelativeTime } from '../lib/utils.js';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  providersStatus: ProvidersStatus | null;
  apps: AppTunnelItem[];
  notifications: NotificationItem[];
  unreadCount: number;
  isRunningAny: boolean;
  onOpenNewApp: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenPortScanner: () => void;
  onStartAll: () => void;
  onStopAll: () => void;
  onMarkNotificationRead: (id?: number, all?: boolean) => void;
  activeFilterStatus: string;
  onSelectFilterStatus: (status: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  providersStatus,
  apps,
  notifications,
  unreadCount,
  isRunningAny,
  onOpenNewApp,
  onOpenSettings,
  onOpenHistory,
  onOpenPortScanner,
  onStartAll,
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

  const totalApps = apps.length;
  const runningApps = apps.filter((a) => a.is_running).length;
  const tunnelOnlineApps = apps.filter((a) => a.tunnel_status === 'online').length;
  const localOnlyApps = apps.filter((a) => a.execution_mode === 'app_only' || a.tunnel_provider === 'none').length;
  const stoppedApps = apps.filter((a) => !a.is_running).length;
  const errorApps = apps.filter((a) => a.last_status === 'error' || a.app_status === 'error' || a.tunnel_status === 'error').length;

  const cfInstalled = providersStatus?.providers?.cloudflared?.installed;
  const ngrokInstalled = providersStatus?.providers?.ngrok?.installed;

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-5 justify-between select-none">
      {/* Top: Logo & Close Button (Mobile) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-emerald-400 shadow-sm">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-zinc-100">Olivelas</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700/70">
                  Tunnel
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">Apps Locais & Túneis Web</p>
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

        {/* Card de Status dos Provedores e Rede Local */}
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              Motores de Túnel
            </span>
            <button
              onClick={() => {
                onOpenSettings();
                onCloseMobile();
              }}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 underline transition"
            >
              Configurar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <div className="px-2 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 flex items-center gap-1.5">
              {cfInstalled ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-zinc-200 truncate">Cloudflared</p>
                <p className="text-[9px] text-zinc-400 truncate">
                  {cfInstalled ? 'Pronto' : 'Não instalado'}
                </p>
              </div>
            </div>

            <div className="px-2 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 flex items-center gap-1.5">
              {ngrokInstalled ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-zinc-200 truncate">Ngrok</p>
                <p className="text-[9px] text-zinc-400 truncate">
                  {ngrokInstalled ? (providersStatus?.hasNgrokToken ? 'Autenticado' : 'Instalado') : 'Ausente'}
                </p>
              </div>
            </div>
          </div>

          {providersStatus?.lanIp && (
            <div className="pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
              <span className="text-zinc-400">IP na Rede (LAN):</span>
              <span className="font-mono text-zinc-200 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                {providersStatus.lanIp}
              </span>
            </div>
          )}
        </div>

        {/* Botão Principal: Nova Aplicação / Túnel */}
        <button
          onClick={() => {
            onOpenNewApp();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 shadow-xs border border-zinc-200/20 transition active:scale-[0.99]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Aplicação / Túnel</span>
        </button>

        {/* Botão Iniciar Todas / Parar Todas */}
        {isRunningAny ? (
          <button
            onClick={onStopAll}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 transition"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Parar Todos ({runningApps})</span>
          </button>
        ) : (
          <button
            disabled={totalApps === 0}
            onClick={onStartAll}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            <Play className="w-3.5 h-3.5 text-zinc-400 fill-current" />
            <span>Iniciar Todas Ativas</span>
          </button>
        )}

        {/* Menu de Filtros */}
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
            <span>Todas as Aplicações</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              {totalApps}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectFilterStatus('running');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
              activeFilterStatus === 'running'
                ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${runningApps > 0 ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              Rodando Agora
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              {runningApps}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectFilterStatus('tunnel_online');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
              activeFilterStatus === 'tunnel_online'
                ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${tunnelOnlineApps > 0 ? 'bg-cyan-400' : 'bg-zinc-600'}`} />
              Túnel Público Ativo
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              {tunnelOnlineApps}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectFilterStatus('local_only');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
              activeFilterStatus === 'local_only'
                ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <span>Apenas App Local</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              {localOnlyApps}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectFilterStatus('stopped');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
              activeFilterStatus === 'stopped'
                ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <span>Paradas</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              {stoppedApps}
            </span>
          </button>

          {errorApps > 0 && (
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
                {errorApps}
              </span>
            </button>
          )}
        </div>

        {/* Links de Utilitários / Modais */}
        <div className="space-y-0.5 pt-3 border-t border-zinc-800/80">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Ferramentas
          </p>

          {/* Scanner de Portas Locais */}
          <button
            onClick={() => {
              onOpenPortScanner();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition group"
          >
            <div className="flex items-center gap-2">
              <Radar className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-300" />
              <span>Portas Ativas no PC</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {/* Histórico de URLs e Execuções */}
          <button
            onClick={() => {
              onOpenHistory();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition group"
          >
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" />
              <span>Histórico de URLs</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
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

            {showNotifications && (
              <div className="absolute left-0 right-0 bottom-full mb-2 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden z-50 max-h-72 flex flex-col">
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
                          <span className="truncate">{n.title}</span>
                          <span className="text-[9px] text-zinc-400 shrink-0 ml-1">
                            {formatRelativeTime(n.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 break-all">{n.message}</p>
                        {n.public_url && (
                          <a
                            href={n.public_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:underline font-mono"
                          >
                            Abrir URL <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
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
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Bottom Footer na Sidebar */}
      <div className="pt-3 border-t border-zinc-800/80 text-[10px] text-zinc-400 space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Radio className={`w-3 h-3 ${tunnelOnlineApps > 0 ? 'text-emerald-400' : 'text-zinc-500'}`} />
            Túneis online
          </span>
          <span className="font-mono text-zinc-300">{tunnelOnlineApps} ativos</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <p className="text-zinc-400 text-[9px]">Olivelas Local Tunnel v1.0</p>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            {typeof window !== 'undefined' && window.electronAPI?.isElectron ? '⚡ Desktop' : '🌐 Web'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-zinc-950 border-r border-zinc-800/90 z-20">
        {sidebarContent}
      </aside>

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
