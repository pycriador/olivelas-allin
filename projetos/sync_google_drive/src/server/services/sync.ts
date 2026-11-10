import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { GDriveService } from './gdrive.js';
import { events } from './events.js';

interface SyncStats {
  totalFiles: number;
  uploadedFiles: number;
  skippedFiles: number;
  failedFiles: number;
  bytesUploaded: number;
}

export class SyncEngine {
  private static activeSyncs = new Set<number>();
  private static cancelRequests = new Set<number>();

  public static isSyncing(folderId: number): boolean {
    return this.activeSyncs.has(folderId);
  }

  public static stopSync(folderId: number): boolean {
    if (this.activeSyncs.has(folderId)) {
      this.cancelRequests.add(folderId);
      const cancelMsg = 'Sincronização interrompida pelo usuário.';
      this.updateFolderStatus(folderId, 'idle', cancelMsg);
      events.emit('sync_status', {
        folderId,
        status: 'idle',
        message: cancelMsg,
      });
      return true;
    }
    return false;
  }

  public static stopAll(): void {
    for (const folderId of Array.from(this.activeSyncs)) {
      this.stopSync(folderId);
    }
  }

  public static async syncFolder(folderId: number): Promise<{ success: boolean; message: string; stats?: SyncStats }> {
    if (this.activeSyncs.has(folderId)) {
      return { success: false, message: 'Esta pasta já está em processo de sincronização.' };
    }

    const folder = db.prepare('SELECT * FROM sync_folders WHERE id = ?').get(folderId) as any;
    if (!folder) {
      return { success: false, message: 'Mapeamento de pasta não encontrado.' };
    }

    if (!fs.existsSync(folder.local_path)) {
      const errMsg = `Diretório local não encontrado: ${folder.local_path}`;
      this.updateFolderStatus(folderId, 'error', errMsg);
      return { success: false, message: errMsg };
    }

    this.activeSyncs.add(folderId);
    this.updateFolderStatus(folderId, 'syncing', 'Iniciando sincronização...');
    events.emit('sync_status', { folderId, status: 'syncing', message: 'Iniciando sincronização...' });

    const stats: SyncStats = {
      totalFiles: 0,
      uploadedFiles: 0,
      skippedFiles: 0,
      failedFiles: 0,
      bytesUploaded: 0,
    };

    try {
      // 1. Obter lista de arquivos locais recursivamente
      const extensions = folder.file_extensions
        ? folder.file_extensions.split(',').map((ext: string) => ext.trim().toLowerCase()).filter(Boolean)
        : [];

      const localFiles = this.scanLocalFiles(folder.local_path, folder.local_path, extensions);
      stats.totalFiles = localFiles.length;

      events.emit('sync_progress', {
        folderId,
        current: 0,
        total: stats.totalFiles,
        percent: 0,
        currentFile: 'Varredura concluída. Verificando arquivos...',
      });

      // Cache de pastas remotas criadas: relativeFolderPath -> remoteFolderId
      const remoteFolderCache = new Map<string, string>();
      remoteFolderCache.set('', folder.gdrive_folder_id);

      for (let i = 0; i < localFiles.length; i++) {
        // Verificar se o usuário solicitou cancelamento
        if (this.cancelRequests.has(folderId)) {
          const cancelMsg = `Sincronização interrompida pelo usuário (${stats.uploadedFiles} arquivos enviados).`;
          console.log(`⏹️ [SyncEngine] ${cancelMsg}`);
          this.updateFolderStatus(folderId, 'idle', cancelMsg);
          this.createNotification(folderId, 'Sincronização Cancelada', cancelMsg, 'info');
          events.emit('sync_status', {
            folderId,
            status: 'idle',
            message: cancelMsg,
          });
          return { success: false, message: cancelMsg, stats };
        }

        const file = localFiles[i];
        const progressPercent = Math.round(((i + 1) / stats.totalFiles) * 100);

        events.emit('sync_progress', {
          folderId,
          current: i + 1,
          total: stats.totalFiles,
          percent: progressPercent,
          currentFile: file.relativePath,
        });

        try {
          // Determinar / Criar pasta de destino no Google Drive
          const targetRemoteFolderId = await this.ensureRemoteDirectory(
            folder.gdrive_folder_id,
            file.relativeDir,
            remoteFolderCache
          );

          // Verificar se arquivo já existe no histórico com mesmo tamanho e MD5
          const fileMd5 = await GDriveService.calculateFileMd5(file.fullPath);
          const historyRecord = db.prepare(
            'SELECT * FROM sync_history WHERE folder_id = ? AND relative_path = ? ORDER BY id DESC LIMIT 1'
          ).get(folderId, file.relativePath) as any;

          let shouldUpload = true;

          if (historyRecord && historyRecord.status === 'synced' && historyRecord.file_size === file.size && historyRecord.file_hash === fileMd5) {
            shouldUpload = false;
          } else {
            // Verificar diretamente no Google Drive se já existe
            const existingDriveFile = await GDriveService.getFileInFolder(targetRemoteFolderId, file.name);
            if (existingDriveFile && (existingDriveFile.md5Checksum === fileMd5 || Number(existingDriveFile.size) === file.size)) {
              shouldUpload = false;
              // Salvar no histórico como já sincronizado
              this.recordHistory(folderId, file, fileMd5, existingDriveFile.id, 'synced');
            }
          }

          if (!shouldUpload) {
            stats.skippedFiles++;
            continue;
          }

          // Fazer upload
          const uploadedFile = await GDriveService.uploadFile(targetRemoteFolderId, file.fullPath, file.name);
          stats.uploadedFiles++;
          stats.bytesUploaded += file.size;

          this.recordHistory(folderId, file, fileMd5, uploadedFile.id, 'synced');
        } catch (fileErr: any) {
          console.error(`Erro ao sincronizar arquivo ${file.relativePath}:`, fileErr);
          stats.failedFiles++;
          
          let cleanMessage = fileErr.message || 'Erro desconhecido';
          if (cleanMessage.includes('Service Accounts do not have storage quota')) {
            cleanMessage = 'Contas de Serviço têm cota 0 para contas pessoais do Google Drive (@gmail.com). Use OAuth 2.0 nas Configurações para sincronizar com sua conta.';
          } else if (cleanMessage.includes('invalid_grant') || fileErr?.response?.data?.error === 'invalid_grant' || cleanMessage.includes('expired or revoked')) {
            cleanMessage = 'A autenticação com o Google expirou ou foi revogada. Por favor, reconecte sua conta do Google nas Configurações.';
          }

          this.recordHistory(folderId, file, '', null, 'failed', cleanMessage);
        }
      }

      let successMsg = `Sincronização concluída: ${stats.uploadedFiles} enviados, ${stats.skippedFiles} já atualizados, ${stats.failedFiles} falhas.`;
      if (stats.failedFiles > 0 && stats.uploadedFiles === 0) {
        const lastErr = db.prepare('SELECT error_message FROM sync_history WHERE folder_id = ? AND status = ? ORDER BY id DESC LIMIT 1').get(folderId, 'failed') as any;
        if (lastErr?.error_message?.includes('Contas de Serviço têm cota 0')) {
          successMsg = 'Erro: Contas de Serviço (Service Account) não têm cota de armazenamento no Google Drive para contas pessoais. Conecte via OAuth 2.0 nas Configurações.';
        } else if (lastErr?.error_message?.includes('autenticação com o Google expirou') || lastErr?.error_message?.includes('invalid_grant')) {
          successMsg = 'Erro de Autenticação: Sua sessão do Google Drive expirou ou o token foi revogado. Acesse as Configurações e reconecte sua conta.';
        }
      }

      this.updateFolderStatus(folderId, stats.failedFiles > 0 ? 'error' : 'success', successMsg, true);

      // Notificação
      this.createNotification(
        folderId,
        stats.failedFiles > 0 ? 'Falha na Sincronização' : 'Sincronização Concluída',
        successMsg,
        stats.failedFiles > 0 ? 'sync_error' : 'sync_success'
      );

      events.emit('sync_status', {
        folderId,
        status: stats.failedFiles > 0 ? 'error' : 'success',
        message: successMsg,
        stats,
      });

      return { success: stats.failedFiles === 0, message: successMsg, stats };
    } catch (err: any) {
      console.error(`Falha geral na sincronização da pasta ${folderId}:`, err);
      let errMsg = `Erro na sincronização: ${err.message}`;
      if (err.message?.includes('Service Accounts do not have storage quota')) {
        errMsg = 'Contas de Serviço não possuem cota de armazenamento no Google Drive pessoal (@gmail.com). Alterne para OAuth 2.0 nas Configurações para sincronizar seus arquivos.';
      }
      this.updateFolderStatus(folderId, 'error', errMsg);

      this.createNotification(
        folderId,
        'Falha na Sincronização',
        errMsg,
        'sync_error'
      );

      events.emit('sync_status', { folderId, status: 'error', message: errMsg });
      return { success: false, message: errMsg };
    } finally {
      this.activeSyncs.delete(folderId);
      this.cancelRequests.delete(folderId);
    }
  }

