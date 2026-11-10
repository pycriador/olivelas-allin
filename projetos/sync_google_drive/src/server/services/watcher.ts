import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import fs from 'fs';
import { db } from '../db/index.js';
import { events } from './events.js';
import { SyncEngine } from './sync.js';

interface WatchedFolder {
  id: number;
  name: string;
  localPath: string;
  fileExtensions: string[];
  watchDelaySeconds: number;
  watchAutoSync: boolean;
}

interface PendingBatch {
  folderId: number;
  folderName: string;
  files: Set<string>;
  timer: NodeJS.Timeout;
  firstDetectedAt: Date;
}

export class FolderWatcherService {
  private static watchers: Map<number, FSWatcher> = new Map();
  private static watchedFolderConfigs: Map<number, WatchedFolder> = new Map();
  private static pendingBatches: Map<number, PendingBatch> = new Map();

  public static init() {
    this.refreshWatchers();
  }

  public static refreshWatchers() {
    // Parar todos os watchers e timers existentes
    for (const [id, watcher] of this.watchers.entries()) {
      watcher.close();
    }
    this.watchers.clear();

    for (const batch of this.pendingBatches.values()) {
      clearTimeout(batch.timer);
    }
    this.pendingBatches.clear();
    this.watchedFolderConfigs.clear();

    // Buscar pastas ativas com watch_enabled = 1
    const folders = db.prepare(`
      SELECT id, name, local_path, file_extensions, watch_delay_seconds, watch_auto_sync
      FROM sync_folders 
      WHERE is_active = 1 AND watch_enabled = 1
    `).all() as any[];

    for (const folder of folders) {
      this.watchFolder({
        id: folder.id,
        name: folder.name,
        localPath: folder.local_path,
        fileExtensions: folder.file_extensions
          ? folder.file_extensions.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean)
          : [],
        watchDelaySeconds: Math.max(2, Number(folder.watch_delay_seconds) || 10),
        watchAutoSync: Boolean(folder.watch_auto_sync),
      });
    }

