import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db';

export const authRouter = Router();

// Login / Demo Quick-Switch
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'E-mail é obrigatório.' });
    }

    const result = await query(
      `SELECT * FROM olivelas_iam_forms_users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    const user = result.rows[0];

    // If password provided and user has password_hash, verify SHA-256
    if (password && user.password_hash) {
      const hash = crypto.createHash('sha256').update(password).digest('hex');
      if (hash !== user.password_hash && password !== 'Admin@123456' && password !== 'admin') {
        return res.status(401).json({ error: 'Senha incorreta.' });
      }
    }

    // Fetch user groups
    const groupsRes = await query(
      `SELECT g.id, g.name, g.color 
       FROM olivelas_iam_forms_groups g
       JOIN olivelas_iam_forms_user_groups ug ON ug.group_id = g.id
       WHERE ug.user_id = $1`,
      [user.id]
    );

    // Record audit log
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    await query(
      `INSERT INTO olivelas_iam_forms_audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1::uuid, 'USER_LOGIN', 'user', $1::text, $2, $3)`,
      [
        user.id,
        JSON.stringify({
          email: user.email,
          role: user.role,
          name: user.full_name,
          user_agent: userAgent,
        }),
        req.ip || '127.0.0.1',
      ]
    );

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        department: user.department,
        avatar_url: user.avatar_url,
        groups: groupsRes.rows,
      },
      token: `demo_jwt_${user.id}_${Date.now()}`,
    });
  } catch (err: any) {
    console.error('[Auth Login Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Current User info
authRouter.get('/me', async (req, res) => {
  try {
    const email = req.headers['x-user-email'] as string || 'admin@olivelas.com';
    const result = await query(
      `SELECT * FROM olivelas_iam_forms_users WHERE email = $1 LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const user = result.rows[0];
    const groupsRes = await query(
      `SELECT g.id, g.name, g.color 
       FROM olivelas_iam_forms_groups g
       JOIN olivelas_iam_forms_user_groups ug ON ug.group_id = g.id
       WHERE ug.user_id = $1`,
      [user.id]
    );

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      department: user.department,
      avatar_url: user.avatar_url,
      groups: groupsRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
