import type { User, UserCredentialsStatus, UserProjectSummary, DashboardBackupJSON } from '../../types/auth';
import type { Survey, AnalysisDisplaySettings } from '../../types/survey';

const TOKEN_KEY = 'ai_survey_auth_token';

export class AuthService {
  public static getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public static setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.warn('Could not save auth token:', e);
    }
  }

  public static removeToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.warn('Could not remove auth token:', e);
    }
  }

  private static getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  public static async register(
    email: string,
    password: string,
    name?: string
  ): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao registrar usuário.');
    }
    this.setToken(data.token);
    return data;
  }

  public static async login(
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'E-mail ou senha incorretos.');
    }
    this.setToken(data.token);
    return data;
  }

  public static async getMe(): Promise<{ user: User; googleConfigured: boolean; googleClientEmail?: string }> {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Sessão expirada.');
    }
    return data;
  }

  public static async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch {
      // Ignore network failure on logout
    } finally {
      this.removeToken();
    }
  }

  public static async getCredentialsStatus(): Promise<UserCredentialsStatus> {
    const res = await fetch('/api/auth/credentials', {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao obter status de credenciais.');
    }
    return data;
  }

  public static async saveCredentials(payload: {
    serviceAccountJson?: string;
    clientEmail?: string;
    privateKey?: string;
    projectId?: string;
    googleApiKey?: string;
    geminiApiKey?: string;
  }): Promise<{ success: boolean; message: string; googleConfigured: boolean }> {
    const res = await fetch('/api/auth/credentials', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao salvar credenciais.');
    }
    return data;
  }

  // ============================================
  // PROJECTS API
  // ============================================

  public static async getProjects(): Promise<UserProjectSummary[]> {
    const res = await fetch('/api/projects', {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao carregar projetos.');
    }
    return data.projects || [];
  }

  public static async getProject(projectId: string): Promise<{ project: { id: string; name: string; survey: Survey; displaySettings?: AnalysisDisplaySettings } }> {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao carregar projeto.');
    }
    return data;
  }

  public static async saveProject(payload: {
    id?: string;
    name?: string;
    description?: string;
    survey: Survey;
    displaySettings?: AnalysisDisplaySettings;
  }): Promise<{ success: boolean; project: any }> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao salvar projeto.');
    }
    return data;
  }

  public static async deleteProject(projectId: string): Promise<boolean> {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao excluir projeto.');
    }
    return data.success;
  }

  // ============================================
  // BACKUP EXPORT & IMPORT (NO SECRETS)
  // ============================================

  public static async exportProjectBackup(projectId: string): Promise<DashboardBackupJSON> {
    const res = await fetch(`/api/projects/${projectId}/export`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao gerar backup do projeto.');
    }
    return data;
  }

  public static async importProjectBackup(backupData: DashboardBackupJSON): Promise<{ success: boolean; project: any }> {
    const res = await fetch('/api/projects/import', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(backupData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao importar arquivo de backup.');
    }
    return data;
  }

  public static async getDefaultPublicSurvey(refresh?: boolean): Promise<{
    survey: Survey;
    isReadOnly: boolean;
    isDefaultPublic: boolean;
    sourceName?: string;
  }> {
    const url = refresh ? '/api/public/default-survey?refresh=true' : '/api/public/default-survey';
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Não foi possível carregar a pesquisa do Google Drive.');
    }
    return data;
  }

  /**
   * Helper to trigger direct browser file download for a backup JSON object
   */
  public static triggerDownloadBackup(backup: DashboardBackupJSON, filename?: string): void {
    const cleanFilename =
      filename ||
      `backup_${backup.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
