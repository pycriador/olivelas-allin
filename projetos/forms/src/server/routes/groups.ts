import { Router } from 'express';
import { query } from '../db';

export const groupsRouter = Router();

// GET /api/groups - List all groups with member count
groupsRouter.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT g.id, g.name, g.description, g.color, g.created_at, g.updated_at,
              COUNT(DISTINCT ug.user_id)::int as member_count,
              COALESCE(
                json_agg(
                  DISTINCT jsonb_build_object('id', u.id, 'full_name', u.full_name, 'email', u.email, 'role', u.role)
                ) FILTER (WHERE u.id IS NOT NULL), '[]'
              ) as members,
              gi.connected_email as google_email,
              gi.status as google_status,
              (gi.credentials_encrypted IS NOT NULL) as google_connected
       FROM olivelas_iam_forms_groups g
       LEFT JOIN olivelas_iam_forms_user_groups ug ON ug.group_id = g.id
       LEFT JOIN olivelas_iam_forms_users u ON u.id = ug.user_id
       LEFT JOIN olivelas_iam_forms_google_integrations gi ON gi.group_id = g.id
       GROUP BY g.id, gi.connected_email, gi.status, gi.credentials_encrypted
       ORDER BY g.name ASC`
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groups/:id - Get single group
groupsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT g.id, g.name, g.description, g.color, g.created_at, g.updated_at,
              COUNT(ug.user_id)::int as member_count,
              COALESCE(
                json_agg(
                  json_build_object('id', u.id, 'full_name', u.full_name, 'email', u.email, 'role', u.role)
                ) FILTER (WHERE u.id IS NOT NULL), '[]'
              ) as members
       FROM olivelas_iam_forms_groups g
       LEFT JOIN olivelas_iam_forms_user_groups ug ON ug.group_id = g.id
       LEFT JOIN olivelas_iam_forms_users u ON u.id = ug.user_id
       WHERE g.id::text = $1
       GROUP BY g.id
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups - Create Group
groupsRouter.post('/', async (req, res) => {
  try {
    const { name, description, color = '#4f46e5', member_ids } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome do grupo é obrigatório.' });
    }

    const result = await query(
      `INSERT INTO olivelas_iam_forms_groups (name, description, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), description || null, color]
    );

    const newGroup = result.rows[0];

    if (Array.isArray(member_ids) && member_ids.length > 0) {
      for (const uid of member_ids) {
        await query(
          `INSERT INTO olivelas_iam_forms_user_groups (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [uid, newGroup.id]
        );
      }
    }

    await query(
      `INSERT INTO olivelas_iam_forms_audit_logs (action, entity_type, entity_id, details)
       VALUES ('GROUP_CREATED', 'group', $1, $2)`,
      [newGroup.id, JSON.stringify({ name: newGroup.name })]
    );

    res.status(201).json(newGroup);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Já existe um grupo com este nome.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/groups/:id - Update Group
groupsRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, member_ids } = req.body;

    const result = await query(
      `UPDATE olivelas_iam_forms_groups
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           updated_at = now()
       WHERE id = $4
       RETURNING *`,
      [name, description, color, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado.' });
    }

    if (Array.isArray(member_ids)) {
      await query(`DELETE FROM olivelas_iam_forms_user_groups WHERE group_id = $1`, [id]);
      for (const uid of member_ids) {
        await query(
          `INSERT INTO olivelas_iam_forms_user_groups (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [uid, id]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/groups/:id - Delete Group
groupsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM olivelas_iam_forms_groups WHERE id = $1 RETURNING id, name`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo não encontrado.' });
    }

    await query(
      `INSERT INTO olivelas_iam_forms_audit_logs (action, entity_type, entity_id, details)
       VALUES ('GROUP_DELETED', 'group', $1, $2)`,
      [id, JSON.stringify(result.rows[0])]
    );

    res.json({ success: true, message: 'Grupo excluído com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