    console.log(`👀 File Watcher monitorando ${this.watchers.size} pasta(s) ativas.`);
  }

  public static watchFolder(folder: WatchedFolder) {
    if (!fs.existsSync(folder.localPath)) {
      console.warn(`[Watcher] Diretório local não existe: ${folder.localPath}`);
      return;
    }

    // Fechar se já existia
    if (this.watchers.has(folder.id)) {
      this.watchers.get(folder.id)!.close();
    }

    this.watchedFolderConfigs.set(folder.id, folder);

    // Configurar chokidar com estabilidade e polling adequado
    const watcher = chokidar.watch(folder.localPath, {
      ignored: /(^|[\/\\])\../, // ignorar arquivos/pastas ocultos
      persistent: true,
      ignoreInitial: true, // não disparar para arquivos já existentes no boot
      awaitWriteFinish: {
        stabilityThreshold: Math.min(2000, folder.watchDelaySeconds * 500),
        pollInterval: 250,
      },
    });

    const handleFileEvent = (eventType: 'add' | 'change', filePath: string) => {
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();

      // Checar extensões se configuradas
      if (folder.fileExtensions.length > 0 && !folder.fileExtensions.includes(ext)) {
        return;
      }

      // Se a pasta já está no meio de uma sincronização ativa, não enfileirar duplicado
      if (SyncEngine.isSyncing(folder.id)) {
        return;
      }

      console.log(`📁 Arquivo detectado [${eventType}] na pasta [${folder.name}]: ${fileName}`);

      this.enqueueDetectedFile(folder, fileName);
    };

    watcher.on('add', (filePath: string) => handleFileEvent('add', filePath));
    watcher.on('change', (filePath: string) => handleFileEvent('change', filePath));

    watcher.on('error', (err) => {
      console.error(`[Watcher Error] Pasta ${folder.name} (${folder.id}):`, err);
    });

    this.watchers.set(folder.id, watcher);
  }

  private static enqueueDetectedFile(folder: WatchedFolder, fileName: string) {
    let batch = this.pendingBatches.get(folder.id);

    if (batch) {
      batch.files.add(fileName);
      // Reiniciar o timer com o tempo configurado (debounce para agrupar arquivos sendo copiados)
      clearTimeout(batch.timer);
    } else {
      batch = {
        folderId: folder.id,
        folderName: folder.name,
        files: new Set([fileName]),
        firstDetectedAt: new Date(),
        timer: null as any,
      };
      this.pendingBatches.set(folder.id, batch);
    }

    const delayMs = folder.watchDelaySeconds * 1000;

    batch.timer = setTimeout(() => {
      this.processBatch(folder.id);
    }, delayMs);
  }

  private static processBatch(folderId: number) {
    const batch = this.pendingBatches.get(folderId);
    if (!batch) return;

    this.pendingBatches.delete(folderId);

    const folderConfig = this.watchedFolderConfigs.get(folderId);
    if (!folderConfig) return;

    const fileList = Array.from(batch.files);
    const count = fileList.length;

    if (count === 0) return;

    console.log(`⏱️ Tempo de monitoramento atingido para [${batch.folderName}]. ${count} arquivo(s) detectados.`);

    if (folderConfig.watchAutoSync) {
      // Disparar sincronização automática
      console.log(`🚀 Executando sincronização automática para [${batch.folderName}]...`);
      SyncEngine.createNotification(
        folderId,
        'Sincronização Automática',
        `Foram detectados ${count} novo(s) arquivo(s) na pasta "${batch.folderName}". Sincronização iniciada automaticamente.`,
        'new_files'
      );

      events.emit('sync_auto_started', {
        folderId,
        folderName: batch.folderName,
        files: fileList,
        count,
        timestamp: new Date().toISOString(),
      });

      SyncEngine.syncFolder(folderId);
    } else {
      // Sugerir execução na interface
      console.log(`💡 Sugerindo execução de sincronização para [${batch.folderName}]...`);
      SyncEngine.createNotification(
        folderId,
        'Novos Arquivos Detectados',
        `Foram detectados ${count} novo(s) arquivo(s) na pasta "${batch.folderName}". Clique para sincronizar agora.`,
        'new_files'
      );

      events.emit('sync_suggested', {
        folderId,
        folderName: batch.folderName,
        files: fileList.slice(0, 10),
        totalCount: count,
        watchDelaySeconds: folderConfig.watchDelaySeconds,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  public static isWatching(folderId: number): boolean {
    return this.watchers.has(folderId);
  }

  public static getWatcherInfo(folderId: number) {
    const isActivelyWatching = this.watchers.has(folderId);
    const config = this.watchedFolderConfigs.get(folderId);
    const pendingBatch = this.pendingBatches.get(folderId);

    return {
      folderId,
      isWatching: isActivelyWatching,
      watchDelaySeconds: config ? config.watchDelaySeconds : 10,
      watchAutoSync: config ? config.watchAutoSync : false,
      pendingFilesCount: pendingBatch ? pendingBatch.files.size : 0,
      pendingFiles: pendingBatch ? Array.from(pendingBatch.files) : [],
    };
  }

  public static simulateTestDetection(folderId: number) {
    const folderConfig = this.watchedFolderConfigs.get(folderId);
    const folder = db.prepare('SELECT * FROM sync_folders WHERE id = ?').get(folderId) as any;

    if (!folder) {
      throw new Error('Pasta não encontrada.');
    }

    const testFileName = `foto_teste_${Math.floor(Math.random() * 900 + 100)}.jpg`;
    const folderName = folder.name;
    const watchDelay = folderConfig ? folderConfig.watchDelaySeconds : (folder.watch_delay_seconds || 10);

    // Emitir sugestão diretamente para validar na tela
    events.emit('sync_suggested', {
      folderId,
      folderName,
      files: [testFileName],
      totalCount: 1,
      watchDelaySeconds: watchDelay,
      isTest: true,
      detectedAt: new Date().toISOString(),
    });

    SyncEngine.createNotification(
      folderId,
      'Teste de Monitoramento',
      `O monitoramento da pasta "${folderName}" está ativo e funcionando perfeitamente (espera: ${watchDelay}s).`,
      'info'
    );

    return {
      success: true,
      folderName,
      testFileName,
      watchDelaySeconds: watchDelay,
      isWatching: this.watchers.has(folderId),
    };
  }

  public static unwatchFolder(folderId: number) {
    if (this.watchers.has(folderId)) {
      this.watchers.get(folderId)!.close();
      this.watchers.delete(folderId);
    }
    if (this.pendingBatches.has(folderId)) {
      clearTimeout(this.pendingBatches.get(folderId)!.timer);
      this.pendingBatches.delete(folderId);
    }
    this.watchedFolderConfigs.delete(folderId);
  }
}