  public static async syncAll(): Promise<void> {
    const folders = db.prepare('SELECT id FROM sync_folders WHERE is_active = 1').all() as { id: number }[];
    for (const f of folders) {
      await this.syncFolder(f.id);
    }
  }

  private static scanLocalFiles(baseDir: string, currentDir: string, extensions: string[]): Array<{
    fullPath: string;
    relativePath: string;
    relativeDir: string;
    name: string;
    size: number;
  }> {
    const results: Array<{
      fullPath: string;
      relativePath: string;
      relativeDir: string;
      name: string;
      size: number;
    }> = [];

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.scanLocalFiles(baseDir, fullPath, extensions));
      } else if (entry.isFile()) {
        if (extensions.length > 0) {
          const ext = path.extname(entry.name).toLowerCase();
          if (!extensions.includes(ext)) continue;
        }

        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        const relativeDir = path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath);
        const stats = fs.statSync(fullPath);

        results.push({
          fullPath,
          relativePath,
          relativeDir,
          name: entry.name,
          size: stats.size,
        });
      }
    }

    return results;
  }

  private static async ensureRemoteDirectory(
    rootFolderId: string,
    relativeDir: string,
    cache: Map<string, string>
  ): Promise<string> {
    if (!relativeDir || relativeDir === '.') {
      return rootFolderId;
    }

    if (cache.has(relativeDir)) {
      return cache.get(relativeDir)!;
    }

    const segments = relativeDir.split('/');
    let currentParentId = rootFolderId;
    let accumulatedPath = '';

    for (const segment of segments) {
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${segment}` : segment;
      if (cache.has(accumulatedPath)) {
        currentParentId = cache.get(accumulatedPath)!;
      } else {
        const newFolderId = await GDriveService.findOrCreateFolder(currentParentId, segment);
        cache.set(accumulatedPath, newFolderId);
        currentParentId = newFolderId;
      }
    }

    return currentParentId;
  }

  private static updateFolderStatus(folderId: number, status: string, message: string, updateLastSynced = false) {
    if (updateLastSynced) {
      db.prepare(`
        UPDATE sync_folders 
        SET last_sync_status = ?, last_sync_message = ?, last_synced_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(status, message, folderId);
    } else {
      db.prepare(`
        UPDATE sync_folders 
        SET last_sync_status = ?, last_sync_message = ? 
        WHERE id = ?
      `).run(status, message, folderId);
    }
  }

  private static recordHistory(
    folderId: number,
    file: { fullPath: string; relativePath: string; name: string; size: number },
    hash: string,
    gdriveId: string | null | undefined,
    status: 'synced' | 'failed' | 'skipped',
    errorMessage: string | null = null
  ) {
    db.prepare(`
      INSERT INTO sync_history (
        folder_id, local_file_path, relative_path, file_name, file_size, file_hash, gdrive_file_id, status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      folderId,
      file.fullPath,
      file.relativePath,
      file.name,
      file.size,
      hash,
      gdriveId || null,
      status,
      errorMessage
    );
  }

  public static createNotification(folderId: number | null, title: string, message: string, type: string) {
    const res = db.prepare(`
      INSERT INTO notifications (folder_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(folderId, title, message, type);

    events.emit('notification', {
      id: res.lastInsertRowid,
      folderId,
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
    });
  }
}
