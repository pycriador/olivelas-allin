import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderPlus,
  RefreshCw,
  FolderSync,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { SyncFolder, AuthStatus, NotificationItem, SyncProgressPayload, SyncSuggestion } from './types.js';
import { api } from './lib/api.js';

import { Sidebar } from './components/Sidebar.js';
import { MobileHeader } from './components/MobileHeader.js';
import { DashboardStats } from './components/DashboardStats.js';
import { FolderCard } from './components/FolderCard.js';
import { NewFolderModal } from './components/NewFolderModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { HistoryModal } from './components/HistoryModal.js';
import { NotificationToast, ToastItem } from './components/NotificationToast.js';
import { SyncSuggestionBanner } from './components/SyncSuggestionBanner.js';

const PAGE_SIZE = 6;

export const App: React.FC = () => {
  const [folders, setFolders] = useState<SyncFolder[]>([]);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [syncProgressMap, setSyncProgressMap] = useState<Record<number, SyncProgressPayload>>({});
  const [suggestions, setSuggestions] = useState<SyncSuggestion[]>([]);

  // Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modais
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<SyncFolder | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  // Filtros & Paginação baseados na URL
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('search') || '';
  });

  const [statusFilter, setStatusFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('status') || 'all';
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  });

  // Atualizar URL query params
  const updateUrl = useCallback((search: string, status: string, page: number, replace = false) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status && status !== 'all') params.set('status', status);
    if (page > 1) params.set('page', page.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

    if (replace) {
      window.history.replaceState(null, '', newUrl);
    } else {
      window.history.pushState(null, '', newUrl);
    }
  }, []);

  // Sincronizar estado com o botão Voltar / Avançar do navegador
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get('search') || '');
      setStatusFilter(params.get('status') || 'all');
      setCurrentPage(Math.max(1, parseInt(params.get('page') || '1', 10) || 1));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    updateUrl(value, statusFilter, 1, true);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    updateUrl(searchQuery, status, 1, false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl(searchQuery, statusFilter, page, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
    updateUrl('', 'all', 1, false);
  };

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    try {
      const [foldersData, authData, notifData] = await Promise.all([
        api.getFolders(),
        api.getAuthStatus(),
        api.getNotifications(false),
      ]);
      setFolders(foldersData);
      setAuthStatus(authData);
      setNotifications(notifData.notifications);
      setUnreadCount(notifData.unreadCount);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Conectar com Server-Sent Events (SSE)
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'sync_progress') {
          const prog = payload.data as SyncProgressPayload;
          setSyncProgressMap((prev) => ({ ...prev, [prog.folderId]: prog }));
        } else if (payload.type === 'sync_status') {
          const { folderId, status, message } = payload.data;
          setFolders((prev) =>
            prev.map((f) =>
              f.id === folderId
                ? {
                    ...f,
                    last_sync_status: status,
                    last_sync_message: message,
                    is_syncing: status === 'syncing',
                  }
                : f
            )
          );

          if (status === 'success' || status === 'error') {
            setSyncProgressMap((prev) => {
              const copy = { ...prev };
              delete copy[folderId];
              return copy;
            });

            addToast({
              id: `sync_${Date.now()}`,
              title: status === 'success' ? 'Sincronização Finalizada' : 'Falha na Sincronização',
              message,
              type: status === 'success' ? 'sync_success' : 'sync_error',
              folderId,
            });

            api.getFolders().then(setFolders).catch(console.error);
          }
        } else if (payload.type === 'sync_suggested') {
          const suggestion = payload.data as SyncSuggestion;
          setSuggestions((prev) => {
            const filtered = prev.filter((s) => s.folderId !== suggestion.folderId);
            return [suggestion, ...filtered];
          });

          addToast({
            id: `suggest_${suggestion.folderId}_${Date.now()}`,
            title: suggestion.isTest ? 'Teste de Monitoramento' : 'Novos Arquivos Detectados',
            message: `${suggestion.totalCount} novo(s) arquivo(s) prontos em "${suggestion.folderName}". Clique para sincronizar agora.`,
            type: 'file_detected',
            folderId: suggestion.folderId,
          });

          api.getNotifications(false).then((res) => {
            setNotifications(res.notifications);
            setUnreadCount(res.unreadCount);
          }).catch(console.error);
        } else if (payload.type === 'sync_auto_started') {
          const { folderId, folderName, count } = payload.data;
          addToast({
            id: `auto_${Date.now()}`,
            title: 'Sincronização Automática Iniciada',
            message: `${count} arquivo(s) detectados em "${folderName}". O envio foi iniciado automaticamente.`,
            type: 'info',
            folderId,
          });
          api.getNotifications(false).then((res) => {
            setNotifications(res.notifications);
            setUnreadCount(res.unreadCount);
          }).catch(console.error);
        } else if (payload.type === 'file_detected') {
          const { folderId, folderName, fileName } = payload.data;
          addToast({
            id: `file_${Date.now()}`,
            title: 'Novo Arquivo Detectado',
            message: `"${fileName}" adicionado na pasta "${folderName}".`,
            type: 'file_detected',
            folderId,
          });
          api.getNotifications(false).then((res) => {
            setNotifications(res.notifications);
            setUnreadCount(res.unreadCount);
          }).catch(console.error);
        } else if (payload.type === 'notification') {
          api.getNotifications(false).then((res) => {
            setNotifications(res.notifications);
            setUnreadCount(res.unreadCount);
          }).catch(console.error);
        }
      } catch (err) {
        console.error('Error handling SSE event:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const addToast = (toast: ToastItem) => {
    setToasts((prev) => [toast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      dismissToast(toast.id);
    }, 7000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDismissSuggestion = (folderId: number) => {
    setSuggestions((prev) => prev.filter((s) => s.folderId !== folderId));
  };

  const handleTestWatch = async (id: number) => {
    try {
      const res = await api.testWatchFolder(id);
      addToast({
        id: `test_${Date.now()}`,
        title: 'Monitoramento Validado!',
        message: `A pasta "${res.folderName}" está sendo monitorada ativamente pelo sistema.`,
        type: 'info',
        folderId: id,
      });
    } catch (err: any) {
      alert(`Erro ao testar monitoramento: ${err.message}`);
    }
  };

  const handleSyncFolder = async (id: number) => {
    try {
      // Remover sugestão pendente para essa pasta
      setSuggestions((prev) => prev.filter((s) => s.folderId !== id));

      await api.syncFolder(id);
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_syncing: true, last_sync_status: 'syncing' } : f))
      );
    } catch (err: any) {
      alert(`Erro ao iniciar sincronização: ${err.message}`);
    }
  };

  const handleSyncAll = async () => {
    try {
      await api.syncAll();
      setFolders((prev) =>
        prev.map((f) => (f.is_active ? { ...f, is_syncing: true, last_sync_status: 'syncing' } : f))
      );
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleStopSync = async (id: number) => {
    try {
      await api.stopSync(id);
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_syncing: false, last_sync_status: 'idle', last_sync_message: 'Sincronização interrompida.' } : f))
      );
      setSyncProgressMap((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err: any) {
      alert(`Erro ao interromper sincronização: ${err.message}`);
    }
  };

  const handleStopAll = async () => {
    try {
      await api.stopAll();
      setFolders((prev) =>
        prev.map((f) => ({ ...f, is_syncing: false, last_sync_status: 'idle', last_sync_message: 'Sincronização interrompida.' }))
      );
      setSyncProgressMap({});
    } catch (err: any) {
      alert(`Erro ao interromper sincronizações: ${err.message}`);
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (!window.confirm('Tem certeza de que deseja remover esta pasta de sincronização? Os arquivos no Google Drive e no seu computador não serão apagados.')) {
      return;
    }
    try {
      await api.deleteFolder(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      alert(`Erro ao remover pasta: ${err.message}`);
    }
  };

  const handleToggleActive = async (folder: SyncFolder) => {
    try {
      const updated = await api.updateFolder(folder.id, { is_active: !folder.is_active });
      setFolders((prev) => prev.map((f) => (f.id === folder.id ? updated : f)));
    } catch (err: any) {
      alert(`Erro ao atualizar pasta: ${err.message}`);
    }
  };

  const handleMarkNotificationRead = async (id?: number, all = false) => {
    try {
      await api.markNotificationRead(id, all);
      const res = await api.getNotifications(false);
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  const isSyncingAny = folders.some((f) => f.is_syncing);

  // Filtragem de Pastas
  const filteredFolders = folders.filter((folder) => {
    if (statusFilter === 'syncing' && !folder.is_syncing) return false;
    if (statusFilter === 'active' && !folder.is_active) return false;
    if (statusFilter === 'paused' && folder.is_active) return false;
    if (statusFilter === 'error' && folder.last_sync_status !== 'error') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = folder.name.toLowerCase().includes(q);
      const matchLocal = folder.local_path.toLowerCase().includes(q);
      const matchDrive = folder.gdrive_folder_id.toLowerCase().includes(q);
      const matchMsg = (folder.last_sync_message || '').toLowerCase().includes(q);
      if (!matchName && !matchLocal && !matchDrive && !matchMsg) return false;
    }

    return true;
  });

  // Paginação
  const totalItems = filteredFolders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const paginatedFolders = filteredFolders.slice(startIndex, endIndex);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row font-sans">
      {/* 1. Header Superior para Dispositivos Mobile (< lg) */}
      <MobileHeader
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenNewFolder={() => {
          setEditingFolder(null);
          setIsFolderModalOpen(true);
        }}
        authStatus={authStatus}
        unreadCount={unreadCount}
      />

      {/* 2. Menu Lateral (Sidebar Desktop & Gaveta Mobile) */}
      <Sidebar
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        authStatus={authStatus}
        folders={folders}
        notifications={notifications}
        unreadCount={unreadCount}
        isSyncingAny={isSyncingAny}
        onOpenNewFolder={() => {
          setEditingFolder(null);
          setIsFolderModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onSyncAll={handleSyncAll}
        onStopAll={handleStopAll}
        onMarkNotificationRead={handleMarkNotificationRead}
        activeFilterStatus={statusFilter}
        onSelectFilterStatus={handleStatusFilterChange}
      />

      {/* 3. Área de Conteúdo Principal (Direita no Desktop) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5">
          {/* Banner de Aviso se Google Drive não estiver configurado */}
          {authStatus && !authStatus.isConnected && (
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-zinc-100">Google Drive não conectado</h4>
                  <p className="text-[11px] text-zinc-400">
                    Configure suas credenciais OAuth 2.0 ou Service Account no menu lateral para ativar o sincronizador.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 shadow-xs transition shrink-0 active:scale-95"
              >
                Configurar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Banner de Sugestão de Execução quando novos arquivos forem detectados */}
          <SyncSuggestionBanner
            suggestions={suggestions}
            onSyncFolder={handleSyncFolder}
            onDismiss={handleDismissSuggestion}
          />

          {/* Cards de Métricas e Status Geral */}
          <DashboardStats folders={folders} />

          {/* Seção Principal de Mapeamento com Barra de Pesquisa, Filtros e Ações */}
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-zinc-800/80">
              <div>
                <h2 className="text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
                  <FolderSync className="w-4 h-4 text-zinc-300" />
                  Pastas Sincronizadas
                </h2>
                <p className="text-xs text-zinc-400">
                  Diretórios locais monitorados e seus destinos no Google Drive
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingFolder(null);
                    setIsFolderModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 shadow-xs transition active:scale-95"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Nova Pasta</span>
                </button>
              </div>
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
              {/* Campo de Busca */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Buscar por nome, pasta local ou ID..."
                  className="w-full pl-8 pr-8 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-200 rounded transition"
                    title="Limpar busca"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filtros em Abas / Pílulas */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none text-xs">
                <button
                  onClick={() => handleStatusFilterChange('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap text-xs ${
                    statusFilter === 'all'
                      ? 'bg-zinc-100 text-zinc-950 shadow-xs'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800/80'
                  }`}
                >
                  Todas ({folders.length})
                </button>

                <button
                  onClick={() => handleStatusFilterChange('active')}
                  className={`px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap text-xs ${
                    statusFilter === 'active'
                      ? 'bg-zinc-100 text-zinc-950 shadow-xs'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800/80'
                  }`}
                >
                  Ativas ({folders.filter((f) => f.is_active).length})
                </button>

                <button
                  onClick={() => handleStatusFilterChange('syncing')}
                  className={`px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap text-xs ${
                    statusFilter === 'syncing'
                      ? 'bg-zinc-100 text-zinc-950 shadow-xs'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800/80'
                  }`}
                >
                  Sincronizando ({folders.filter((f) => f.is_syncing).length})
                </button>

                <button
                  onClick={() => handleStatusFilterChange('paused')}
                  className={`px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap text-xs ${
                    statusFilter === 'paused'
                      ? 'bg-zinc-100 text-zinc-950 shadow-xs'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800/80'
                  }`}
                >
                  Pausadas ({folders.filter((f) => !f.is_active).length})
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-medium transition whitespace-nowrap text-xs"
                    title="Limpar todos os filtros"
                  >
                    <X className="w-3 h-3" />
                    <span>Limpar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Informações sobre quantidade de itens e filtros ativos */}
            {folders.length > 0 && (
              <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                <div>
                  {hasActiveFilters ? (
                    <span>
                      Encontradas <strong className="text-zinc-200">{totalItems}</strong> de{' '}
                      <strong className="text-zinc-200">{folders.length}</strong> pastas
                    </span>
                  ) : (
                    <span>
                      Total de <strong className="text-zinc-200">{folders.length}</strong> pastas
                    </span>
                  )}
                  {totalItems > 0 && (
                    <span className="ml-2 text-zinc-400 font-mono text-[11px]">
                      (exibindo {startIndex + 1}–{endIndex})
                    </span>
                  )}
                </div>

                {totalPages > 1 && (
                  <span className="font-mono text-[11px] text-zinc-400">
                    Página {validCurrentPage} de {totalPages}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Lista de Pastas com Grid Responsivo */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <RefreshCw className="w-6 h-6 animate-spin text-zinc-400 mb-2" />
              <p className="text-xs">Carregando pastas sincronizadas...</p>
            </div>
          ) : folders.length === 0 ? (
            <div className="rounded-2xl p-10 text-center border border-zinc-800 bg-zinc-900/40 max-w-lg mx-auto my-8">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center mx-auto mb-3 border border-zinc-700/60">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-100 mb-1">Nenhuma pasta cadastrada</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                Adicione seu primeiro diretório local e vincule ao destino correspondente no Google Drive.
              </p>
              <button
                onClick={() => {
                  setEditingFolder(null);
                  setIsFolderModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 shadow-xs transition active:scale-95"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Adicionar Primeira Pasta
              </button>
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="rounded-xl p-8 text-center border border-zinc-800 bg-zinc-900/30 max-w-sm mx-auto my-6">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-2.5">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-semibold text-zinc-200 mb-0.5">Nenhuma pasta encontrada</h3>
              <p className="text-[11px] text-zinc-400 mb-3.5">
                Nenhum resultado corresponde à busca ou aos filtros aplicados.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition"
              >
                Limpar Busca e Filtros
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedFolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    progress={syncProgressMap[folder.id]}
                    onSync={handleSyncFolder}
                    onStopSync={handleStopSync}
                    onEdit={(f) => {
                      setEditingFolder(f);
                      setIsFolderModalOpen(true);
                    }}
                    onDelete={handleDeleteFolder}
                    onToggleActive={handleToggleActive}
                    onTestWatch={handleTestWatch}
                  />
                ))}
              </div>

              {/* Controles de Paginação (se houver mais de 1 página) */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 shadow-xs">
                  <div className="text-xs text-zinc-400 font-medium">
                    Mostrando <span className="text-zinc-200 font-semibold">{startIndex + 1}</span> a{' '}
                    <span className="text-zinc-200 font-semibold">{endIndex}</span> de{' '}
                    <span className="text-zinc-200 font-semibold">{totalItems}</span> pastas
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Botão Anterior */}
                    <button
                      disabled={validCurrentPage <= 1}
                      onClick={() => handlePageChange(validCurrentPage - 1)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>

                    {/* Botões Numéricos de Página */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition ${
                          pageNum === validCurrentPage
                            ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-xs'
                            : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    {/* Botão Próxima */}
                    <button
                      disabled={validCurrentPage >= totalPages}
                      onClick={() => handlePageChange(validCurrentPage + 1)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition"
                    >
                      <span className="hidden sm:inline">Próxima</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer do Conteúdo */}
        <footer className="py-4 border-t border-zinc-800/80 text-center text-[11px] text-zinc-400 mt-auto">
          <p>Olivelas GDrive Sync • Sincronização segura e profissional com Google Drive</p>
        </footer>
      </div>

      {/* Modais */}
      <NewFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSaved={loadData}
        initialFolder={editingFolder}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        authStatus={authStatus}
        onStatusUpdated={loadData}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        folders={folders}
      />

      {/* Notificações Toasts Flutuantes */}
      <NotificationToast
        toasts={toasts}
        onDismiss={dismissToast}
        onSyncFolder={handleSyncFolder}
      />
    </div>
  );
};
