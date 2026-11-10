import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db';

export const tokensRouter = Router();

// GET /api/tokens - List tokens
tokensRouter.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT t.id, t.user_id, t.name, t.token_prefix, t.scopes, t.expires_at, t.last_used_at, t.is_active, t.created_at,
              t.group_id, g.name as group_name, g.color as group_color,
              u.email as user_email, u.full_name as user_name
       FROM olivelas_iam_forms_api_tokens t
       LEFT JOIN olivelas_iam_forms_users u ON u.id = t.user_id
       LEFT JOIN olivelas_iam_forms_groups g ON g.id = t.group_id
       ORDER BY t.created_at DESC`
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tokens - Create API Token
tokensRouter.post('/', async (req, res) => {
  try {
    const { name, user_id, group_id, scopes = ['forms:read', 'responses:read'], expires_in_days } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome do token é obrigatório.' });
    }

    let userId = user_id;
    if (!userId) {
      const u = await query(`SELECT id FROM olivelas_iam_forms_users WHERE role = 'admin' LIMIT 1`);
      userId = u.rows[0]?.id;
    }

    // Default to first group if not provided
    let groupId = group_id;
    if (!groupId) {
      const g = await query(`SELECT id FROM olivelas_iam_forms_groups ORDER BY created_at ASC LIMIT 1`);
      groupId = g.rows[0]?.id || null;
    }

    // Generate token string
    const rawSecret = crypto.randomBytes(24).toString('hex');
    const rawToken = `oif_live_${rawSecret}`;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenPrefix = `oif_live_${rawSecret.substring(0, 4)}...`;

    let expiresAt = null;
    if (expires_in_days && Number(expires_in_days) > 0) {
      const d = new Date();
      d.setDate(d.getDate() + Number(expires_in_days));
      expiresAt = d.toISOString();
    }

    const result = await query(
      `INSERT INTO olivelas_iam_forms_api_tokens (user_id, group_id, name, token_hash, token_prefix, scopes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, group_id, name, token_prefix, scopes, expires_at, is_active, created_at`,
      [userId, groupId, name, tokenHash, tokenPrefix, scopes, expiresAt]
    );

    const tokenRecord = result.rows[0];

    // Fetch group details
    let groupDetails = null;
    if (groupId) {
      const grpRes = await query(`SELECT name, color FROM olivelas_iam_forms_groups WHERE id = $1`, [groupId]);
      if (grpRes.rows.length > 0) {
        groupDetails = grpRes.rows[0];
      }
    }

    await query(
      `INSERT INTO olivelas_iam_forms_audit_logs (action, entity_type, entity_id, details)
       VALUES ('API_TOKEN_CREATED', 'token', $1, $2)`,
      [tokenRecord.id, JSON.stringify({ name, scopes, tokenPrefix, group_id: groupId, group_name: groupDetails?.name })]
    );

    res.status(201).json({
      ...tokenRecord,
      group_name: groupDetails?.name || null,
      group_color: groupDetails?.color || null,
      raw_token: rawToken, // Returned ONLY ONCE upon creation
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tokens/:id - Update Token Name, Scopes, Group or Active Status
tokensRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, group_id, scopes, is_active } = req.body;

    const existing = await query(`SELECT * FROM olivelas_iam_forms_api_tokens WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Token não encontrado.' });
    }

    const current = existing.rows[0];
    const updatedName = name !== undefined ? name : current.name;
    const updatedGroupId = group_id !== undefined ? group_id : current.group_id;
    const updatedScopes = scopes !== undefined ? scopes : current.scopes;
    const updatedIsActive = is_active !== undefined ? is_active : current.is_active;

    await query(
      `UPDATE olivelas_iam_forms_api_tokens
       SET name = $1, group_id = $2, scopes = $3, is_active = $4
       WHERE id = $5`,
      [updatedName, updatedGroupId, updatedScopes, updatedIsActive, id]
    );

    // Get group info
    const fullRes = await query(
      `SELECT t.id, t.user_id, t.name, t.token_prefix, t.scopes, t.expires_at, t.last_used_at, t.is_active, t.created_at,
              t.group_id, g.name as group_name, g.color as group_color,
              u.email as user_email, u.full_name as user_name
       FROM olivelas_iam_forms_api_tokens t
       LEFT JOIN olivelas_iam_forms_users u ON u.id = t.user_id
       LEFT JOIN olivelas_iam_forms_groups g ON g.id = t.group_id
       WHERE t.id = $1`,
      [id]
    );

    await query(
      `INSERT INTO olivelas_iam_forms_audit_logs (action, entity_type, entity_id, details)
       VALUES ('API_TOKEN_UPDATED', 'token', $1, $2)`,
      [id, JSON.stringify({ name: updatedName, scopes: updatedScopes, group_id: updatedGroupId, is_active: updatedIsActive })]
    );

    res.json(fullRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tokens/:id - Revoke & Delete API Token
tokensRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `DELETE FROM olivelas_iam_forms_api_tokens WHERE id = $1 RETURNING id, name, token_prefix`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Token não encontrado.' });
    }

    await query(
      `INSERT INTO olivelas_iam_forms_audit_logs (action, entity_type, entity_id, details)
       VALUES ('API_TOKEN_REVOKED', 'token', $1, $2)`,
      [id, JSON.stringify({ name: result.rows[0].name, token_prefix: result.rows[0].token_prefix })]
    );

    res.json({ success: true, message: 'Token de API revogado e excluído com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

