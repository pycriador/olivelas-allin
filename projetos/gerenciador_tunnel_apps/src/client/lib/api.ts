import {
  AppTunnelItem,
  ProvidersStatus,
  RunHistoryItem,
  NotificationItem,
  LogEntry,
  ActivePortItem,
  ProjectInspection,
} from '../types.js';

const API_BASE = '/api';

export const api = {
  // Configurações e Status dos Provedores (Cloudflared, Ngrok, LAN IP)
  async getProvidersStatus(): Promise<ProvidersStatus> {
    const res = await fetch(`${API_BASE}/settings/status`);
    if (!res.ok) throw new Error('Falha ao obter status dos provedores.');
    return res.json();
  },

  async saveSettings(data: {
    defaultProvider?: string;
    ngrokAuthtoken?: string;
    ngrokDomain?: string;
    cloudflaredToken?: string;
    cloudflaredProtocol?: string;
    clearNgrokToken?: boolean;
    clearCloudflaredToken?: boolean;
  }): Promise<{ success: boolean; status: ProvidersStatus }> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao salvar configurações.');
    }
    return res.json();
  },

  // Aplicações & Túneis
  async getApps(): Promise<AppTunnelItem[]> {
    const res = await fetch(`${API_BASE}/apps`);
    if (!res.ok) throw new Error('Falha ao listar aplicações.');
    return res.json();
  },

  async createApp(data: Record<string, any>): Promise<AppTunnelItem> {
    const res = await fetch(`${API_BASE}/apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao cadastrar aplicação.');
    }
    return res.json();
  },

  async updateApp(id: number, data: Record<string, any>): Promise<AppTunnelItem> {
    const res = await fetch(`${API_BASE}/apps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar aplicação.');
    }
    return res.json();
  },

  async deleteApp(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/apps/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao remover aplicação.');
  },

  async startApp(id: number): Promise<{ success: boolean; app: AppTunnelItem }> {
    const res = await fetch(`${API_BASE}/apps/${id}/start`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao iniciar aplicação.');
    }
    return res.json();
  },

  async stopApp(id: number): Promise<{ success: boolean; app: AppTunnelItem }> {
    const res = await fetch(`${API_BASE}/apps/${id}/stop`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao parar aplicação.');
    }
    return res.json();
  },

  async restartApp(id: number): Promise<{ success: boolean; app: AppTunnelItem }> {
    const res = await fetch(`${API_BASE}/apps/${id}/restart`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao reiniciar aplicação.');
    }
    return res.json();
  },

  async startTunnelForApp(
    id: number,
    provider?: string,
    port?: number
  ): Promise<{ success: boolean; app: AppTunnelItem }> {
    const res = await fetch(`${API_BASE}/apps/${id}/tunnel/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, port }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao iniciar túnel.');
    }
    return res.json();
  },

  async stopTunnelForApp(id: number): Promise<{ success: boolean; app: AppTunnelItem }> {
    const res = await fetch(`${API_BASE}/apps/${id}/tunnel/stop`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao encerrar túnel.');
    }
    return res.json();
  },

  async getAppLogs(id: number): Promise<{ logs: LogEntry[] }> {
    const res = await fetch(`${API_BASE}/apps/${id}/logs`);
    if (!res.ok) throw new Error('Falha ao obter logs.');
    return res.json();
  },

  async clearAppLogs(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/apps/${id}/logs`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao limpar logs.');
  },

  async startAll(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/apps/start-all`, { method: 'POST' });
    if (!res.ok) throw new Error('Falha ao iniciar todas as aplicações.');
    return res.json();
  },

  async stopAll(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/apps/stop-all`, { method: 'POST' });
    if (!res.ok) throw new Error('Falha ao parar todas as aplicações.');
    return res.json();
  },

  // Histórico
  async getHistory(
    page = 1,
    limit = 25,
    appId?: number,
    status?: string
  ): Promise<{
    items: RunHistoryItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(appId ? { appId: appId.toString() } : {}),
      ...(status ? { status } : {}),
    });
    const res = await fetch(`${API_BASE}/history?${params}`);
    if (!res.ok) throw new Error('Falha ao carregar histórico.');
    return res.json();
  },

  async clearHistory(appId?: number): Promise<void> {
    const url = appId ? `${API_BASE}/history?appId=${appId}` : `${API_BASE}/history`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao limpar histórico.');
  },

  // Notificações
  async getNotifications(unreadOnly = false): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const res = await fetch(`${API_BASE}/notifications?unread=${unreadOnly}`);
    if (!res.ok) throw new Error('Falha ao obter notificações.');
    return res.json();
  },

  async markNotificationRead(id?: number, all = false): Promise<void> {
    const res = await fetch(`${API_BASE}/notifications/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, all }),
    });
    if (!res.ok) throw new Error('Falha ao marcar notificação.');
  },

  // Sistema / Diretórios / Portas
  async browseLocal(path = ''): Promise<{
    currentPath: string;
    parentPath: string | null;
    drives?: Array<{ name: string; path: string; isDirectory: boolean }>;
    shortcuts?: Array<{ name: string; path: string }>;
    items: Array<{ name: string; path: string; isDirectory: boolean }>;
  }> {
    const res = await fetch(`${API_BASE}/system/browse?path=${encodeURIComponent(path)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao explorar diretório.');
    }
    return res.json();
  },

  async inspectProject(path: string): Promise<ProjectInspection> {
    const res = await fetch(`${API_BASE}/system/inspect-project?path=${encodeURIComponent(path)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao inspecionar projeto.');
    }
    return res.json();
  },

  async getActivePorts(): Promise<{ ports: ActivePortItem[] }> {
    const res = await fetch(`${API_BASE}/system/active-ports`);
    if (!res.ok) throw new Error('Falha ao escanear portas ativas.');
    return res.json();
  },
};
