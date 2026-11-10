import { Router, Request, Response } from 'express';
import fs from 'fs';
import { db } from '../db/index.js';
import { GDriveService } from '../services/gdrive.js';
import { SyncEngine } from '../services/sync.js';
import { FolderWatcherService } from '../services/watcher.js';
import { SchedulerService } from '../services/scheduler.js';

const router = Router();

// Listar todos os mapeamentos de pastas
router.get('/', (req: Request, res: Response) => {
  try {
    const folders = db.prepare(`
      SELECT f.*,
        (SELECT COUNT(*) FROM sync_history WHERE folder_id = f.id AND status = 'synced') as synced_count,
        (SELECT COUNT(*) FROM sync_history WHERE folder_id = f.id AND status = 'failed') as failed_count,
        (SELECT COALESCE(SUM(file_size), 0) FROM sync_history WHERE folder_id = f.id AND status = 'synced') as total_bytes_synced
      FROM sync_folders f
      ORDER BY f.created_at DESC
    `).all() as any[];

    // Adicionar flag em tempo real se está sincronizando agora
    const mapped = folders.map((f) => ({
      ...f,
      is_syncing: SyncEngine.isSyncing(f.id),
      schedule_enabled: Boolean(f.schedule_enabled),
      watch_enabled: Boolean(f.watch_enabled),
      watch_delay_seconds: Number(f.watch_delay_seconds) || 10,
      watch_auto_sync: Boolean(f.watch_auto_sync),
      is_watching: FolderWatcherService.isWatching(f.id),
      is_active: Boolean(f.is_active),
    }));

    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Criar novo mapeamento de pasta
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      local_path,
      gdrive_folder_id,
      gdrive_folder_name,
      sync_mode = 'upload',
      schedule_enabled = false,
      schedule_interval = 'hourly',
      schedule_cron = '',
      file_extensions = '',
      watch_enabled = true,
      watch_delay_seconds = 10,
      watch_auto_sync = false,
    } = req.body;

    if (!name || !local_path || !gdrive_folder_id) {
      return res.status(400).json({ error: 'Nome, Diretório Local e ID do Google Drive são obrigatórios.' });
    }

    // Verificar se pasta local existe
    if (!fs.existsSync(local_path)) {
      return res.status(400).json({ error: `O diretório local "${local_path}" não existe no seu computador.` });
    }

    // Tentar obter nome da pasta no Google Drive caso não fornecido
    let folderName = gdrive_folder_name;
    if (!folderName) {
      try {
        const driveInfo = await GDriveService.getFolderInfo(gdrive_folder_id.trim());
        folderName = driveInfo.name;
      } catch (e: any) {
        return res.status(400).json({ error: `Erro ao validar ID da pasta no Google Drive: ${e.message}` });
      }
    }

    const stmt = db.prepare(`
      INSERT INTO sync_folders (
        name, local_path, gdrive_folder_id, gdrive_folder_name, sync_mode,
        schedule_enabled, schedule_interval, schedule_cron, file_extensions,
        watch_enabled, watch_delay_seconds, watch_auto_sync, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      name.trim(),
      local_path.trim(),
      gdrive_folder_id.trim(),
      folderName,
      sync_mode,
      schedule_enabled ? 1 : 0,
      schedule_interval,
      schedule_cron || null,
      file_extensions.trim(),
      watch_enabled ? 1 : 0,
      Math.max(2, Number(watch_delay_seconds) || 10),
      watch_auto_sync ? 1 : 0
    );

    // Atualizar Watchers e Scheduler
    FolderWatcherService.refreshWatchers();
    SchedulerService.refreshSchedules();

    const created = db.prepare('SELECT * FROM sync_folders WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar mapeamento
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const {
      name,
      local_path,
      gdrive_folder_id,
      gdrive_folder_name,
      sync_mode,
      schedule_enabled,
      schedule_interval,
      schedule_cron,
      file_extensions,
      watch_enabled,
      watch_delay_seconds,
      watch_auto_sync,
      is_active,
    } = req.body;

    const existing = db.prepare('SELECT * FROM sync_folders WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Mapeamento não encontrado.' });
    }

    if (local_path && !fs.existsSync(local_path)) {
      return res.status(400).json({ error: `O diretório local "${local_path}" não existe.` });
    }

    let folderName = gdrive_folder_name || existing.gdrive_folder_name;
    if (gdrive_folder_id && gdrive_folder_id !== existing.gdrive_folder_id && !gdrive_folder_name) {
      try {
        const driveInfo = await GDriveService.getFolderInfo(gdrive_folder_id.trim());
        folderName = driveInfo.name;
      } catch (e: any) {
        return res.status(400).json({ error: `Erro ao validar ID no Google Drive: ${e.message}` });
      }
    }

    db.prepare(`
      UPDATE sync_folders SET
        name = COALESCE(?, name),
        local_path = COALESCE(?, local_path),
        gdrive_folder_id = COALESCE(?, gdrive_folder_id),
        gdrive_folder_name = COALESCE(?, gdrive_folder_name),
        sync_mode = COALESCE(?, sync_mode),
        schedule_enabled = COALESCE(?, schedule_enabled),
        schedule_interval = COALESCE(?, schedule_interval),
        schedule_cron = COALESCE(?, schedule_cron),
        file_extensions = COALESCE(?, file_extensions),
        watch_enabled = COALESCE(?, watch_enabled),
        watch_delay_seconds = COALESCE(?, watch_delay_seconds),
        watch_auto_sync = COALESCE(?, watch_auto_sync),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      name,
      local_path,
      gdrive_folder_id,
      folderName,
      sync_mode,
      schedule_enabled !== undefined ? (schedule_enabled ? 1 : 0) : null,
      schedule_interval,
      schedule_cron,
      file_extensions,
      watch_enabled !== undefined ? (watch_enabled ? 1 : 0) : null,
      watch_delay_seconds !== undefined ? Math.max(2, Number(watch_delay_seconds) || 10) : null,
      watch_auto_sync !== undefined ? (watch_auto_sync ? 1 : 0) : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      id
    );

    FolderWatcherService.refreshWatchers();
    SchedulerService.refreshSchedules();

    const updated = db.prepare('SELECT * FROM sync_folders WHERE id = ?').get(id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Testar detecção e funcionamento do watcher para uma pasta específica
router.post('/:id/test-watch', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = FolderWatcherService.simulateTestDetection(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obter status do watcher para uma pasta
router.get('/:id/watch-status', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const info = FolderWatcherService.getWatcherInfo(id);
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar mapeamento
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    FolderWatcherService.unwatchFolder(id);
    db.prepare('DELETE FROM sync_folders WHERE id = ?').run(id);
    SchedulerService.refreshSchedules();

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sincronizar pasta específica manualmente
router.post('/:id/sync', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (SyncEngine.isSyncing(id)) {
      return res.status(400).json({ error: 'Esta pasta já está sincronizando.' });
    }

    // Iniciar de forma assíncrona para não travar a requisição HTTP
    SyncEngine.syncFolder(id);

    res.json({ success: true, message: 'Sincronização iniciada com sucesso em segundo plano.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Parar sincronização de uma pasta específica
router.post('/:id/stop', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const stopped = SyncEngine.stopSync(id);
    res.json({ success: true, message: stopped ? 'Interrupção solicitada com sucesso.' : 'A pasta não estava em sincronização.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sincronizar todas as pastas
router.post('/sync-all', async (req: Request, res: Response) => {
  try {
    SyncEngine.syncAll();
    res.json({ success: true, message: 'Sincronização de todas as pastas iniciada em segundo plano.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Parar todas as sincronizações
router.post('/stop-all', (req: Request, res: Response) => {
  try {
    SyncEngine.stopAll();
    res.json({ success: true, message: 'Interrupção de todas as sincronizações solicitada.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
