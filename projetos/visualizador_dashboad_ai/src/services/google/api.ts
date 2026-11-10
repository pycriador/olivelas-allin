import type {
  GoogleAuthStatus,
  GoogleDriveFileItem,
  SpreadsheetData,
  SpreadsheetMetadata,
} from '../../types/spreadsheet';
import type { Survey } from '../../types/survey';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('ai_survey_auth_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Client-side API Service for interacting with server-side Google endpoints
 * NEVER accesses Google APIs or credentials directly from the client.
 */
export class GoogleApiService {
  /**
   * Checks whether Google credentials are configured on the server
   */
  public static async checkStatus(): Promise<GoogleAuthStatus> {
    try {
      const res = await fetch('/api/google/status', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      return {
        configured: false,
        error: err.message || 'Falha ao conectar com a API do servidor.',
      };
    }
  }

  /**
   * Fetches the list of spreadsheets and analysis files from Google Drive
   */
  public static async listFiles(search?: string): Promise<GoogleDriveFileItem[]> {
    const url = new URL('/api/google/drive/files', window.location.origin);
    if (search && search.trim()) {
      url.searchParams.set('q', search.trim());
    }

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.details || data.error || 'Erro ao carregar arquivos do Google Drive.');
    }

    return data.files || [];
  }

  /**
   * Retrieves spreadsheet metadata and available tabs/sheets
   */
  public static async getSpreadsheetMetadata(fileId: string): Promise<SpreadsheetMetadata> {
    const res = await fetch(`/api/google/sheets/${encodeURIComponent(fileId)}/metadata`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.details || data.error || 'Erro ao obter metadados da planilha.');
    }

    return data;
  }

  /**
   * Fetches row data for a specific spreadsheet file and tab
   */
  public static async getSpreadsheetData(
    fileId: string,
    sheetName?: string
  ): Promise<SpreadsheetData> {
    const url = new URL(`/api/google/sheets/${encodeURIComponent(fileId)}`, window.location.origin);
    if (sheetName) {
      url.searchParams.set('sheet', sheetName);
    }

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.details || data.error || 'Erro ao carregar dados da planilha.');
    }

    return data;
  }

  /**
   * Validates and parses a Google Forms URL or Form ID on the server
   */
  public static async parseFormUrl(url: string): Promise<{ isValid: boolean; formId?: string; error?: string }> {
    try {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      const res = await fetch('/api/google/forms/parse-url', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        isValid: false,
        error: err.message || 'Erro ao validar link do Google Forms.',
      };
    }
  }

  /**
   * Fetches a Google Form structure and responses, returning a normalized Survey domain model
   */
  public static async getGoogleFormData(formId: string): Promise<Survey> {
    const res = await fetch(`/api/google/forms/${encodeURIComponent(formId)}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.details || data.error || 'Erro ao carregar dados do Google Forms.');
    }

    return data;
  }
}
