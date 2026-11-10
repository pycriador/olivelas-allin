import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';

const router = Router();

// Obter histórico de execuções e túneis com paginação
router.get('/', (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;
    const appId = req.query.appId ? parseInt(req.query.appId as string, 10) : undefined;
    const status = (req.query.status as string) || undefined;

    const conditions: string[] = [];
    const params: any[] = [];

    if (appId) {
      conditions.push('h.app_id = ?');
      params.push(appId);
    }
    if (status) {
      conditions.push('h.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const totalRow = db
      .prepare(`SELECT COUNT(*) as total FROM run_history h ${whereClause}`)
      .get(...params) as any;
    const total = totalRow?.total || 0;

    const items = db
      .prepare(
        `SELECT h.*
         FROM run_history h
         ${whereClause}
         ORDER BY h.started_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Limpar histórico
router.delete('/', (req: Request, res: Response) => {
  try {
    const appId = req.query.appId ? parseInt(req.query.appId as string, 10) : undefined;
    if (appId) {
      db.prepare('DELETE FROM run_history WHERE app_id = ?').run(appId);
    } else {
      db.prepare('DELETE FROM run_history').run();
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
