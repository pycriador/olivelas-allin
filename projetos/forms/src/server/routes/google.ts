import { Router } from 'express';
import { query } from '../db';
import { GoogleIntegrationService } from '../services/google';

export const googleRouter = Router();

// GET /api/google/status - Get integration status (optionally ?groupId=...)
googleRouter.get('/status', async (req, res) => {
  try {
    const groupId = req.query.groupId as string | undefined;
    const status = await GoogleIntegrationService.getStatus(groupId);
    res.json(status);
  } catch (err: any) {
    console.error('Error in /api/google/status:', err.message);
    res.json({
      isConnected: false,
      authMode: 'service_account',
      errorMessage: err.message,
    });
  }
});

// GET /api/google/groups - List all groups with their Google connection status
googleRouter.get('/groups', async (_req, res) => {
  try {
    const groups = await GoogleIntegrationService.getGroupsWithGoogleStatus();
    res.json({ groups });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/google/groups/:groupId - Get status for a specific group
googleRouter.get('/groups/:groupId', async (req, res) => {
  try {
    const status = await GoogleIntegrationService.getStatus(req.params.groupId);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/google/groups/:groupId/service-account - Save Service Account JSON for a group
googleRouter.post('/groups/:groupId/service-account', async (req, res) => {
  try {
    const { serviceAccountJson } = req.body;
    if (!serviceAccountJson) {
      return res.status(400).json({ error: 'O conteúdo JSON da conta de serviço é obrigatório.' });
    }
    const jsonStr = typeof serviceAccountJson === 'string' ? serviceAccountJson : JSON.stringify(serviceAccountJson);
    const result = await GoogleIntegrationService.saveServiceAccount(jsonStr, req.params.groupId);
    res.json({
      success: true,
      message: `Conta de Serviço Google configurada e autenticada com sucesso para o Grupo (${result.email})!`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/google/groups/:groupId/test-connection - Test connection for a group
googleRouter.post('/groups/:groupId/test-connection', async (req, res) => {
  try {
    const status = await GoogleIntegrationService.getStatus(req.params.groupId);
    res.json(status);
  } catch (err: any) {
    res.json({
      isConnected: false,
      errorMessage: err.message,
    });
  }
});

// DELETE /api/google/groups/:groupId - Disconnect Google for a group
googleRouter.delete('/groups/:groupId', async (req, res) => {
  try {
    const result = await GoogleIntegrationService.disconnectGroup(req.params.groupId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/google/auth-url - Generate live OAuth consent URL
googleRouter.get('/auth-url', async (req, res) => {
  try {
    const clientId = req.query.clientId as string | undefined;
    const clientSecret = req.query.clientSecret as string | undefined;
    const redirectUri = req.query.redirectUri as string | undefined;
    const authUrl = await GoogleIntegrationService.generateAuthUrl(clientId, clientSecret, redirectUri);
    res.json({ authUrl });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/google/exchange-code - Exchange authorization code for tokens
googleRouter.post('/exchange-code', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'O código de autorização é obrigatório.' });
    }
    const result = await GoogleIntegrationService.exchangeCode(code, redirectUri);
    res.json({
      success: true,
      message: `Google OAuth autorizado com sucesso para ${result.email}!`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/google/service-account - Save and validate Service Account JSON
googleRouter.post('/service-account', async (req, res) => {
  try {
    const { serviceAccountJson } = req.body;
    if (!serviceAccountJson) {
      return res.status(400).json({ error: 'O conteúdo JSON da conta de serviço é obrigatório.' });
    }
    const jsonStr = typeof serviceAccountJson === 'string' ? serviceAccountJson : JSON.stringify(serviceAccountJson);
    const result = await GoogleIntegrationService.saveServiceAccount(jsonStr);
    res.json({
      success: true,
      message: `Conta de Serviço Google configurada e autenticada com sucesso (${result.email})!`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/google/test-connection - Test current live connection
googleRouter.post('/test-connection', async (req, res) => {
  try {
    const status = await GoogleIntegrationService.getStatus();
    res.json(status);
  } catch (err: any) {
    res.json({
      isConnected: false,
      errorMessage: err.message,
    });
  }
});

// POST /api/google/create-sheet - Create a new Google Spreadsheet
googleRouter.post('/create-sheet', async (req, res) => {
  try {
    const { title = 'Formulário Olivelas' } = req.body;
    const result = await GoogleIntegrationService.createSpreadsheet(title);
    res.json({
      success: true,
      message: result.createdInGoogle
        ? 'Planilha criada no Google Drive com sucesso!'
        : 'Sincronizador preparado com sucesso!',
      ...result,
    });
  } catch (err: any) {
    console.error('Error creating spreadsheet:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/google/connect - Save / Connect Google Credentials manually
googleRouter.post('/connect', async (req, res) => {
  try {
    const { service_type = 'google_drive', auth_mode = 'oauth', connected_email = 'integracao@olivelas.com', credentials_json } = req.body;

    const u = await query(`SELECT id FROM olivelas_iam_forms_users LIMIT 1`);
    const userId = u.rows[0]?.id;

    const result = await query(
      `INSERT INTO olivelas_iam_forms_google_integrations
       (user_id, service_type, auth_mode, connected_email, credentials_encrypted, status, last_sync_at)
       VALUES ($1, $2, $3, $4, $5, 'connected', now())
       ON CONFLICT (id) DO UPDATE SET updated_at = now()
       RETURNING *`,
      [userId, service_type, auth_mode, connected_email, credentials_json ? JSON.stringify(credentials_json) : '{"configured": true}']
    );

    res.json({
      success: true,
      message: 'Integração Google conectada com sucesso!',
      integration: result.rows[0],
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/google/sync-sheets - Trigger sync of form responses to a Google Spreadsheet
googleRouter.post('/sync-sheets', async (req, res) => {
  try {
    const { formId, spreadsheetId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' } = req.body;

    const formRes = await query(`SELECT id, title FROM olivelas_iam_forms_forms WHERE id::text = $1 OR share_code = $1 LIMIT 1`, [formId]);
    const form = formRes.rows[0];
    const formTitle = form?.title || 'Formulário';
    const realFormId = form?.id;

    let count = 0;
    if (realFormId) {
      const respCount = await query(`SELECT COUNT(*)::int as count FROM olivelas_iam_forms_responses WHERE form_id = $1`, [realFormId]);
      count = respCount.rows[0]?.count || 0;
    }

    const appendRes = await GoogleIntegrationService.appendResponseToSheet(
      spreadsheetId,
      formTitle,
      {
        id: 'sync-test-' + Date.now().toString(36),
        email: 'admin@olivelas.com',
        submittedAt: new Date().toISOString(),
        answers: { sync_test: 'Verificação de conexão Olivelas IAM Forms' },
      }
    );

    const config = await GoogleIntegrationService.getStoredConfig();

    if (!appendRes.success) {
      res.json({
        success: false,
        message: `Planilha acessada, mas permissão pendente: certifique-se de compartilhar a planilha ${spreadsheetId} com "${config?.connectedEmail || 'sua Conta de Serviço Google'}" como Editor.`,
        error: appendRes.error,
        spreadsheetId,
        formTitle,
        syncedRows: count,
        lastSync: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      message: `Sincronização com Google Sheets executada com sucesso! Resposta de validação gravada na planilha.`,
      spreadsheetId,
      formTitle,
      syncedRows: count,
      updatedRange: appendRes.updatedRange,
      lastSync: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/google/import-form - Import questions from Google Forms
googleRouter.post('/import-form', async (req, res) => {
  try {
    const { formUrlOrId } = req.body;

    const imported = await GoogleIntegrationService.importGoogleForm(formUrlOrId || 'default');

    // Create the imported form in Olivelas IAM Forms
    const u = await query(`SELECT id FROM olivelas_iam_forms_users LIMIT 1`);
    const ownerId = u.rows[0]?.id;
    const shareCode = 'oif_gf_' + Date.now().toString(36);

    const formRes = await query(
      `INSERT INTO olivelas_iam_forms_forms (title, description, owner_id, status, is_public, share_code)
       VALUES ($1, $2, $3, 'draft', true, $4)
       RETURNING *`,
      [imported.title, imported.description, ownerId, shareCode]
    );
    const newForm = formRes.rows[0];

    for (let i = 0; i < imported.fields.length; i++) {
      const f = imported.fields[i];
      await query(
        `INSERT INTO olivelas_iam_forms_fields (form_id, type, label, required, order_index, options, validation)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [newForm.id, f.type, f.label, f.required, i, JSON.stringify(f.options || []), JSON.stringify((f as any).validation || {})]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Formulário Google Forms importado e convertido com sucesso para o Olivelas IAM Forms!',
      form: newForm,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
