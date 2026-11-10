import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';

const router = Router();

// Obter histórico de arquivos sincronizados com paginação e filtros
router.get('/', (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit as string) || 30));
    const offset = (page - 1) * limit;
    const folderId = req.query.folderId ? Number(req.query.folderId) : null;
    const status = req.query.status as string;

    let query = `
      SELECT h.*, f.name as folder_name 
      FROM sync_history h
      LEFT JOIN sync_folders f ON h.folder_id = f.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (folderId) {
      query += ` AND h.folder_id = ?`;
      params.push(folderId);
    }

    if (status) {
      query += ` AND h.status = ?`;
      params.push(status);
    }

    // Contagem total
    const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
    const total = (db.prepare(countQuery).get(...params) as any).total;

    // Itens paginados
    query += ` ORDER BY h.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const items = db.prepare(query).all(...params);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Limpar histórico
router.delete('/', (req: Request, res: Response) => {
  try {
    const folderId = req.query.folderId ? Number(req.query.folderId) : null;
    if (folderId) {
      db.prepare('DELETE FROM sync_history WHERE folder_id = ?').run(folderId);
    } else {
      db.prepare('DELETE FROM sync_history').run();
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
