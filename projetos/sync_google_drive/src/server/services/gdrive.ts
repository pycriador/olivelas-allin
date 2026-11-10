import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { encryptData, decryptData } from './crypto.js';

export interface GDriveAuthInfo {
  mode: 'oauth' | 'service_account';
  isConnected: boolean;
  email?: string;
  name?: string;
  apiDisabled?: boolean;
  errorMessage?: string;
  enableUrl?: string;
  storageQuota?: {
    limit: string;
    usage: string;
    usageInDrive: string;
  };
}

export class GDriveService {
  private static oauth2Client: any = null;

  public static getOAuth2Client(clientId?: string, clientSecret?: string, redirectUri?: string) {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    const cid = clientId || (settings?.oauth_client_id ? decryptData(settings.oauth_client_id) : '');
    const csecret = clientSecret || (settings?.oauth_client_secret ? decryptData(settings.oauth_client_secret) : '');
    const ruri = redirectUri || 'http://localhost:3001/api/auth/google/callback';

    const client = new google.auth.OAuth2(cid, csecret, ruri);

    if (!clientId && settings?.oauth_tokens) {
      try {
        const decryptedTokens = decryptData(settings.oauth_tokens);
        const tokens = JSON.parse(decryptedTokens);
        client.setCredentials(tokens);

        // Se tokens forem atualizados automaticamente, salvar no SQLite
        client.on('tokens', (newTokens: any) => {
          const mergedTokens = { ...tokens, ...newTokens };
          db.prepare('UPDATE settings SET oauth_tokens = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
            .run(encryptData(JSON.stringify(mergedTokens)));
        });
      } catch (err) {
        console.error('Failed to parse saved OAuth tokens:', err);
      }
    }

    return client;
  }

  public static async getAuthClient() {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    if (!settings) {
      throw new Error('Configurações não encontradas.');
    }

    if (settings.auth_mode === 'service_account' && settings.service_account_json) {
      const decrypted = decryptData(settings.service_account_json);
      const credentials = JSON.parse(decrypted);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      return await auth.getClient();
    } else {
      const client = this.getOAuth2Client();
      return client;
    }
  }

  public static async getDriveClient() {
    const auth = await this.getAuthClient();
    return google.drive({ version: 'v3', auth: auth as any });
  }

  public static async getStatus(): Promise<GDriveAuthInfo> {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    if (!settings) {
      return { mode: 'oauth', isConnected: false };
    }

    const hasTokens = (settings.auth_mode === 'oauth' && !!settings.oauth_tokens) ||
                      (settings.auth_mode === 'service_account' && !!settings.service_account_json);

    if (!hasTokens) {
      return { mode: settings.auth_mode || 'oauth', isConnected: false };
    }

    try {
      const drive = await this.getDriveClient();
      const about = await drive.about.get({
        fields: 'user, storageQuota',
      });

      return {
        mode: settings.auth_mode as 'oauth' | 'service_account',
        isConnected: true,
        email: about.data.user?.emailAddress || settings.oauth_user_email || 'Conta Conectada',
        name: about.data.user?.displayName || settings.oauth_user_name || 'Google Drive',
        storageQuota: about.data.storageQuota as any,
      };
    } catch (err: any) {
      console.error('Error fetching GDrive about status:', err.message);
      const isApiDisabled = err.message?.includes('Google Drive API has not been used') ||
                            err.message?.includes('disabled') ||
                            err.status === 'PERMISSION_DENIED';
      const isAuthExpired = err.message?.includes('invalid_grant') ||
                            err.message?.includes('expired') ||
                            err.message?.includes('revoked');

      // Extrair URL do link do erro se disponível
      const urlMatch = err.message?.match(/https:\/\/console\.[^\s]+/);
      const enableUrl = urlMatch ? urlMatch[0] : 'https://console.cloud.google.com/apis/library/drive.googleapis.com';

      return {
        mode: settings.auth_mode || 'oauth',
        isConnected: !isApiDisabled && !isAuthExpired && !!settings.oauth_user_email,
        email: settings.oauth_user_email,
        name: settings.oauth_user_name,
        apiDisabled: isApiDisabled,
        errorMessage: isApiDisabled
          ? 'A Google Drive API não está ativada no seu projeto do Google Cloud. Clique no botão abaixo para ativar com 1 clique.'
          : isAuthExpired
          ? 'Sua sessão do Google Drive expirou ou foi revogada. Por favor, reconecte sua conta nas Configurações.'
          : err.message,
        enableUrl,
      };
    }
  }

  public static async getFolderInfo(folderId: string) {
    const drive = await this.getDriveClient();
    try {
      if (folderId === 'root') {
        return { id: 'root', name: 'Meu Drive (Raiz)' };
      }
      const res = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType, trashed',
        supportsAllDrives: true,
      });

      if (res.data.trashed) {
        throw new Error('A pasta especificada está na lixeira.');
      }
      if (res.data.mimeType !== 'application/vnd.google-apps.folder') {
        throw new Error('O ID informado não pertence a uma pasta do Google Drive.');
      }

      return res.data;
    } catch (err: any) {
      throw new Error(`Não foi possível acessar a pasta (${folderId}): ${err.message}`);
    }
  }

  public static async listSubfolders(folderId: string = 'root') {
    const drive = await this.getDriveClient();
    const q = `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const res = await drive.files.list({
      q,
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'name',
      pageSize: 50,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    return res.data.files || [];
  }

  public static async findOrCreateFolder(parentFolderId: string, folderName: string): Promise<string> {
    const drive = await this.getDriveClient();
    // Sanitizar nome para consulta segura
    const sanitizedName = folderName.replace(/'/g, "\\'");
    const q = `'${parentFolderId}' in parents and name = '${sanitizedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    
    const existing = await drive.files.list({
      q,
      fields: 'files(id, name)',
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (existing.data.files && existing.data.files.length > 0) {
      return existing.data.files[0].id!;
    }

    // Criar se não existir
    const created = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    return created.data.id!;
  }

  public static async getFileInFolder(parentFolderId: string, fileName: string) {
    const drive = await this.getDriveClient();
    const sanitizedName = fileName.replace(/'/g, "\\'");
    const q = `'${parentFolderId}' in parents and name = '${sanitizedName}' and trashed = false`;
    
    const res = await drive.files.list({
      q,
      fields: 'files(id, name, size, md5Checksum, modifiedTime)',
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0];
    }
    return null;
  }

  public static calculateFileMd5(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }

  public static async uploadFile(
    parentFolderId: string,
    localFilePath: string,
    fileName: string
  ) {
    const drive = await this.getDriveClient();
    const mime = this.getMimeType(fileName);

    const media = {
      mimeType: mime,
      body: fs.createReadStream(localFilePath),
    };

    const res = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [parentFolderId],
      },
      media,
      fields: 'id, name, size, md5Checksum, webViewLink',
      supportsAllDrives: true,
    });

    return res.data;
  }

  private static getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.heic': 'image/heic',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
    };
    return mimeMap[ext] || 'application/octet-stream';
  }
}
