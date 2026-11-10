import cron, { ScheduledTask } from 'node-cron';
import { db } from '../db/index.js';
import { SyncEngine } from './sync.js';

export class SchedulerService {
  private static tasks: Map<number, ScheduledTask> = new Map();

  public static init() {
    this.refreshSchedules();
  }

  public static refreshSchedules() {
    // Parar todas as tarefas ativas
    for (const [id, task] of this.tasks.entries()) {
      task.stop();
    }
    this.tasks.clear();

    // Buscar pastas com agendamento ativo
    const folders = db.prepare(`
      SELECT id, name, schedule_enabled, schedule_interval, schedule_cron 
      FROM sync_folders 
      WHERE is_active = 1 AND schedule_enabled = 1
    `).all() as any[];

    for (const folder of folders) {
      const cronExpr = this.getCronExpression(folder.schedule_interval, folder.schedule_cron);
      if (!cronExpr || !cron.validate(cronExpr)) {
        console.warn(`⚠️ Expressão cron inválida para pasta [${folder.name}]: ${cronExpr}`);
        continue;
      }

      const task = cron.schedule(cronExpr, async () => {
        console.log(`⏰ Executando sincronização agendada para [${folder.name}] (${cronExpr})...`);
        try {
          await SyncEngine.syncFolder(folder.id);
        } catch (err) {
          console.error(`Erro na sincronização agendada da pasta ${folder.name}:`, err);
        }
      });

      this.tasks.set(folder.id, task);
    }

    console.log(`⏰ Scheduler ativo: ${this.tasks.size} rotina(s) de sincronização agendada(s).`);
  }

  private static getCronExpression(interval: string, customCron?: string): string | null {
    if (interval === 'custom' && customCron) {
      return customCron;
    }

    switch (interval) {
      case '15m':
        return '*/15 * * * *';
      case '30m':
        return '*/30 * * * *';
      case 'hourly':
        return '0 * * * *';
      case '6h':
        return '0 */6 * * *';
      case 'daily':
        return '0 2 * * *'; // todo dia às 02:00
      default:
        return '0 * * * *'; // fallback: a cada 1 hora
    }
  }
}
