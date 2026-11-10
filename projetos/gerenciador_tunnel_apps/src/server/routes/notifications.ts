import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';

const router = Router();

// Obter notificações
router.get('/', (req: Request, res: Response) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

    let query = `
      SELECT n.*, a.name as app_name 
      FROM notifications n
      LEFT JOIN applications a ON n.app_id = a.id
    `;
    if (unreadOnly) {
      query += ` WHERE n.is_read = 0`;
    }
    query += ` ORDER BY n.created_at DESC LIMIT ?`;

    const notifications = db.prepare(query).all(limit);
    const unreadCount = (db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').get() as any).count;

    res.json({ notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Marcar como lida
router.post('/mark-read', (req: Request, res: Response) => {
  try {
    const { id, all } = req.body;
    if (all) {
      db.prepare('UPDATE notifications SET is_read = 1').run();
    } else if (id) {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Limpar notificações
router.delete('/', (_req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM notifications').run();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
