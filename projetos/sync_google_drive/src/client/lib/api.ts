import { AuthStatus, SyncFolder, SyncHistoryItem, NotificationItem } from '../types.js';

const API_BASE = '/api';

export const api = {
  // Auth
  async getAuthStatus(): Promise<AuthStatus> {
    const res = await fetch(`${API_BASE}/auth/status`);
    if (!res.ok) throw new Error('Falha ao obter status de autenticação.');
    return res.json();
  },

  async configureOAuth(clientId: string, clientSecret: string): Promise<{ success: boolean; authUrl: string }> {
    const res = await fetch(`${API_BASE}/auth/oauth/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao salvar credenciais OAuth.');
    }
    return res.json();
  },

  async getOAuthUrl(): Promise<{ authUrl: string }> {
    const res = await fetch(`${API_BASE}/auth/oauth/url`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao gerar link OAuth.');
    }
    return res.json();
  },

  async configureServiceAccount(credentialsJson: string): Promise<{ success: boolean; status: AuthStatus }> {
    const res = await fetch(`${API_BASE}/auth/service-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialsJson }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao configurar Service Account.');
    }
    return res.json();
  },

  async disconnect(): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/disconnect`, { method: 'POST' });
    if (!res.ok) throw new Error('Falha ao desconectar.');
  },

  // Pastas
  async getFolders(): Promise<SyncFolder[]> {
    const res = await fetch(`${API_BASE}/folders`);
    if (!res.ok) throw new Error('Falha ao obter pastas.');
    return res.json();
  },

  async createFolder(data: Partial<SyncFolder>): Promise<SyncFolder> {
    const res = await fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao criar mapeamento.');
    }
    return res.json();
  },

  async updateFolder(id: number, data: Partial<SyncFolder>): Promise<SyncFolder> {
    const res = await fetch(`${API_BASE}/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar pasta.');
    }
    return res.json();
  },

  async deleteFolder(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/folders/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir pasta.');
  },

  async syncFolder(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/folders/${id}/sync`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao iniciar sincronização.');
    }
    return res.json();
  },

  async stopSync(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/folders/${id}/stop`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao interromper sincronização.');
    }
    return res.json();
  },

  async testWatchFolder(id: number): Promise<{ success: boolean; folderName: string; testFileName: string; watchDelaySeconds: number; isWatching: boolean }> {
    const res = await fetch(`${API_BASE}/folders/${id}/test-watch`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao testar monitoramento.');
    }
    return res.json();
  },

  async getWatchStatus(id: number): Promise<{ folderId: number; isWatching: boolean; watchDelaySeconds: number; watchAutoSync: boolean; pendingFilesCount: number; pendingFiles: string[] }> {
    const res = await fetch(`${API_BASE}/folders/${id}/watch-status`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao consultar status do monitoramento.');
    }
    return res.json();
  },

  async syncAll(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/folders/sync-all`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao iniciar sincronização de todas as pastas.');
    }
    return res.json();
  },

  async stopAll(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/folders/stop-all`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao interromper todas as sincronizações.');
    }
    return res.json();
  },

  // Histórico
  async getHistory(page = 1, limit = 30, folderId?: number, status?: string): Promise<{
    items: SyncHistoryItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(folderId ? { folderId: folderId.toString() } : {}),
      ...(status ? { status } : {}),
    });

    const res = await fetch(`${API_BASE}/history?${params}`);
    if (!res.ok) throw new Error('Falha ao obter histórico.');
    return res.json();
  },

  async clearHistory(folderId?: number): Promise<void> {
    const url = folderId ? `${API_BASE}/history?folderId=${folderId}` : `${API_BASE}/history`;
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

  async clearNotifications(): Promise<void> {
    const res = await fetch(`${API_BASE}/notifications`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao limpar notificações.');
  },

  // Sistema / Navegador de arquivos
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
      throw new Error(err.error || 'Falha ao navegar no diretório local.');
    }
    return res.json();
  },

  async browseGDrive(parentId = 'root'): Promise<{
    currentId: string;
    currentName: string;
    folders: Array<{ id: string; name: string }>;
  }> {
    const res = await fetch(`${API_BASE}/system/gdrive-folders?parentId=${encodeURIComponent(parentId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar pastas do Google Drive.');
    }
    return res.json();
  },
};
