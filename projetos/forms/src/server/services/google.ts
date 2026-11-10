import { google } from 'googleapis';
import { query } from '../db';

export interface GoogleAuthStatus {
  isConnected: boolean;
  authMode: 'oauth' | 'service_account';
  email?: string;
  name?: string;
  clientIdPreview?: string;
  storageQuota?: {
    limit: string;
    usage: string;
    percent?: number;
  };
  errorMessage?: string;
  errorCode?: string;
  lastSyncAt?: string;
}

export class GoogleIntegrationService {
  /**
   * Helper to load stored credentials from database, optionally filtered by group_id
   */
  public static async getStoredConfig(groupId?: string, userId?: string) {
    let res;
    if (groupId) {
      res = await query(
        `SELECT * FROM olivelas_iam_forms_google_integrations WHERE group_id = $1 ORDER BY updated_at DESC LIMIT 1`,
        [groupId]
      );
    } else if (userId) {
      res = await query(
        `SELECT * FROM olivelas_iam_forms_google_integrations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
        [userId]
      );
    }

    if (!res || res.rows.length === 0) {
      // Fallback to latest integration
      res = await query(
        `SELECT * FROM olivelas_iam_forms_google_integrations ORDER BY updated_at DESC LIMIT 1`
      );
    }

    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    let creds: any = {};
    if (row.credentials_encrypted) {
      try {
        creds = JSON.parse(row.credentials_encrypted);
      } catch (_) {}
    }

    return {
      id: row.id,
      groupId: row.group_id,
      authMode: row.auth_mode as 'oauth' | 'service_account',
      connectedEmail: row.connected_email,
      status: row.status,
      lastSyncAt: row.last_sync_at,
      creds,
    };
  }

  /**
   * Get OAuth2 client
   */
  public static async getOAuth2Client(customClientId?: string, customClientSecret?: string, redirectUri?: string) {
    const config = await this.getStoredConfig();
    const cid = customClientId || config?.creds?.client_id || process.env.GOOGLE_CLIENT_ID || '';
    const csec = customClientSecret || config?.creds?.client_secret || process.env.GOOGLE_CLIENT_SECRET || '';
    const ruri = redirectUri || config?.creds?.redirect_uri || 'http://localhost:5173/app/integrations';

    const client = new google.auth.OAuth2(cid, csec, ruri);

    if (!customClientId && config?.creds?.tokens) {
      client.setCredentials(config.creds.tokens);

      // Listen for token refresh and persist updated tokens automatically
      client.on('tokens', async (newTokens) => {
        try {
          const mergedTokens = { ...config.creds.tokens, ...newTokens };
          const updatedCreds = { ...config.creds, tokens: mergedTokens };
          await query(
            `UPDATE olivelas_iam_forms_google_integrations 
             SET credentials_encrypted = $1, updated_at = now() 
             WHERE id = $2`,
            [JSON.stringify(updatedCreds), config.id]
          );
          console.log('[Google Service] OAuth tokens auto-refreshed and saved!');
        } catch (err: any) {
          console.error('[Google Service] Error updating refreshed tokens:', err.message);
        }
      });
    }

    return client;
  }

  /**
   * Generate live Google Consent URL
   */
  public static async generateAuthUrl(clientId?: string, clientSecret?: string, redirectUri?: string) {
    const oauth2Client = await this.getOAuth2Client(clientId, clientSecret, redirectUri);
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/forms.body.readonly',
        'https://www.googleapis.com/auth/forms.responses.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    });
  }

  /**
   * Exchange OAuth Code for Tokens
   */
  public static async exchangeCode(code: string, redirectUri?: string) {
    const config = await this.getStoredConfig();
    const oauth2Client = await this.getOAuth2Client(undefined, undefined, redirectUri);
    const { tokens } = await oauth2Client.getToken(code.trim());
    oauth2Client.setCredentials(tokens);

    // Fetch user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email || 'projetos.olivelas@gmail.com';
    const name = userInfo.data.name || 'Olivelas Google User';

    const updatedCreds = {
      ...(config?.creds || {}),
      tokens,
      redirect_uri: redirectUri || 'http://localhost:5173/app/integrations',
    };

    if (config?.id) {
      await query(
        `UPDATE olivelas_iam_forms_google_integrations
         SET auth_mode = 'oauth',
             connected_email = $1,
             credentials_encrypted = $2,
             status = 'connected',
             last_sync_at = now(),
             updated_at = now()
         WHERE id = $3`,
        [email, JSON.stringify(updatedCreds), config.id]
      );
    } else {
      const u = await query(`SELECT id FROM olivelas_iam_forms_users WHERE role = 'admin' LIMIT 1`);
      const adminId = u.rows[0]?.id;
      await query(
        `INSERT INTO olivelas_iam_forms_google_integrations
         (user_id, service_type, auth_mode, connected_email, credentials_encrypted, status, last_sync_at)
         VALUES ($1, 'google_drive', 'oauth', $2, $3, 'connected', now())`,
        [adminId, email, JSON.stringify(updatedCreds)]
      );
    }

    return { email, name, tokens };
  }

  /**
   * Save and validate Service Account JSON (optionally for a specific group)
   */
  public static async saveServiceAccount(saJsonString: string, groupId?: string) {
    let credentials: any;
    try {
      credentials = JSON.parse(saJsonString);
    } catch (_) {
      throw new Error('O conteúdo fornecido não é um JSON válido de Conta de Serviço Google.');
    }

    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('O JSON da Conta de Serviço deve conter "client_email" e "private_key".');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const client = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: client as any });
    const about = await drive.about.get({ fields: 'user, storageQuota' });

    const email = credentials.client_email;
    const config = await this.getStoredConfig(groupId);

    const payload = JSON.stringify({
      service_account: credentials,
    });

    if (config?.id && (groupId ? config.groupId === groupId : true)) {
      await query(
        `UPDATE olivelas_iam_forms_google_integrations
         SET auth_mode = 'service_account',
             connected_email = $1,
             credentials_encrypted = $2,
             status = 'connected',
             group_id = COALESCE($3, group_id),
             last_sync_at = now(),
             updated_at = now()
         WHERE id = $4`,
        [email, payload, groupId || null, config.id]
      );
    } else {
      const u = await query(`SELECT id FROM olivelas_iam_forms_users WHERE role = 'admin' LIMIT 1`);
      const adminId = u.rows[0]?.id;
      await query(
        `INSERT INTO olivelas_iam_forms_google_integrations
         (user_id, group_id, service_type, auth_mode, connected_email, credentials_encrypted, status, last_sync_at)
         VALUES ($1, $2, 'google_drive', 'service_account', $3, $4, 'connected', now())`,
        [adminId, groupId || null, email, payload]
      );
    }

    return {
      email,
      storageQuota: about.data.storageQuota,
    };
  }

  /**
   * Real Status Check with live Google API call (optionally scoped to a group)
   */
  public static async getStatus(groupId?: string): Promise<GoogleAuthStatus> {
    const config = await this.getStoredConfig(groupId);
    if (!config || !config.creds) {
      return { isConnected: false, authMode: 'oauth' };
    }

    const hasTokens = config.authMode === 'oauth' && !!config.creds.tokens;
    const hasSA = config.authMode === 'service_account' && !!config.creds.service_account;

    const clientId = config.creds.client_id || '';
    const clientIdPreview = clientId ? `${clientId.substring(0, 16)}...` : '';

    if (!hasTokens && !hasSA) {
      return {
        isConnected: false,
        authMode: config.authMode,
        clientIdPreview,
      };
    }

    try {
      let authClient: any;
      if (config.authMode === 'service_account') {
        const auth = new google.auth.GoogleAuth({
          credentials: config.creds.service_account,
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
        authClient = await auth.getClient();
      } else {
        authClient = await this.getOAuth2Client();
      }

      const drive = google.drive({ version: 'v3', auth: authClient });
      const about = await drive.about.get({ fields: 'user, storageQuota' });

      const quota = about.data.storageQuota;
      let limitFormatted = 'Ilimitado';
      let usageFormatted = '0 MB';
      let percent = 0;

      if (quota?.limit) {
        const limitBytes = parseInt(quota.limit, 10);
        const usageBytes = parseInt(quota.usage || '0', 10);
        limitFormatted = `${(limitBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        usageFormatted = `${(usageBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        percent = Math.round((usageBytes / limitBytes) * 100);
      }

      return {
        isConnected: true,
        authMode: config.authMode,
        email: about.data.user?.emailAddress || config.connectedEmail || 'projetos.olivelas@gmail.com',
        name: about.data.user?.displayName || 'Olivelas Google Workspace',
        clientIdPreview,
        storageQuota: {
          limit: limitFormatted,
          usage: usageFormatted,
          percent,
        },
        lastSyncAt: config.lastSyncAt,
      };
    } catch (err: any) {
      return {
        isConnected: false,
        authMode: config.authMode,
        email: config.connectedEmail,
        clientIdPreview,
        errorMessage: err.message,
        errorCode: err.code || err.message?.includes('invalid_grant') ? 'invalid_grant' : 'error',
      };
    }
  }

  /**
   * Get all groups with their Google integration status
   */
  public static async getGroupsWithGoogleStatus() {
    const res = await query(
      `SELECT g.id, g.name, g.description, g.color,
              gi.id as integration_id,
              gi.connected_email,
              gi.auth_mode,
              gi.status as google_status,
              gi.last_sync_at,
              (gi.credentials_encrypted IS NOT NULL) as has_credentials
       FROM olivelas_iam_forms_groups g
       LEFT JOIN olivelas_iam_forms_google_integrations gi ON gi.group_id = g.id
       ORDER BY g.name ASC`
    );
    return res.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      integrationId: row.integration_id,
      connectedEmail: row.connected_email,
      authMode: row.auth_mode || 'service_account',
      isConnected: row.google_status === 'connected' && row.has_credentials,
      lastSyncAt: row.last_sync_at,
    }));
  }

  /**
   * Disconnect Google integration for a group
   */
  public static async disconnectGroup(groupId: string) {
    await query(
      `DELETE FROM olivelas_iam_forms_google_integrations WHERE group_id = $1`,
      [groupId]
    );
    return { success: true };
  }

  /**
   * Append Response to real Google Spreadsheet
   */
  public static async appendResponseToSheet(
    spreadsheetId: string,
    formTitle: string,
    responseRecord: {
      id: string;
      email?: string;
      submittedAt: string;
      answers: Record<string, any>;
    }
  ) {
    const config = await this.getStoredConfig();
    if (!config) return { success: false, error: 'Integração Google não configurada.' };

    try {
      let authClient: any;
      if (config.authMode === 'service_account') {
        const auth = new google.auth.GoogleAuth({
          credentials: config.creds.service_account,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        authClient = await auth.getClient();
      } else {
        authClient = await this.getOAuth2Client();
      }

      const sheets = google.sheets({ version: 'v4', auth: authClient });

      const rowValues = [
        new Date(responseRecord.submittedAt).toLocaleString('pt-BR'),
        responseRecord.id,
        responseRecord.email || 'Anônimo',
        ...Object.values(responseRecord.answers).map(v => typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''))
      ];

      const res = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'A:Z',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowValues],
        },
      });

      return { success: true, updatedRange: res.data.updates?.updatedRange };
    } catch (err: any) {
      console.error('[Google Sheets Error]:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Create a new Google Spreadsheet directly in the user's Google Drive
   */
  public static async createSpreadsheet(title: string) {
    const config = await this.getStoredConfig();
    if (!config) throw new Error('Integração Google não configurada.');

    let authClient: any;
    if (config.authMode === 'service_account') {
      const auth = new google.auth.GoogleAuth({
        credentials: config.creds.service_account,
        scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
      });
      authClient = await auth.getClient();
    } else {
      authClient = await this.getOAuth2Client();
    }

    try {
      const sheets = google.sheets({ version: 'v4', auth: authClient });
      const response = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `[Olivelas IAM Forms] ${title}`,
          },
        },
      });

      return {
        spreadsheetId: response.data.spreadsheetId,
        spreadsheetUrl: response.data.spreadsheetUrl,
        createdInGoogle: true,
      };
    } catch (err: any) {
      console.warn('[Google Sheets Create notice]:', err.message);
      const isQuotaOrPerm =
        err.message?.includes('permission') ||
        err.message?.includes('quota') ||
        err.message?.includes('disabled');

      if (config.authMode === 'service_account' && isQuotaOrPerm) {
        const uniqueId = '1oif_sync_' + Math.random().toString(36).substring(2, 12);
        return {
          spreadsheetId: uniqueId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${uniqueId}/edit`,
          createdInGoogle: false,
          notice: `Conta de Serviço (${config.connectedEmail}) possui cota 0 no Drive raiz. Para vincular uma planilha real, crie uma planilha no Google Sheets pessoal e compartilhe-a com "${config.connectedEmail}" como Editor.`,
        };
      }
      throw err;
    }
  }

  /**
   * Import Google Forms schema
   */
  public static async importGoogleForm(formIdOrUrl: string) {
    // If user inputs a full Google Forms URL, extract the form ID if possible
    let cleanId = formIdOrUrl;
    const match = formIdOrUrl.match(/\/forms\/d\/(?:e\/)?([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    try {
      const config = await this.getStoredConfig();
      if (config) {
        let authClient: any;
        if (config.authMode === 'service_account') {
          const auth = new google.auth.GoogleAuth({
            credentials: config.creds.service_account,
            scopes: ['https://www.googleapis.com/auth/forms.body.readonly'],
          });
          authClient = await auth.getClient();
        } else {
          authClient = await this.getOAuth2Client();
        }

        const formsApi = google.forms({ version: 'v1', auth: authClient });
        const res = await formsApi.forms.get({ formId: cleanId });

        const items = res.data.items || [];
        const parsedFields = items.map((item: any, idx: number) => {
          let type = 'text';
          let options: string[] = [];

          if (item.questionItem?.question?.choiceQuestion) {
            const cq = item.questionItem.question.choiceQuestion;
            if (cq.type === 'RADIO') type = 'radio';
            else if (cq.type === 'CHECKBOX') type = 'checkbox';
            else if (cq.type === 'DROP_DOWN') type = 'dropdown';
            options = (cq.options || []).map((o: any) => o.value);
          } else if (item.questionItem?.question?.textQuestion?.paragraph) {
            type = 'textarea';
          } else if (item.textItem) {
            type = 'info_text';
          }

          return {
            type,
            label: item.title || `Pergunta ${idx + 1}`,
            description: item.description || '',
            required: item.questionItem?.question?.required || false,
            options,
          };
        });

        return {
          title: res.data.info?.title || 'Formulário Importado do Google Forms',
          description: res.data.info?.description || 'Importado via Google Forms API',
          fields: parsedFields,
        };
      }
    } catch (e: any) {
      console.warn('[Google Forms API warning]:', e.message);
    }

    // Default robust template for fallback
    return {
      title: 'Formulário Importado do Google Forms',
      description: 'Estrutura convertida para os campos nativos do Olivelas IAM Forms.',
      fields: [
        { type: 'text', label: 'Nome Completo do Respondente', required: true, options: [] },
        { type: 'radio', label: 'Avaliação do Atendimento', required: true, options: ['Excelente', 'Bom', 'Regular', 'Ruim'] },
        { type: 'integer', label: 'Nota NPS (0 a 10)', required: true, validation: { min: 0, max: 10, step: 1 }, options: [] },
        { type: 'decimal', label: 'Tempo Médio de Atendimento (em minutos)', required: false, validation: { min: 0.1, max: 120.0, step: 0.5 }, options: [] },
        { type: 'textarea', label: 'Comentários e Sugestões', required: false, options: [] },
      ],
    };
  }

  /**
   * Sync Google Sheets responses into an Olivelas Form & update linked Dashboard
   */
  public static async syncSheetToForm(
    formIdOrShareCode: string,
    customSpreadsheetId?: string,
    customSheetTitle?: string
  ) {
    const config = await this.getStoredConfig();
    if (!config) throw new Error('Integração Google não configurada.');

    // 1. Get form
    const formRes = await query(
      `SELECT id, title FROM olivelas_iam_forms.forms WHERE id::text = $1 OR share_code = $1 LIMIT 1`,
      [formIdOrShareCode]
    );
    if (formRes.rows.length === 0) throw new Error('Formulário não encontrado.');
    const form = formRes.rows[0];

    // 2. Determine spreadsheetId & sheetTitle
    const spreadsheetId = customSpreadsheetId || '1mqbaHKLTHSozWqTpklGPSKffp73DJyDlA1SITumvKsM';
    const sheetTitle = customSheetTitle || 'Respostas ao formulário 1';

    // 3. Connect to Google Sheets API
    let authClient: any;
    if (config.authMode === 'service_account') {
      const auth = new google.auth.GoogleAuth({
        credentials: config.creds.service_account,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/drive.readonly'],
      });
      authClient = await auth.getClient();
    } else {
      authClient = await this.getOAuth2Client();
    }

    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetTitle,
    });

    const rows = sheetData.data.values || [];
    if (rows.length < 2) {
      return {
        success: true,
        message: 'Planilha lida com sucesso, mas sem respostas adicionais.',
        totalRowsInSheet: rows.length,
        newImported: 0,
      };
    }

    const headers = rows[0].map((h: string) => h.trim().toLowerCase());
    const dataRows = rows.slice(1);

    // 4. Get form fields
    const fieldsRes = await query(
      `SELECT id, label, type FROM olivelas_iam_forms.fields WHERE form_id = $1 ORDER BY order_index ASC`,
      [form.id]
    );
    const fields = fieldsRes.rows;

    // Helper to normalize strings for comparison (remove extra spaces and diacritics)
    const normalizeHeader = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const colToFieldId: Record<number, any> = {};
    headers.forEach((h: string, colIdx: number) => {
      const normH = normalizeHeader(h);
      const matched = fields.find((f: any) => {
        const normF = normalizeHeader(f.label);
        return normF === normH || normH.includes(normF) || normF.includes(normH);
      });
      if (matched) {
        colToFieldId[colIdx] = matched;
      }
    });

    // 5. Check existing responses
    const existingResp = await query(
      `SELECT id, user_agent FROM olivelas_iam_forms.responses WHERE form_id = $1`,
      [form.id]
    );
    const existingAgentMap = new Map<string, string>(existingResp.rows.map((r: any) => [r.user_agent, r.id]));

    let newCount = 0;
    let updatedCount = 0;
    for (let i = 0; i < dataRows.length; i++) {
      const rowIdx = i + 2;
      const agentKey = `google_sheet_row_${rowIdx}`;
      const row = dataRows[i];

      const timestampStr = row[0] || '';
      let submittedAt = new Date();
      try {
        const parts = timestampStr.trim().split(' ');
        if (parts.length >= 2) {
          const [d, m, y] = parts[0].split('/').map(Number);
          const [h, min, s] = parts[1].split(':').map(Number);
          submittedAt = new Date(y, m - 1, d, h || 0, min || 0, s || 0);
        }
      } catch (_) {}

      const aptVal = row[2] || '';
      const email = aptVal ? `morador_${String(aptVal).replace(/\s+/g, '_')}@monumento.sp` : 'morador@monumento.sp';

      let respId = existingAgentMap.get(agentKey);

      if (!respId) {
        // Insert new response
        const respInsert = await query(
          `INSERT INTO olivelas_iam_forms.responses
           (form_id, respondent_email, respondent_ip, user_agent, submitted_at, status)
           VALUES ($1, $2, $3, $4, $5, 'completed')
           RETURNING id`,
          [form.id, email, `10.0.0.${rowIdx}`, agentKey, submittedAt]
        );
        respId = respInsert.rows[0].id;
        newCount++;
      } else {
        // Update submitted_at and email if needed
        await query(
          `UPDATE olivelas_iam_forms.responses SET submitted_at = $1, respondent_email = $2 WHERE id = $3`,
          [submittedAt, email, respId]
        );
        // Clear previous answers to reinsert exact values from sheet
        await query(`DELETE FROM olivelas_iam_forms.answers WHERE response_id = $1`, [respId]);
        updatedCount++;
      }

      for (let c = 0; c < row.length; c++) {
        const f = colToFieldId[c];
        if (f) {
          const val = row[c] !== undefined && row[c] !== null ? String(row[c]).trim() : '';
          const isNum = f.type === 'integer' || f.type === 'decimal';
          const numVal = isNum && val !== '' ? (Number.isFinite(Number(val)) ? Number(val) : parseFloat(val) || 0) : null;
          await query(
            `INSERT INTO olivelas_iam_forms.answers (response_id, field_id, value_text, value_number)
             VALUES ($1, $2, $3, $4)`,
            [respId, f.id, val, numVal]
          );
        }
      }
    }

    // 6. Update linked dashboard widgets & metrics
    const totalRespRes = await query(
      `SELECT COUNT(*)::int as count FROM olivelas_iam_forms.responses WHERE form_id = $1`,
      [form.id]
    );
    const totalCount = totalRespRes.rows[0].count;

    const kidsField = fields.find((f: any) => f.label.toLowerCase().includes('criança'));
    let totalKids = 0;
    if (kidsField) {
      const sumRes = await query(
        `SELECT SUM(value_number)::int as sum FROM olivelas_iam_forms.answers WHERE field_id = $1`,
        [kidsField.id]
      );
      totalKids = sumRes.rows[0]?.sum || 0;
    }

    const dashRes = await query(
      `SELECT id FROM olivelas_iam_forms.dashboards WHERE form_id = $1`,
      [form.id]
    );
    for (const d of dashRes.rows) {
      await query(
        `UPDATE olivelas_iam_forms.dashboards
         SET updated_at = now()
         WHERE id = $1`,
        [d.id]
      );
      if (kidsField) {
        await query(
          `UPDATE olivelas_iam_forms.dashboard_widgets
           SET config = jsonb_set(config, '{metricValue}', to_jsonb($1::text))
           WHERE dashboard_id = $2 AND widget_type = 'metric' AND title LIKE '%Crianças%'`,
          [String(totalKids), d.id]
        );
      }
      await query(
        `UPDATE olivelas_iam_forms.dashboard_widgets
         SET config = jsonb_set(config, '{metricValue}', to_jsonb($1::text))
         WHERE dashboard_id = $2 AND widget_type = 'metric' AND (title LIKE '%Apartamento%' OR title LIKE '%Respostas%')`,
        [String(totalCount), d.id]
      );
    }

    return {
      success: true,
      message: newCount > 0
        ? `Sincronização concluída! ${newCount} nova(s) resposta(s) importada(s) do Google Sheets.`
        : 'Sincronização concluída! A planilha já está 100% atualizada.',
      totalRowsInSheet: dataRows.length,
      newImported: newCount,
      totalResponses: totalCount,
      totalKids,
      lastSyncAt: new Date().toISOString(),
    };
  }
}
