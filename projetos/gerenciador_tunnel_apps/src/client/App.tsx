import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Globe,
  Radar,
  RefreshCw,
  Sparkles,
  Server,
} from 'lucide-react';
import {
  AppTunnelItem,
  ProvidersStatus,
  NotificationItem,
  LogEntry,
  TunnelProvider,
  ExecutionMode,
} from './types.js';
import { api } from './lib/api.js';
import { Sidebar } from './components/Sidebar.js';
import { MobileHeader } from './components/MobileHeader.js';
import { DashboardStats } from './components/DashboardStats.js';
import { AppTunnelCard } from './components/AppTunnelCard.js';
import { NewAppModal } from './components/NewAppModal.js';
import { LogsModal } from './components/LogsModal.js';
import { ActivePortsModal } from './components/ActivePortsModal.js';
import { QrCodeModal } from './components/QrCodeModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { HistoryModal } from './components/HistoryModal.js';
import { NotificationToast, ToastItem } from './components/NotificationToast.js';

export const App: React.FC = () => {
  const [apps, setApps] = useState<AppTunnelItem[]>([]);
  const [providersStatus, setProvidersStatus] = useState<ProvidersStatus | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filtros e Busca
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modais
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newAppModalOpen, setNewAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppTunnelItem | null>(null);
  const [prefillPort, setPrefillPort] = useState<number | null>(null);
  const [prefillProvider, setPrefillProvider] = useState<TunnelProvider | null>(null);
  const [prefillMode, setPrefillMode] = useState<ExecutionMode | null>(null);
  const [prefillName, setPrefillName] = useState<string | null>(null);

  const [logsModalAppId, setLogsModalAppId] = useState<number | null>(null);
  const [logsByApp, setLogsByApp] = useState<Record<number, LogEntry[]>>({});

  const [qrModalApp, setQrModalApp] = useState<AppTunnelItem | null>(null);
  const [portScannerOpen, setPortScannerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (
      title: string,
      message: string,
      type: ToastItem['type'] = 'info',
      publicUrl?: string
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, message, type, publicUrl }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 7000);
    },
    []
  );

  const loadInitialData = useCallback(async () => {
    try {
      const [appsData, statusData, notifData] = await Promise.all([
        api.getApps(),
        api.getProvidersStatus(),
        api.getNotifications(),
      ]);
      setApps(appsData);
      setProvidersStatus(statusData);
      setNotifications(notifData.notifications);
      setUnreadCount(notifData.unreadCount);
    } catch (err: any) {
      console.error('Erro ao carregar dados iniciais:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Extrator auxiliar de URL pública a partir de linha de log
  const extractPublicUrlFromText = useCallback((text: string): string | null => {
    const match = text.match(
      /https:\/\/[a-zA-Z0-9.-]+\.(?:trycloudflare\.com|ngrok(?:-free)?\.(?:app|io|dev|pizza)|loca\.lt|lhr\.life|localhost\.run)/i
    );
    return match ? match[0] : null;
  }, []);

  // Conexão SSE em Tempo Real
  useEffect(() => {
    const evtSource = new EventSource('/api/events');

    evtSource.addEventListener('app_status', (e: MessageEvent) => {
      try {
        const updatedApp: AppTunnelItem = JSON.parse(e.data);
        if (updatedApp && updatedApp.id) {
          setApps((prev) =>
            prev.map((item) => (item.id === updatedApp.id ? updatedApp : item))
          );
        }
      } catch {
        // ignora erro de parse
      }
    });

    evtSource.addEventListener('tunnel_url', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.publicUrl && data.appId) {
          setApps((prev) =>
            prev.map((item) =>
              item.id === data.appId
                ? {
                    ...item,
                    public_url: data.publicUrl,
                    last_public_url: data.publicUrl,
                    tunnel_status: 'online',
                    is_running: true,
                  }
                : item
            )
          );
          addToast(
            `Túnel Público Online (${data.provider || 'Tunnel'})`,
            `URL gerada para ${data.appName || data.name || 'aplicação'}: ${data.publicUrl}`,
            'tunnel_online',
            data.publicUrl
          );
        }
        loadInitialData();
      } catch {
        // ignora
      }
    });

    evtSource.addEventListener('app_log', (e: MessageEvent) => {
      try {
        const entry: LogEntry = JSON.parse(e.data);
        setLogsByApp((prev) => {
          const current = prev[entry.appId] || [];
          const next = [...current.slice(-299), entry];
          return { ...prev, [entry.appId]: next };
        });

        const foundUrl = extractPublicUrlFromText(entry.line);
        setApps((prev) =>
          prev.map((a) => {
            if (a.id !== entry.appId) return a;
            return {
              ...a,
              last_log_line: entry.line,
              ...(foundUrl
                ? {
                    public_url: foundUrl,
                    last_public_url: foundUrl,
                    tunnel_status: 'online' as const,
                    is_running: true,
                  }
                : {}),
            };
          })
        );
      } catch {
        // ignora
      }
    });

    evtSource.addEventListener('notification', (e: MessageEvent) => {
      try {
        const notif: NotificationItem = JSON.parse(e.data);
        setNotifications((prev) => [notif, ...prev.slice(0, 49)]);
        setUnreadCount((c) => c + 1);
      } catch {
        // ignora
      }
    });

    return () => {
      evtSource.close();
    };
  }, [addToast, loadInitialData, extractPublicUrlFromText]);

  // Sincronização periódica automática enquanto houver túneis iniciando ou em execução
  useEffect(() => {
    const hasActiveOrStarting = apps.some(
      (a) =>
        a.is_running ||
        a.app_status === 'starting' ||
        a.tunnel_status === 'starting'
    );
    if (!hasActiveOrStarting) return;

    const interval = setInterval(async () => {
      try {
        const freshApps = await api.getApps();
        setApps(freshApps);
      } catch {
        // ignora
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [apps]);

  // Handlers de Ações
  const handleStartApp = async (id: number) => {
    try {
      const res = await api.startApp(id);
      setApps((prev) => prev.map((a) => (a.id === id ? res.app : a)));
      addToast('Iniciando Aplicação', `${res.app.name} foi iniciado.`, 'app_started');
    } catch (err: any) {
      addToast('Erro ao Iniciar', err.message, 'app_error');
    }
  };

  const handleStopApp = async (id: number) => {
    try {
      const res = await api.stopApp(id);
      setApps((prev) => prev.map((a) => (a.id === id ? res.app : a)));
    } catch (err: any) {
      addToast('Erro ao Parar', err.message, 'app_error');
    }
  };

  const handleRestartApp = async (id: number) => {
    try {
      const res = await api.restartApp(id);
      setApps((prev) => prev.map((a) => (a.id === id ? res.app : a)));
      addToast('Reiniciando', `${res.app.name} está reiniciando...`, 'info');
    } catch (err: any) {
      addToast('Erro ao Reiniciar', err.message, 'app_error');
    }
  };

  const handleStartQuickTunnel = async (
    id: number,
    provider: 'cloudflared' | 'ngrok',
    port?: number
  ) => {
    try {
      const res = await api.startTunnelForApp(id, provider, port);
      setApps((prev) => prev.map((a) => (a.id === id ? res.app : a)));
      addToast(
        `Iniciando Túnel ${provider}`,
        `Aguardando geração da URL pública${port ? ` (Porta ${port})` : ''}...`,
        'info'
      );
    } catch (err: any) {
      addToast('Erro no Túnel', err.message, 'app_error');
    }
  };

  const handleStopTunnel = async (id: number) => {
    try {
      const res = await api.stopTunnelForApp(id);
      setApps((prev) => prev.map((a) => (a.id === id ? res.app : a)));
    } catch (err: any) {
      addToast('Erro ao Fechar Túnel', err.message, 'app_error');
    }
  };

  const handleOpenLogs = async (app: AppTunnelItem) => {
    setLogsModalAppId(app.id);
    try {
      const res = await api.getAppLogs(app.id);
      const fetchedLogs = res.logs || [];
      setLogsByApp((prev) => ({ ...prev, [app.id]: fetchedLogs }));

      // Caso exista URL gerada nos logs, garantir que o estado da aplicação reflita na interface imediatamente
      for (let i = fetchedLogs.length - 1; i >= 0; i--) {
        const foundUrl = extractPublicUrlFromText(fetchedLogs[i].line);
        if (foundUrl) {
          setApps((prev) =>
            prev.map((a) =>
              a.id === app.id
                ? {
                    ...a,
                    public_url: foundUrl,
                    last_public_url: foundUrl,
                    tunnel_status: 'online',
                  }
                : a
            )
          );
          break;
        }
      }
    } catch {
      // ignora
    }
  };

  const handleDeleteApp = async (id: number) => {
    const target = apps.find((a) => a.id === id);
    if (!target) return;
    if (!window.confirm(`Deseja realmente remover "${target.name}"?`)) return;
    try {
      await api.deleteApp(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      addToast('Erro ao Remover', err.message, 'app_error');
    }
  };

  const handleToggleActive = async (app: AppTunnelItem) => {
    try {
      const updated = await api.updateApp(app.id, { is_active: !app.is_active });
      setApps((prev) => prev.map((a) => (a.id === app.id ? updated : a)));
    } catch (err: any) {
      addToast('Erro', err.message, 'app_error');
    }
  };

  const handleStartAll = async () => {
    try {
      const res = await api.startAll();
      addToast('Iniciar Todas', res.message, 'app_started');
      loadInitialData();
    } catch (err: any) {
      addToast('Erro', err.message, 'app_error');
    }
  };

  const handleStopAll = async () => {
    try {
      const res = await api.stopAll();
      addToast('Parar Todas', res.message, 'info');
      loadInitialData();
    } catch (err: any) {
      addToast('Erro', err.message, 'app_error');
    }
  };

  const handleMarkNotificationRead = async (id?: number, all = false) => {
    try {
      await api.markNotificationRead(id, all);
      const data = await api.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // ignora
    }
  };

  // Filtragem de Cards
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.public_url || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(app.local_port).includes(searchQuery);

      if (!matchesSearch) return false;

      if (filterStatus === 'running') return app.is_running;
      if (filterStatus === 'tunnel_online') return app.tunnel_status === 'online';
      if (filterStatus === 'local_only')
        return app.execution_mode === 'app_only' || app.tunnel_provider === 'none';
      if (filterStatus === 'stopped') return !app.is_running;
      if (filterStatus === 'error')
        return (
          app.last_status === 'error' ||
          app.app_status === 'error' ||
          app.tunnel_status === 'error'
        );

      return true;
    });
  }, [apps, searchQuery, filterStatus]);

  const activeLogsApp = useMemo(
    () => apps.find((a) => a.id === logsModalAppId) || null,
    [apps, logsModalAppId]
  );

  const isRunningAny = apps.some((a) => a.is_running);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col lg:flex-row">
      {/* Sidebar Desktop & Drawer Mobile */}
      <Sidebar
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        providersStatus={providersStatus}
        apps={apps}
        notifications={notifications}
        unreadCount={unreadCount}
        isRunningAny={isRunningAny}
        onOpenNewApp={() => {
          setEditingApp(null);
          setPrefillPort(null);
          setPrefillProvider(null);
          setPrefillMode(null);
          setPrefillName(null);
          setNewAppModalOpen(true);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenPortScanner={() => setPortScannerOpen(true)}
        onStartAll={handleStartAll}
        onStopAll={handleStopAll}
        onMarkNotificationRead={handleMarkNotificationRead}
        activeFilterStatus={filterStatus}
        onSelectFilterStatus={setFilterStatus}
      />

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNewApp={() => {
            setEditingApp(null);
            setPrefillPort(null);
            setNewAppModalOpen(true);
          }}
          apps={apps}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
                Central de Aplicações & Túneis Web
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Execute projetos locais e gere URLs públicas com Cloudflared ou Ngrok para acessar de qualquer computador
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setPortScannerOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-zinc-800 transition shadow-xs"
              >
                <Radar className="w-4 h-4 text-emerald-400" />
                <span>Escanear Portas Ativas</span>
              </button>

              <button
                onClick={() => {
                  setEditingApp(null);
                  setPrefillPort(null);
                  setPrefillProvider(null);
                  setPrefillMode(null);
                  setPrefillName(null);
                  setNewAppModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Aplicação / Túnel</span>
              </button>
            </div>
          </div>

          {/* Métricas */}
          <DashboardStats apps={apps} providersStatus={providersStatus} />

          {/* Barra de Busca e Atualização */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, porta, comando ou URL pública..."
                className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadInitialData}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition"
                title="Sincronizar estado"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Atualizar</span>
              </button>
            </div>
          </div>

          {/* Grid de Aplicações e Túneis */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-64 rounded-xl bg-zinc-900/40 border border-zinc-800/60 animate-pulse"
                />
              ))}
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="rounded-2xl p-10 bg-zinc-900/40 border border-zinc-800/80 text-center max-w-xl mx-auto my-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-emerald-400">
                <Globe className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-zinc-100">
                  {apps.length === 0
                    ? 'Nenhuma aplicação ou túnel cadastrado ainda'
                    : 'Nenhum resultado para o filtro selecionado'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {apps.length === 0
                    ? 'Cadastre uma aplicação local (Node.js, Python, Vite, PHP, Docker) para rodá-la diretamente por esta interface ou exponha qualquer porta local para a internet com Cloudflared Tunnel ou Ngrok.'
                    : 'Tente limpar o filtro de busca ou selecionar outra categoria no menu lateral.'}
                </p>
              </div>

              {apps.length === 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      setEditingApp(null);
                      setPrefillMode('app_and_tunnel');
                      setNewAppModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Criar App + Túnel Público
                  </button>

                  <button
                    onClick={() => setPortScannerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Expor Porta que Já Está Rodando
                  </button>

                  <button
                    onClick={() => {
                      setEditingApp(null);
                      setPrefillMode('app_only');
                      setNewAppModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
                  >
                    <Server className="w-4 h-4 text-amber-400" />
                    Rodar Apenas App Local
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApps.map((app) => (
                <AppTunnelCard
                  key={app.id}
                  app={app}
                  onStart={handleStartApp}
                  onStop={handleStopApp}
                  onRestart={handleRestartApp}
                  onStartQuickTunnel={handleStartQuickTunnel}
                  onStopTunnel={handleStopTunnel}
                  onOpenLogs={handleOpenLogs}
                  onOpenQrCode={(item) => setQrModalApp(item)}
                  onEdit={(item) => {
                    setEditingApp(item);
                    setNewAppModalOpen(true);
                  }}
                  onDelete={handleDeleteApp}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal: Nova / Editar Aplicação */}
      <NewAppModal
        isOpen={newAppModalOpen}
        onClose={() => {
          setNewAppModalOpen(false);
          setEditingApp(null);
        }}
        onSaved={loadInitialData}
        editingApp={editingApp}
        prefillPort={prefillPort}
        prefillProvider={prefillProvider}
        prefillMode={prefillMode}
        prefillName={prefillName}
        providersStatus={providersStatus}
      />

      {/* Modal: Console / Logs em Tempo Real */}
      <LogsModal
        isOpen={Boolean(logsModalAppId)}
        onClose={() => setLogsModalAppId(null)}
        app={activeLogsApp}
        liveLogs={logsModalAppId ? logsByApp[logsModalAppId] || [] : []}
        onClearLogs={(appId) =>
          setLogsByApp((prev) => ({ ...prev, [appId]: [] }))
        }
        onStartApp={handleStartApp}
        onStopApp={handleStopApp}
        onRestartApp={handleRestartApp}
      />

      {/* Modal: Scanner de Portas Ativas */}
      <ActivePortsModal
        isOpen={portScannerOpen}
        onClose={() => setPortScannerOpen(false)}
        onInstantTunnelCreated={loadInitialData}
        onQuickExposePort={(port, processName, provider, mode) => {
          setEditingApp(null);
          setPrefillPort(port);
          setPrefillName(processName);
          setPrefillProvider(provider);
          setPrefillMode(mode);
          setNewAppModalOpen(true);
        }}
      />

      {/* Modal: QR Code de Compartilhamento */}
      <QrCodeModal
        isOpen={Boolean(qrModalApp)}
        onClose={() => setQrModalApp(null)}
        app={qrModalApp}
      />

      {/* Modal: Configurações */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        providersStatus={providersStatus}
        onUpdated={(status) => setProvidersStatus(status)}
      />

      {/* Modal: Histórico de Execuções e URLs */}
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      {/* Notificações Toast */}
      <NotificationToast
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
};
