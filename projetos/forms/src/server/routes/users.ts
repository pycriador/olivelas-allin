import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { supabaseAdmin } from '../supabase';

export const usersRouter = Router();

// GET /api/users - List all users
usersRouter.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.auth_id, u.email, u.full_name, u.role, u.status, u.department, u.avatar_url, u.created_at, u.updated_at,
              COALESCE(
                json_agg(
                  json_build_object('id', g.id, 'name', g.name, 'color', g.color)
                ) FILTER (WHERE g.id IS NOT NULL), '[]'
              ) as groups
       FROM olivelas_iam_forms_users u
       LEFT JOIN olivelas_iam_forms_user_groups ug ON ug.user_id = u.id
       LEFT JOIN olivelas_iam_forms_groups g ON g.id = ug.group_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id - Get single user
usersRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT u.id, u.auth_id, u.email, u.full_name, u.role, u.status, u.department, u.avatar_url, u.created_at, u.updated_at,
              COALESCE(
                json_agg(
                  json_build_object('id', g.id, 'name', g.name, 'color', g.color)
                ) FILTER (WHERE g.id IS NOT NULL), '[]'
              ) as groups
       FROM olivelas_iam_forms_users u
       LEFT JOIN olivelas_iam_forms_user_groups ug ON ug.user_id = u.id
       LEFT JOIN olivelas_iam_forms_groups g ON g.id = ug.group_id
       WHERE u.id::text = $1 OR u.auth_id = $1
       GROUP BY u.id
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users - Create User (with Supabase Auth synchronization)
usersRouter.post('/', async (req, res) => {
  try {
    const { email, full_name, role = 'viewer', status = 'active', department, password, group_ids } = req.body;

    if (!email || !full_name) {
      return res.status(400).json({ error: 'E-mail e Nome Completo são obrigatórios.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password || 'Olivelas@2026';
    let authId: string | null = null;

    // 1. Synchronize / Create in Supabase Auth
    try {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
          role,
          department,
        },
      });

      if (authUser?.user?.id) {
        authId = authUser.user.id;
      } else if (authError) {
        // If user already exists in Supabase Auth, look up their ID
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuth = listData?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
        if (existingAuth) {
          authId = existingAuth.id;
        }
      }
    } catch (e: any) {
      console.warn('[Supabase Auth Warning]:', e.message);
    }

    const passwordHash = crypto.createHash('sha256').update(cleanPassword).digest('hex');

    // 2. Insert into olivelas_iam_forms_users
    const result = await query(
      `INSERT INTO olivelas_iam_forms_users (auth_id, email, full_name, role, status, department, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET 
         auth_id = COALESCE(EXCLUDED.auth_id, olivelas_iam_forms_users.auth_id),
         full_name = EXCLUDED.full_name,
         role = EXCLUDED.role,
         department = EXCLUDED.department,
         updated_at = now()
       RETURNING id, auth_id, email, full_name, role, status, department, created_at`,
      [authId, cleanEmail, full_name.trim(), role, status, department || null, passwordHash]
    );

    const newUser = result.rows[0];

    // Assign groups if provided
    if (Array.isArray(group_ids) && group_ids.length > 0) {
      for (const gid of group_ids) {
        await query(
          `INSERT INTO olivelas_iam_forms_user_groups (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newUser.id, gid]
        );
      }
    }

    // Audit log
    const userAgent = req.headers['user-agent'] || '';
    await query(
      `INSERT INTO olivelas_iam_forms_audit_logs (action, entity_type, entity_id, details, ip_address)
       VALUES ('USER_CREATED', 'user', $1, $2, $3)`,
      [
        newUser.id,
        JSON.stringify({
          email: newUser.email,
          role: newUser.role,
          name: newUser.full_name,
          department: newUser.department,
          user_agent: userAgent,
        }),
        req.ip || '127.0.0.1',
      ]
    );

    res.status(201).json(newUser);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id - Update User
usersRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, status, department, password, group_ids } = req.body;

    let updateQuery = `
      UPDATE olivelas_iam_forms_users 
      SET full_name = COALESCE($1, full_name),
          role = COALESCE($2, role),
          status = COALESCE($3, status),
          department = COALESCE($4, department),
          updated_at = now()
    `;
    const params: any[] = [full_name, role, status, department];

    if (password) {
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      params.push(passwordHash);
      updateQuery += `, password_hash = $${params.length}`;
    }

    params.push(id);
    updateQuery += ` WHERE id = $${params.length} RETURNING id, auth_id, email, full_name, role, status, department, updated_at`;

    const result = await query(updateQuery, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const updatedUser = result.rows[0];

    // If password updated and user has auth_id, update in Supabase Auth
    if (password && updatedUser.auth_id) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(updatedUser.auth_id, { password });
      } catch (e: any) {
        console.warn('[Supabase Auth Password Update Warning]:', e.message);
      }
    }

    // Update group mappings if provided
    if (Array.isArray(group_ids)) {
      await query(`DELETE FROM olivelas_iam_forms_user_groups WHERE user_id = $1`, [id]);
      for (const gid of group_ids) {
        await query(
          `INSERT INTO olivelas_iam_forms_user_groups (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, gid]
        );
      }
    }

    // Audit log
    const userAgent = req.headers['user-agent'] || '';
    await query(
      `INSERT INTO olivelas_iam_forms_audit_logs (action, entity_type, entity_id, details, ip_address)
       VALUES ('USER_UPDATED', 'user', $1, $2, $3)`,
      [
        id,
        JSON.stringify({
          role,
          status,
          department,
          user_agent: userAgent,
        }),
        req.ip || '127.0.0.1',
      ]
    );

    res.json(updatedUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id - Delete User (from DB and Supabase Auth)
usersRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const check = await query(`SELECT id, email, auth_id, full_name, role FROM olivelas_iam_forms_users WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const userToDelete = check.rows[0];
    if (userToDelete.email === 'admin@olivelas.com' || userToDelete.email === 'willian.o.jesus@gmail.com') {
      return res.status(403).json({ error: 'Administradores raiz não podem ser excluídos.' });
    }

    // Delete from Supabase Auth if auth_id exists
    if (userToDelete.auth_id) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userToDelete.auth_id);
      } catch (e: any) {
        console.warn('[Supabase Auth Delete Warning]:', e.message);
      }
    }

    await query(`DELETE FROM olivelas_iam_forms_users WHERE id = $1`, [id]);

    const userAgent = req.headers['user-agent'] || '';
    await query(
      `INSERT INTO olivelas_iam_forms_audit_logs (action, entity_type, entity_id, details, ip_address)
       VALUES ('USER_DELETED', 'user', $1, $2, $3)`,
      [
        id,
        JSON.stringify({
          ...userToDelete,
          user_agent: userAgent,
        }),
        req.ip || '127.0.0.1',
      ]
    );

    res.json({ success: true, message: 'Usuário excluído do banco e do Supabase Auth.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
