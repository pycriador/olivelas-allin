import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { GoogleIntegrationService } from '../services/google';

export const formsRouter = Router();

// GET /api/forms - List forms
formsRouter.get('/', async (req, res) => {
  try {
    const userEmail = (req.headers['x-user-email'] as string || '').toLowerCase().trim();
    const userId = req.headers['x-user-id'] as string;

    const result = await query(
      `SELECT f.id, f.title, f.description, f.owner_id, f.status, f.theme_id, f.is_public, f.share_code,
              f.requires_login, f.allow_anonymous, f.limit_one_response, f.show_progress_bar,
              f.created_at, f.updated_at,
              u.full_name as owner_name, u.email as owner_email,
              COUNT(DISTINCT fld.id)::int as fields_count,
              COUNT(DISTINCT r.id)::int as responses_count,
              CASE 
                WHEN f.owner_id::text = $1 OR u.email = $2 THEN 'owner'
                WHEN c.role IS NOT NULL THEN c.role
                ELSE 'public'
              END as user_role
       FROM olivelas_iam_forms_forms f
       JOIN olivelas_iam_forms_users u ON u.id = f.owner_id
       LEFT JOIN olivelas_iam_forms_fields fld ON fld.form_id = f.id
       LEFT JOIN olivelas_iam_forms_responses r ON r.form_id = f.id
       LEFT JOIN olivelas_iam_forms_collaborators c ON c.form_id = f.id AND (c.user_email = $2 OR c.user_id::text = $1)
       GROUP BY f.id, u.id, c.role
       ORDER BY f.updated_at DESC`,
      [userId || '00000000-0000-0000-0000-000000000000', userEmail]
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/forms/public/:shareCode - Public form view
formsRouter.get('/public/:shareCode', async (req, res) => {
  try {
    const { shareCode } = req.params;

    const formRes = await query(
      `SELECT f.*, u.full_name as owner_name
       FROM olivelas_iam_forms_forms f
       JOIN olivelas_iam_forms_users u ON u.id = f.owner_id
       WHERE f.share_code = $1 LIMIT 1`,
      [shareCode]
    );

    if (formRes.rows.length === 0) {
      return res.status(404).json({ error: 'Formulário não encontrado ou link expirado.' });
    }

    const form = formRes.rows[0];

    // Check expiration or status
    if (form.status === 'closed') {
      return res.status(403).json({ error: 'Este formulário não está mais aceitando respostas.', form });
    }

    // Get fields in order
    const fieldsRes = await query(
      `SELECT * FROM olivelas_iam_forms_fields WHERE form_id = $1 ORDER BY order_index ASC`,
      [form.id]
    );

    form.fields = fieldsRes.rows;
    res.json(form);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/forms/:id - Get form by ID with fields & collaborators
formsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const formRes = await query(
      `SELECT f.*, u.full_name as owner_name, u.email as owner_email
       FROM olivelas_iam_forms_forms f
       JOIN olivelas_iam_forms_users u ON u.id = f.owner_id
       WHERE f.id = $1 LIMIT 1`,
      [id]
    );

    if (formRes.rows.length === 0) {
      return res.status(404).json({ error: 'Formulário não encontrado.' });
    }

    const form = formRes.rows[0];

    const fieldsRes = await query(
      `SELECT * FROM olivelas_iam_forms_fields WHERE form_id = $1 ORDER BY order_index ASC`,
      [id]
    );

    const collabsRes = await query(
      `SELECT c.*, u.full_name as user_name
       FROM olivelas_iam_forms_collaborators c
       LEFT JOIN olivelas_iam_forms_users u ON u.email = c.user_email
       WHERE c.form_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    form.fields = fieldsRes.rows;
    form.collaborators = collabsRes.rows;

    res.json(form);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/forms - Create Form
formsRouter.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      owner_id,
      theme_id = 'google-classic',
      status = 'published',
      is_public = true,
      requires_login = false,
      allow_anonymous = true,
      limit_one_response = false,
      show_progress_bar = true,
      confirmation_message = 'Sua resposta foi registrada com sucesso!',
      fields = [],
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Título do formulário é obrigatório.' });
    }

    let ownerId = owner_id;
    if (ownerId) {
      const userCheck = await query(`SELECT id FROM olivelas_iam_forms_users WHERE id = $1`, [ownerId]);
      if (userCheck.rows.length === 0) {
        ownerId = null;
      }
    }
    if (!ownerId) {
      const defaultUser = await query(`SELECT id FROM olivelas_iam_forms_users ORDER BY created_at ASC LIMIT 1`);
      ownerId = defaultUser.rows[0]?.id;
    }

    const shareCode = 'oif_' + crypto.randomBytes(4).toString('hex');

    const formResult = await query(
      `INSERT INTO olivelas_iam_forms_forms
       (title, description, owner_id, status, theme_id, is_public, share_code, requires_login, allow_anonymous, limit_one_response, show_progress_bar, confirmation_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [title, description || '', ownerId, status, theme_id, is_public, shareCode, requires_login, allow_anonymous, limit_one_response, show_progress_bar, confirmation_message]
    );

    const newForm = formResult.rows[0];

    // If initial fields provided, insert them
    if (Array.isArray(fields) && fields.length > 0) {
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        await query(
          `INSERT INTO olivelas_iam_forms_fields (form_id, type, label, description, placeholder, required, order_index, options, validation, conditional_logic)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [newForm.id, f.type || 'text', f.label || 'Pergunta sem título', f.description || null, f.placeholder || null, f.required || false, i, JSON.stringify(f.options || []), JSON.stringify(f.validation || {}), JSON.stringify(f.conditional_logic || {})]
        );
      }
    } else {
      // Create a default first question
      await query(
        `INSERT INTO olivelas_iam_forms_fields (form_id, type, label, required, order_index, options)
         VALUES ($1, 'text', 'Pergunta 1', false, 0, '[]'::jsonb)`,
        [newForm.id]
      );
    }

    await query(
      `INSERT INTO olivelas_iam_forms_audit_logs (action, entity_type, entity_id, details)
       VALUES ('FORM_CREATED', 'form', $1, $2)`,
      [newForm.id, JSON.stringify({ title: newForm.title, shareCode })]
    );

    res.status(201).json(newForm);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/forms/:id - Update Form Settings & Details
formsRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      theme_id,
      header_image_url,
      logo_url,
      is_public,
      requires_login,
      allow_anonymous,
      limit_one_response,
      show_progress_bar,
      shuffle_questions,
      confirmation_message,
      redirect_url,
      password_protect,
      password,
      expires_at,
      max_responses,
    } = req.body;

    let passHash = undefined;
    if (password_protect && password) {
      passHash = crypto.createHash('sha256').update(password).digest('hex');
    }

    const result = await query(
      `UPDATE olivelas_iam_forms_forms
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           theme_id = COALESCE($4, theme_id),
           header_image_url = COALESCE($5, header_image_url),
           logo_url = COALESCE($6, logo_url),
           is_public = COALESCE($7, is_public),
           requires_login = COALESCE($8, requires_login),
           allow_anonymous = COALESCE($9, allow_anonymous),
           limit_one_response = COALESCE($10, limit_one_response),
           show_progress_bar = COALESCE($11, show_progress_bar),
           shuffle_questions = COALESCE($12, shuffle_questions),
           confirmation_message = COALESCE($13, confirmation_message),
           redirect_url = COALESCE($14, redirect_url),
           password_protect = COALESCE($15, password_protect),
           password_hash = COALESCE($16, password_hash),
           expires_at = COALESCE($17, expires_at),
           max_responses = COALESCE($18, max_responses),
           updated_at = now()
       WHERE id = $19
       RETURNING *`,
      [
        title, description, status, theme_id, header_image_url, logo_url,
        is_public, requires_login, allow_anonymous, limit_one_response,
        show_progress_bar, shuffle_questions, confirmation_message, redirect_url,
        password_protect, passHash, expires_at, max_responses, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Formulário não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/forms/:id - Delete Form
formsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM olivelas_iam_forms_forms WHERE id = $1 RETURNING id, title`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Formulário não encontrado.' });
    }

    await query(
      `INSERT INTO olivelas_iam_forms_audit_logs (action, entity_type, entity_id, details)
       VALUES ('FORM_DELETED', 'form', $1, $2)`,
      [id, JSON.stringify(result.rows[0])]
    );

    res.json({ success: true, message: 'Formulário excluído com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/forms/:id/duplicate - Duplicate Form
formsRouter.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const originalFormRes = await query(`SELECT * FROM olivelas_iam_forms_forms WHERE id = $1`, [id]);
    if (originalFormRes.rows.length === 0) {
      return res.status(404).json({ error: 'Formulário não encontrado.' });
    }

    const orig = originalFormRes.rows[0];
    const newShareCode = 'oif_' + crypto.randomBytes(4).toString('hex');

    const newFormRes = await query(
      `INSERT INTO olivelas_iam_forms_forms
       (title, description, owner_id, status, theme_id, is_public, share_code, requires_login, allow_anonymous, limit_one_response, show_progress_bar, confirmation_message)
       VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [`${orig.title} (Cópia)`, orig.description, orig.owner_id, orig.theme_id, orig.is_public, newShareCode, orig.requires_login, orig.allow_anonymous, orig.limit_one_response, orig.show_progress_bar, orig.confirmation_message]
    );
    const newForm = newFormRes.rows[0];

    // Copy fields
    const fieldsRes = await query(`SELECT * FROM olivelas_iam_forms_fields WHERE form_id = $1 ORDER BY order_index ASC`, [id]);
    for (const f of fieldsRes.rows) {
      await query(
        `INSERT INTO olivelas_iam_forms_fields (form_id, type, label, description, placeholder, required, order_index, options, validation, conditional_logic, settings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [newForm.id, f.type, f.label, f.description, f.placeholder, f.required, f.order_index, JSON.stringify(f.options), JSON.stringify(f.validation), JSON.stringify(f.conditional_logic), JSON.stringify(f.settings)]
      );
    }

    res.status(201).json(newForm);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Fields CRUD ---

// POST /api/forms/:id/fields - Add Field
formsRouter.post('/:id/fields', async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'text', label, description, placeholder, required = false, order_index, options = [], validation = {}, conditional_logic = {} } = req.body;

    const countRes = await query(`SELECT COUNT(*)::int as count FROM olivelas_iam_forms_fields WHERE form_id = $1`, [id]);
    const nextOrder = order_index !== undefined ? order_index : countRes.rows[0].count;

    const result = await query(
      `INSERT INTO olivelas_iam_forms_fields
       (form_id, type, label, description, placeholder, required, order_index, options, validation, conditional_logic)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, type, label || 'Nova Pergunta', description || null, placeholder || null, required, nextOrder, JSON.stringify(options), JSON.stringify(validation), JSON.stringify(conditional_logic)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/forms/:id/fields/:fieldId - Update Field
formsRouter.put('/:id/fields/:fieldId', async (req, res) => {
  try {
    const { id, fieldId } = req.params;
    const { type, label, description, placeholder, required, order_index, options, validation, conditional_logic, settings } = req.body;

    const result = await query(
      `UPDATE olivelas_iam_forms_fields
       SET type = COALESCE($1, type),
           label = COALESCE($2, label),
           description = COALESCE($3, description),
           placeholder = COALESCE($4, placeholder),
           required = COALESCE($5, required),
           order_index = COALESCE($6, order_index),
           options = COALESCE($7, options),
           validation = COALESCE($8, validation),
           conditional_logic = COALESCE($9, conditional_logic),
           settings = COALESCE($10, settings),
           updated_at = now()
       WHERE id = $11 AND form_id = $12
       RETURNING *`,
      [
        type, label, description, placeholder, required, order_index,
        options ? JSON.stringify(options) : null,
        validation ? JSON.stringify(validation) : null,
        conditional_logic ? JSON.stringify(conditional_logic) : null,
        settings ? JSON.stringify(settings) : null,
        fieldId, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campo não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/forms/:id/fields/:fieldId - Delete Field
formsRouter.delete('/:id/fields/:fieldId', async (req, res) => {
  try {
    const { id, fieldId } = req.params;
    const result = await query(
      `DELETE FROM olivelas_iam_forms_fields WHERE id = $1 AND form_id = $2 RETURNING id`,
      [fieldId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campo não encontrado.' });
    }

    res.json({ success: true, message: 'Campo excluído com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/forms/:id/fields/reorder - Reorder Fields
formsRouter.post('/:id/fields/reorder', async (req, res) => {
  try {
    const { id } = req.params;
    const { orderedIds } = req.body; // array of field UUIDs

    if (Array.isArray(orderedIds)) {
      for (let i = 0; i < orderedIds.length; i++) {
        await query(
          `UPDATE olivelas_iam_forms_fields SET order_index = $1 WHERE id = $2 AND form_id = $3`,
          [i, orderedIds[i], id]
        );
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Collaborators CRUD ---

// POST /api/forms/:id/collaborators - Invite/Add Collaborator (editor or viewer by email)
formsRouter.post('/:id/collaborators', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role = 'editor', invited_by } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'E-mail do colaborador é obrigatório.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists in olivelas_iam_forms_users
    const userRes = await query(`SELECT id, full_name FROM olivelas_iam_forms_users WHERE email = $1`, [cleanEmail]);
    const userId = userRes.rows[0]?.id || null;
    const userName = userRes.rows[0]?.full_name || null;

    const result = await query(
      `INSERT INTO olivelas_iam_forms_collaborators (form_id, user_id, user_email, role, invited_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (form_id, user_email) 
       DO UPDATE SET role = EXCLUDED.role, updated_at = now()
       RETURNING *`,
      [id, userId, cleanEmail, role, invited_by || null]
    );

    const collab = result.rows[0];
    collab.user_name = userName;

    await query(
      `INSERT INTO olivelas_iam_forms_audit_logs (action, entity_type, entity_id, details)
       VALUES ('COLLABORATOR_INVITED', 'form', $1, $2)`,
      [id, JSON.stringify({ email: cleanEmail, role })]
    );

    res.status(201).json(collab);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/forms/:id/collaborators/:collabId - Remove Collaborator
formsRouter.delete('/:id/collaborators/:collabId', async (req, res) => {
  try {
    const { id, collabId } = req.params;
    const result = await query(
      `DELETE FROM olivelas_iam_forms_collaborators WHERE id = $1 AND form_id = $2 RETURNING id, user_email`,
      [collabId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado.' });
    }

    res.json({ success: true, message: 'Acesso do colaborador revogado.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/forms/:id/sync-sheet - Trigger sync from Google Sheets into form responses
formsRouter.post('/:id/sync-sheet', async (req, res) => {
  try {
    const { id } = req.params;
    const { spreadsheetId, sheetTitle } = req.body;
    const result = await GoogleIntegrationService.syncSheetToForm(id, spreadsheetId, sheetTitle);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
