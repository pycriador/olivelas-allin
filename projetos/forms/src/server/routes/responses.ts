import { Router } from 'express';
import { query } from '../db';
import { GoogleIntegrationService } from '../services/google';

export const responsesRouter = Router();

// POST /api/forms/:id/responses - Submit Form Response (Public or Authenticated)
responsesRouter.post('/:id/responses', async (req, res) => {
  try {
    const { id: formId } = req.params;
    const { respondent_email, answers = {} } = req.body;
    // answers is an object mapping field_id -> value (string, number, array, or object)

    // 1. Fetch form to verify status and rules
    const formRes = await query(`SELECT * FROM olivelas_iam_forms_forms WHERE id = $1`, [formId]);
    if (formRes.rows.length === 0) {
      return res.status(404).json({ error: 'Formulário não encontrado.' });
    }
    const form = formRes.rows[0];

    if (form.status === 'closed') {
      return res.status(403).json({ error: 'Este formulário está encerrado e não aceita mais envios.' });
    }

    // 2. Fetch all form fields to validate
    const fieldsRes = await query(
      `SELECT * FROM olivelas_iam_forms_fields WHERE form_id = $1 ORDER BY order_index ASC`,
      [formId]
    );
    const fields = fieldsRes.rows;

    // Validate fields
    const validatedAnswers: Array<{
      field_id: string;
      value_text: string | null;
      value_number: number | null;
      value_json: any | null;
    }> = [];

    const sheetAnswersMap: Record<string, any> = {};

    for (const field of fields) {
      // Info text does not require answers
      if (field.type === 'info_text') continue;

      const rawVal = answers[field.id];

      // Required check
      if (field.required && (rawVal === undefined || rawVal === null || rawVal === '' || (Array.isArray(rawVal) && rawVal.length === 0))) {
        return res.status(400).json({
          error: `O campo "${field.label}" é obrigatório.`,
          field_id: field.id,
        });
      }

      let valText: string | null = null;
      let valNumber: number | null = null;
      let valJson: any | null = null;

      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
        if (field.type === 'integer') {
          const num = Number(rawVal);
          if (!Number.isInteger(num)) {
            return res.status(400).json({
              error: `O campo "${field.label}" deve ser um número inteiro válido (sem vírgulas ou casas decimais).`,
              field_id: field.id,
            });
          }
          if (field.validation?.min !== undefined && num < field.validation.min) {
            return res.status(400).json({
              error: `O valor do campo "${field.label}" não pode ser menor que ${field.validation.min}.`,
              field_id: field.id,
            });
          }
          if (field.validation?.max !== undefined && num > field.validation.max) {
            return res.status(400).json({
              error: `O valor do campo "${field.label}" não pode ser maior que ${field.validation.max}.`,
              field_id: field.id,
            });
          }
          valNumber = num;
          valText = String(num);
          sheetAnswersMap[field.label] = num;
        } else if (field.type === 'decimal') {
          const num = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(',', '.'));
          if (isNaN(num)) {
            return res.status(400).json({
              error: `O campo "${field.label}" deve ser um número quebrado/decimal válido.`,
              field_id: field.id,
            });
          }
          if (field.validation?.min !== undefined && num < field.validation.min) {
            return res.status(400).json({
              error: `O valor do campo "${field.label}" não pode ser menor que ${field.validation.min}.`,
              field_id: field.id,
            });
          }
          if (field.validation?.max !== undefined && num > field.validation.max) {
            return res.status(400).json({
              error: `O valor do campo "${field.label}" não pode ser maior que ${field.validation.max}.`,
              field_id: field.id,
            });
          }
          valNumber = num;
          valText = String(num);
          sheetAnswersMap[field.label] = num;
        } else if (field.type === 'rating' || field.type === 'scale') {
          const num = Number(rawVal);
          valNumber = isNaN(num) ? null : num;
          valText = String(rawVal);
          sheetAnswersMap[field.label] = num;
        } else if (field.type === 'checkbox' || Array.isArray(rawVal)) {
          valJson = Array.isArray(rawVal) ? rawVal : [rawVal];
          valText = JSON.stringify(valJson);
          sheetAnswersMap[field.label] = valJson.join(', ');
        } else if (typeof rawVal === 'object') {
          valJson = rawVal;
          valText = JSON.stringify(rawVal);
          sheetAnswersMap[field.label] = valText;
        } else {
          valText = String(rawVal);
          sheetAnswersMap[field.label] = valText;
        }
      }

      validatedAnswers.push({
        field_id: field.id,
        value_text: valText,
        value_number: valNumber,
        value_json: valJson,
      });
    }

    // Insert response header
    const respInsert = await query(
      `INSERT INTO olivelas_iam_forms_responses (form_id, respondent_email, respondent_ip, user_agent, status)
       VALUES ($1, $2, $3, $4, 'completed')
       RETURNING *`,
      [formId, respondent_email || null, req.ip || '127.0.0.1', req.headers['user-agent'] || '']
    );
    const newResponse = respInsert.rows[0];

    // Insert answers
    for (const ans of validatedAnswers) {
      await query(
        `INSERT INTO olivelas_iam_forms_answers (response_id, field_id, value_text, value_number, value_json)
         VALUES ($1, $2, $3, $4, $5)`,
        [newResponse.id, ans.field_id, ans.value_text, ans.value_number, ans.value_json ? JSON.stringify(ans.value_json) : null]
      );
    }

    // Google Sheets Auto-Sync (Async in background)
    GoogleIntegrationService.appendResponseToSheet('olivelas_sheets_default', form.title, {
      id: newResponse.id,
      email: newResponse.respondent_email,
      submittedAt: newResponse.submitted_at,
      answers: sheetAnswersMap,
    }).catch(err => console.error('[Google Sync Warning]:', err.message));

    // Audit log
    const userAgent = req.headers['user-agent'] || '';
    await query(
      `INSERT INTO olivelas_iam_forms_audit_logs (action, entity_type, entity_id, details, ip_address)
       VALUES ('RESPONSE_SUBMITTED', 'form_response', $1, $2, $3)`,
      [
        newResponse.id,
        JSON.stringify({
          formId,
          formTitle: form.title,
          email: newResponse.respondent_email,
          user_agent: userAgent,
        }),
        req.ip || '127.0.0.1',
      ]
    );

    res.status(201).json({
      success: true,
      message: form.confirmation_message || 'Sua resposta foi registrada com sucesso!',
      response_id: newResponse.id,
      redirect_url: form.redirect_url || null,
    });
  } catch (err: any) {
    console.error('[Submit Response Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/forms/:id/responses - List all responses with answers
responsesRouter.get('/:id/responses', async (req, res) => {
  try {
    const { id: formId } = req.params;

    const responsesRes = await query(
      `SELECT r.id, r.form_id, r.respondent_email, r.respondent_ip, r.submitted_at, r.status,
              COALESCE(
                json_agg(
                  json_build_object(
                    'field_id', a.field_id,
                    'value_text', a.value_text,
                    'value_number', a.value_number,
                    'value_json', a.value_json,
                    'label', f.label,
                    'type', f.type
                  )
                ) FILTER (WHERE a.id IS NOT NULL), '[]'
              ) as answers
       FROM olivelas_iam_forms_responses r
       LEFT JOIN olivelas_iam_forms_answers a ON a.response_id = r.id
       LEFT JOIN olivelas_iam_forms_fields f ON f.id = a.field_id
       WHERE r.form_id = $1
       GROUP BY r.id
       ORDER BY r.submitted_at DESC`,
      [formId]
    );

    res.json(responsesRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/forms/:id/responses/:responseId - Delete Response
responsesRouter.delete('/:id/responses/:responseId', async (req, res) => {
  try {
    const { id: formId, responseId } = req.params;
    const result = await query(
      `DELETE FROM olivelas_iam_forms_responses WHERE id = $1 AND form_id = $2 RETURNING id`,
      [responseId, formId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resposta não encontrada.' });
    }

    res.json({ success: true, message: 'Resposta excluída com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/forms/:id/responses/export/csv - Export Responses to CSV
responsesRouter.get('/:id/responses/export/csv', async (req, res) => {
  try {
    const { id: formId } = req.params;

    const fieldsRes = await query(
      `SELECT id, label FROM olivelas_iam_forms_fields WHERE form_id = $1 AND type != 'info_text' ORDER BY order_index ASC`,
      [formId]
    );
    const fields = fieldsRes.rows;

    const responsesRes = await query(
      `SELECT r.id, r.respondent_email, r.submitted_at,
              a.field_id, a.value_text, a.value_number, a.value_json
       FROM olivelas_iam_forms_responses r
       JOIN olivelas_iam_forms_answers a ON a.response_id = r.id
       WHERE r.form_id = $1
       ORDER BY r.submitted_at DESC`,
      [formId]
    );

    // Group answers by response
    const grouped: Record<string, any> = {};
    for (const row of responsesRes.rows) {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id,
          email: row.respondent_email || '',
          submitted_at: row.submitted_at,
          answers: {},
        };
      }
      let val = row.value_number !== null ? row.value_number : row.value_text;
      if (row.value_json) {
        val = Array.isArray(row.value_json) ? row.value_json.join('; ') : JSON.stringify(row.value_json);
      }
      grouped[row.id].answers[row.field_id] = val || '';
    }

    // Build CSV
    const headers = ['ID_Envio', 'Data_Envio', 'Email_Respondente', ...fields.map(f => `"${f.label.replace(/"/g, '""')}"`)];
    const csvLines = [headers.join(',')];

    for (const rId of Object.keys(grouped)) {
      const resp = grouped[rId];
      const line = [
        resp.id,
        new Date(resp.submitted_at).toISOString(),
        `"${resp.email}"`,
        ...fields.map(f => {
          const val = resp.answers[f.id] !== undefined ? String(resp.answers[f.id]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        }),
      ];
      csvLines.push(line.join(','));
    }

    const csvContent = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="respostas_form_${formId}.csv"`);
    res.send('\uFEFF' + csvContent); // Add UTF-8 BOM for Excel compatibility
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
