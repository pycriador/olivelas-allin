import { Router } from 'express';
import { query } from '../db';

export const auditRouter = Router();

// GET /api/audit-logs - List audit logs
auditRouter.get('/', async (req, res) => {
  try {
    const { action, limit = 50 } = req.query;

    let sql = `
      SELECT a.*, u.email as user_email, u.full_name as user_name
      FROM olivelas_iam_forms_audit_logs a
      LEFT JOIN olivelas_iam_forms_users u ON u.id = a.user_id
    `;
    const params: any[] = [];

    if (action) {
      params.push(action);
      sql += ` WHERE a.action = $${params.length}`;
    }

    params.push(Number(limit));
    sql += ` ORDER BY a.created_at DESC LIMIT $${params.length}`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
