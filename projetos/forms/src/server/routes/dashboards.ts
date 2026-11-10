import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { GoogleIntegrationService } from '../services/google';

export const dashboardsRouter = Router();

// GET /api/dashboards - List all dashboards
dashboardsRouter.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT d.id, d.title, d.description, d.owner_id, d.is_public, d.share_code,
              d.form_id, d.refresh_interval_sec, d.theme_id, d.created_at, d.updated_at,
              u.full_name as owner_name, f.title as form_title,
              COUNT(w.id)::int as widgets_count
       FROM olivelas_iam_forms_dashboards d
       JOIN olivelas_iam_forms_users u ON u.id = d.owner_id
       LEFT JOIN olivelas_iam_forms_forms f ON f.id = d.form_id
       LEFT JOIN olivelas_iam_forms_dashboard_widgets w ON w.dashboard_id = d.id
       GROUP BY d.id, u.id, f.id
       ORDER BY d.updated_at DESC`
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboards/public/:shareCode - Public Dashboard Viewer
dashboardsRouter.get('/public/:shareCode', async (req, res) => {
  try {
    const { shareCode } = req.params;

    const dashRes = await query(
      `SELECT d.*, u.full_name as owner_name, f.title as form_title
       FROM olivelas_iam_forms_dashboards d
       JOIN olivelas_iam_forms_users u ON u.id = d.owner_id
       LEFT JOIN olivelas_iam_forms_forms f ON f.id = d.form_id
       WHERE d.share_code = $1 LIMIT 1`,
      [shareCode]
    );

    if (dashRes.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard não encontrado ou link público desativado.' });
    }

    const dashboard = dashRes.rows[0];
    if (!dashboard.is_public) {
      return res.status(403).json({ error: 'Este dashboard é privado e requer autenticação.' });
    }

    const widgetsRes = await query(
      `SELECT * FROM olivelas_iam_forms_dashboard_widgets WHERE dashboard_id = $1 ORDER BY order_index ASC`,
      [dashboard.id]
    );
    dashboard.widgets = widgetsRes.rows;

    // Fetch aggregated data for linked form
    if (dashboard.form_id) {
      const respCount = await query(
        `SELECT COUNT(*)::int as count FROM olivelas_iam_forms_responses WHERE form_id = $1`,
        [dashboard.form_id]
      );
      dashboard.total_responses = respCount.rows[0].count;

      const answersRes = await query(
        `SELECT a.field_id, f.label, f.type, a.value_text, a.value_number, a.value_json
         FROM olivelas_iam_forms_answers a
         JOIN olivelas_iam_forms_responses r ON r.id = a.response_id
         JOIN olivelas_iam_forms_fields f ON f.id = a.field_id
         WHERE r.form_id = $1`,
        [dashboard.form_id]
      );
      dashboard.aggregated_answers = answersRes.rows;

      const responsesListRes = await query(
        `SELECT r.id, r.submitted_at, r.respondent_email,
                jsonb_object_agg(f.label, COALESCE(a.value_text, a.value_number::text, a.value_json::text, '')) as answers
         FROM olivelas_iam_forms_responses r
         JOIN olivelas_iam_forms_answers a ON a.response_id = r.id
         JOIN olivelas_iam_forms_fields f ON f.id = a.field_id
         WHERE r.form_id = $1
         GROUP BY r.id, r.submitted_at, r.respondent_email
         ORDER BY r.submitted_at DESC`,
        [dashboard.form_id]
      );
      dashboard.responses_list = responsesListRes.rows;
    }

    res.json(dashboard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dashboards/public/:shareCode/sync - Trigger sync for public dashboard
dashboardsRouter.post('/public/:shareCode/sync', async (req, res) => {
  try {
    const { shareCode } = req.params;
    const dashRes = await query(
      `SELECT d.* FROM olivelas_iam_forms_dashboards d WHERE d.share_code = $1 LIMIT 1`,
      [shareCode]
    );

    if (dashRes.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard não encontrado.' });
    }
    const dashboard = dashRes.rows[0];
    if (!dashboard.form_id) {
      return res.status(400).json({ error: 'Dashboard não possui formulário vinculado.' });
    }

    let source = dashboard.google_sheet_source;
    if (typeof source === 'string') {
      try { source = JSON.parse(source); } catch (_) {}
    }

    const spreadsheetId = source?.spreadsheetId || '1mqbaHKLTHSozWqTpklGPSKffp73DJyDlA1SITumvKsM';
    const sheetTitle = source?.sheetTitle || 'Respostas ao formulário 1';

    const result = await GoogleIntegrationService.syncSheetToForm(dashboard.form_id, spreadsheetId, sheetTitle);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboards/:id - Get Dashboard by ID
dashboardsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const dashRes = await query(
      `SELECT d.*, u.full_name as owner_name, f.title as form_title
       FROM olivelas_iam_forms_dashboards d
       JOIN olivelas_iam_forms_users u ON u.id = d.owner_id
       LEFT JOIN olivelas_iam_forms_forms f ON f.id = d.form_id
       WHERE d.id = $1 LIMIT 1`,
      [id]
    );

    if (dashRes.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard não encontrado.' });
    }

    const dashboard = dashRes.rows[0];

    const widgetsRes = await query(
      `SELECT * FROM olivelas_iam_forms_dashboard_widgets WHERE dashboard_id = $1 ORDER BY order_index ASC`,
      [id]
    );
    dashboard.widgets = widgetsRes.rows;

    // Fetch form answers if linked
    if (dashboard.form_id) {
      const respCount = await query(
        `SELECT COUNT(*)::int as count FROM olivelas_iam_forms_responses WHERE form_id = $1`,
        [dashboard.form_id]
      );
      dashboard.total_responses = respCount.rows[0].count;

      const answersRes = await query(
        `SELECT a.field_id, f.label, f.type, a.value_text, a.value_number, a.value_json
         FROM olivelas_iam_forms_answers a
         JOIN olivelas_iam_forms_responses r ON r.id = a.response_id
         JOIN olivelas_iam_forms_fields f ON f.id = a.field_id
         WHERE r.form_id = $1`,
        [dashboard.form_id]
      );
      dashboard.aggregated_answers = answersRes.rows;

      const responsesListRes = await query(
        `SELECT r.id, r.submitted_at, r.respondent_email,
                jsonb_object_agg(f.label, COALESCE(a.value_text, a.value_number::text, a.value_json::text, '')) as answers
         FROM olivelas_iam_forms_responses r
         JOIN olivelas_iam_forms_answers a ON a.response_id = r.id
         JOIN olivelas_iam_forms_fields f ON f.id = a.field_id
         WHERE r.form_id = $1
         GROUP BY r.id, r.submitted_at, r.respondent_email
         ORDER BY r.submitted_at DESC`,
        [dashboard.form_id]
      );
      dashboard.responses_list = responsesListRes.rows;
    }

    res.json(dashboard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dashboards - Create Dashboard
dashboardsRouter.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      owner_id,
      form_id,
      is_public = false,
      theme_id = 'google-classic',
      google_sheet_source,
      refresh_interval_sec = 0,
      widgets = [],
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Título do dashboard é obrigatório.' });
    }

    let ownerId = owner_id;
    if (ownerId) {
      const userCheck = await query(`SELECT id FROM olivelas_iam_forms_users WHERE id = $1`, [ownerId]);
      if (userCheck.rows.length === 0) {
        ownerId = null;
      }
    }
    if (!ownerId) {
      const user = await query(`SELECT id FROM olivelas_iam_forms_users ORDER BY created_at ASC LIMIT 1`);
      ownerId = user.rows[0]?.id;
    }

    const shareCode = 'dash_' + crypto.randomBytes(4).toString('hex');

    const result = await query(
      `INSERT INTO olivelas_iam_forms_dashboards
       (title, description, owner_id, form_id, is_public, share_code, theme_id, google_sheet_source, refresh_interval_sec)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description || '', ownerId, form_id || null, is_public, shareCode, theme_id, google_sheet_source ? JSON.stringify(google_sheet_source) : null, refresh_interval_sec]
    );

    const newDash = result.rows[0];

    // Create initial widgets if provided
    if (Array.isArray(widgets) && widgets.length > 0) {
      for (let i = 0; i < widgets.length; i++) {
        const w = widgets[i];
        await query(
          `INSERT INTO olivelas_iam_forms_dashboard_widgets
           (dashboard_id, title, widget_type, data_source, config, position, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [newDash.id, w.title || 'Gráfico', w.widget_type || 'bar', w.data_source || 'form', JSON.stringify(w.config || {}), JSON.stringify(w.position || { x: 0, y: 0, w: 6, h: 4 }), i]
        );
      }
    } else {
      // Create a default metric widget
      await query(
        `INSERT INTO olivelas_iam_forms_dashboard_widgets
         (dashboard_id, title, widget_type, data_source, config, position, order_index)
         VALUES ($1, 'Total de Envios', 'metric', 'form', '{"metricType": "count_responses"}'::jsonb, '{"x": 0, "y": 0, "w": 4, "h": 2}'::jsonb, 0)`,
        [newDash.id]
      );
    }

    res.status(201).json(newDash);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboards/:id - Update Dashboard
dashboardsRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, form_id, is_public, theme_id, refresh_interval_sec, google_sheet_source } = req.body;

    const result = await query(
      `UPDATE olivelas_iam_forms_dashboards
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           form_id = COALESCE($3, form_id),
           is_public = COALESCE($4, is_public),
           theme_id = COALESCE($5, theme_id),
           refresh_interval_sec = COALESCE($6, refresh_interval_sec),
           google_sheet_source = COALESCE($7, google_sheet_source),
           updated_at = now()
       WHERE id = $8
       RETURNING *`,
      [
        title, description, form_id, is_public, theme_id, refresh_interval_sec,
        google_sheet_source ? JSON.stringify(google_sheet_source) : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/dashboards/:id - Delete Dashboard
dashboardsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM olivelas_iam_forms_dashboards WHERE id = $1 RETURNING id, title`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard não encontrado.' });
    }

    res.json({ success: true, message: 'Dashboard excluído com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dashboards/:id/sync-sheet - Trigger sync from Google Sheets
dashboardsRouter.post('/:id/sync-sheet', async (req, res) => {
  try {
    const { id } = req.params;
    const dashRes = await query(`SELECT * FROM olivelas_iam_forms.dashboards WHERE id::text = $1 OR share_code = $1 LIMIT 1`, [id]);
    if (dashRes.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard não encontrado.' });
    }
    const dashboard = dashRes.rows[0];
    if (!dashboard.form_id) {
      return res.status(400).json({ error: 'Este dashboard não possui um formulário vinculado para sincronização.' });
    }

    let source = dashboard.google_sheet_source;
    if (typeof source === 'string') {
      try { source = JSON.parse(source); } catch (_) {}
    }

    const spreadsheetId = req.body.spreadsheetId || source?.spreadsheetId || '1mqbaHKLTHSozWqTpklGPSKffp73DJyDlA1SITumvKsM';
    const sheetTitle = req.body.sheetTitle || source?.sheetTitle || 'Respostas ao formulário 1';

    const result = await GoogleIntegrationService.syncSheetToForm(dashboard.form_id, spreadsheetId, sheetTitle);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Dashboard Widgets CRUD ---

// POST /api/dashboards/:id/widgets - Add Widget
dashboardsRouter.post('/:id/widgets', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, widget_type = 'bar', data_source = 'form', config = {}, position = { x: 0, y: 0, w: 6, h: 4 }, order_index } = req.body;

    const countRes = await query(`SELECT COUNT(*)::int as count FROM olivelas_iam_forms_dashboard_widgets WHERE dashboard_id = $1`, [id]);
    const nextOrder = order_index !== undefined ? order_index : countRes.rows[0].count;

    const result = await query(
      `INSERT INTO olivelas_iam_forms_dashboard_widgets
       (dashboard_id, title, widget_type, data_source, config, position, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, title || 'Novo Gráfico', widget_type, data_source, JSON.stringify(config), JSON.stringify(position), nextOrder]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboards/:id/widgets/:widgetId - Update Widget
dashboardsRouter.put('/:id/widgets/:widgetId', async (req, res) => {
  try {
    const { id, widgetId } = req.params;
    const { title, widget_type, data_source, config, position, order_index } = req.body;

    const result = await query(
      `UPDATE olivelas_iam_forms_dashboard_widgets
       SET title = COALESCE($1, title),
           widget_type = COALESCE($2, widget_type),
           data_source = COALESCE($3, data_source),
           config = COALESCE($4, config),
           position = COALESCE($5, position),
           order_index = COALESCE($6, order_index),
           updated_at = now()
       WHERE id = $7 AND dashboard_id = $8
       RETURNING *`,
      [
        title, widget_type, data_source,
        config ? JSON.stringify(config) : null,
        position ? JSON.stringify(position) : null,
        order_index, widgetId, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Widget não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/dashboards/:id/widgets/:widgetId - Delete Widget
dashboardsRouter.delete('/:id/widgets/:widgetId', async (req, res) => {
  try {
    const { id, widgetId } = req.params;
    const result = await query(
      `DELETE FROM olivelas_iam_forms_dashboard_widgets WHERE id = $1 AND dashboard_id = $2 RETURNING id`,
      [widgetId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Widget não encontrado.' });
    }

    res.json({ success: true, message: 'Widget excluído com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
