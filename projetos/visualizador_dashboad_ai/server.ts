import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbStore, ADMIN_EMAIL, type UserCredentials } from './server/db/store';
import {
  getGoogleConfigStatus,
  getAuthenticatedGoogleClient,
  loadGoogleCredentials,
  type GoogleCredentialsConfig,
} from './server/services/google/auth';
import { listDriveFiles } from './server/services/google/drive';
import {
  getSpreadsheetMetadata,
  getSpreadsheetData,
} from './server/services/google/sheets';
import {
  getGoogleFormData,
  extractFormId,
} from './server/services/google/forms';
import {
  analyzeQualitativeQuestionServer,
  analyzeOverallSurveyServer,
} from './server/services/ai/gemini';
import { SpreadsheetTransformerService } from './src/services/data/spreadsheetTransformer';
import type { Survey } from './src/types/survey';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // In-memory cache for public default survey
  let cachedPublicSurvey: Survey | null = null;
  let lastPublicCacheTime = 0;
  const PUBLIC_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

  /**
   * Resolves Google credentials specifically for system/admin operations
   * (e.g. serving public default survey from Google Drive)
   */
  const resolveSystemGoogleCreds = (): GoogleCredentialsConfig | null => {
    const adminCreds = dbStore.getAdminCredentials();
    if (adminCreds?.googleClientEmail && adminCreds?.googlePrivateKey) {
      return {
        clientEmail: adminCreds.googleClientEmail,
        privateKey: adminCreds.googlePrivateKey,
        projectId: adminCreds.googleProjectId,
      };
    }
    return loadGoogleCredentials();
  };

  /**
   * Helper to extract credentials from authenticated user.
   * Admin (willian.o.jesus@gmail.com) falls back to system/env credentials.
   * Regular users ONLY use their own explicit credentials.
   */
  const resolveGoogleCreds = (req: express.Request): GoogleCredentialsConfig | null => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const fullUser = dbStore.getFullUserByToken(authHeader);
      if (fullUser) {
        // 1. If user has explicit credentials, use them
        if (fullUser.credentials?.googleClientEmail && fullUser.credentials?.googlePrivateKey) {
          return {
            clientEmail: fullUser.credentials.googleClientEmail,
            privateKey: fullUser.credentials.googlePrivateKey,
            projectId: fullUser.credentials.googleProjectId,
          };
        }
        // 2. If user is ADMIN, can fallback to system/admin credentials
        if (fullUser.email.toLowerCase() === ADMIN_EMAIL) {
          return resolveSystemGoogleCreds();
        }
        // 3. Regular users DO NOT get admin/server credentials!
        return null;
      }
    }
    return null;
  };

  /**
   * Resolves Gemini API Key:
   * 1. Explicit key in request body
   * 2. User's saved geminiApiKey (if authenticated)
   * 3. undefined (falls back to process.env.GEMINI_API_KEY from AI Studio)
   */
  const resolveGeminiApiKey = (req: express.Request): string | undefined => {
    if (req.body?.geminiApiKey && typeof req.body.geminiApiKey === 'string' && req.body.geminiApiKey.trim()) {
      return req.body.geminiApiKey.trim();
    }
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const fullUser = dbStore.getFullUserByToken(authHeader);
      if (fullUser?.credentials?.geminiApiKey && fullUser.credentials.geminiApiKey.trim()) {
        return fullUser.credentials.geminiApiKey.trim();
      }
    }
    return undefined;
  };

  // ============================================================
  // PUBLIC DEFAULT SURVEY ENDPOINT (Unauthenticated Guests)
  // ============================================================

  /**
   * GET /api/public/default-survey
   * Fetches the default survey configured in Google Drive for unauthenticated users
   */
  app.get('/api/public/default-survey', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const now = Date.now();

      if (!forceRefresh && cachedPublicSurvey && now - lastPublicCacheTime < PUBLIC_CACHE_TTL_MS) {
        return res.json({
          survey: cachedPublicSurvey,
          isReadOnly: true,
          isDefaultPublic: true,
          sourceName: 'Google Drive (Pesquisa de Adoção de IA)',
        });
      }

      const systemCreds = resolveSystemGoogleCreds();
      const status = getGoogleConfigStatus(systemCreds);

      if (!status.configured) {
        return res.status(503).json({
          error: 'Google Drive ainda não configurado no servidor.',
          details: 'O administrador (willian.o.jesus@gmail.com) precisa configurar as credenciais do Google Cloud.',
        });
      }

      const authClient = await getAuthenticatedGoogleClient(systemCreds);

      // Known spreadsheet ID from Google Drive configuration
      const SPREADSHEET_ID = '1P5lEji3hATA29LL6FET4bDTxH_AQ_ZAMIv3-VQT62ic';
      const spreadsheetData = await getSpreadsheetData(authClient, SPREADSHEET_ID);

      const transformed = SpreadsheetTransformerService.transformToSurvey(spreadsheetData);
      transformed.name = 'Pesquisa: Uso da Inteligência Artificial no Ambiente de Trabalho';
      transformed.title = 'Pesquisa: Uso da Inteligência Artificial no Ambiente de Trabalho';
      transformed.description = 'Pesquisa analítica de alta fidelidade conectada diretamente ao Google Drive e Google Sheets.';

      cachedPublicSurvey = transformed;
      lastPublicCacheTime = now;

      res.json({
        survey: transformed,
        isReadOnly: true,
        isDefaultPublic: true,
        sourceName: 'Google Drive (Pesquisa de Adoção de IA)',
      });
    } catch (err: any) {
      console.error('[Public Default Survey API Error]', err.message);
      res.status(500).json({
        error: 'Não foi possível carregar a pesquisa do Google Drive.',
        details: err.message || 'Erro ao comunicar com a API do Google Sheets.',
      });
    }
  });

  // ============================================================
  // AUTHENTICATION & USER WORKSPACE ENDPOINTS
  // ============================================================

  /**
   * POST /api/auth/register
   * Registers a new user and returns user info + session token
   */
  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, password, name } = req.body || {};
      const result = dbStore.register(email, password, name);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao realizar cadastro.' });
    }
  });

  /**
   * POST /api/auth/login
   * Authenticates user with email/password and returns session token
   */
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body || {};
      const result = dbStore.login(email, password);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Credenciais inválidas.' });
    }
  });

  /**
   * GET /api/auth/me
   * Returns current authenticated user and workspace state.
   * Isolates admin vs regular user credentials visibility.
   */
  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    const user = dbStore.getUserByToken(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }
    const fullUser = dbStore.getFullUserByToken(authHeader);
    const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL;

    let googleStatus = { configured: false, clientEmail: undefined as string | undefined };

    if (isAdmin) {
      const systemCreds = resolveSystemGoogleCreds();
      const status = getGoogleConfigStatus(systemCreds);
      googleStatus = {
        configured: status.configured,
        clientEmail: status.clientEmail,
      };
    } else {
      const userGoogleStatus = getGoogleConfigStatus(
        fullUser?.credentials?.googleClientEmail && fullUser?.credentials?.googlePrivateKey
          ? {
              clientEmail: fullUser.credentials.googleClientEmail,
              privateKey: fullUser.credentials.googlePrivateKey,
              projectId: fullUser.credentials.googleProjectId,
            }
          : undefined
      );
      googleStatus = {
        configured: userGoogleStatus.configured,
        clientEmail: userGoogleStatus.clientEmail,
      };
    }

    res.json({
      user: {
        ...user,
        isAdmin,
      },
      isAdmin,
      googleConfigured: googleStatus.configured,
      googleClientEmail: googleStatus.clientEmail,
      hasGeminiApiKey: Boolean(fullUser?.credentials?.geminiApiKey),
      usingBuiltInAI: !fullUser?.credentials?.geminiApiKey,
    });
  });

  /**
   * POST /api/auth/logout
   */
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      dbStore.logout(authHeader);
    }
    res.json({ success: true });
  });

  /**
   * GET /api/auth/credentials
   * Returns sanitized credentials status (NO secret keys returned)
   */
  app.get('/api/auth/credentials', (req, res) => {
    const authHeader = req.headers.authorization;
    const user = dbStore.getFullUserByToken(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL;
    const creds = user.credentials || {};

    let googleStatus = { configured: false, clientEmail: undefined as string | undefined, projectId: undefined as string | undefined };

    if (isAdmin) {
      const systemCreds = resolveSystemGoogleCreds();
      const status = getGoogleConfigStatus(systemCreds);
      googleStatus = {
        configured: status.configured,
        clientEmail: status.clientEmail,
        projectId: status.projectId,
      };
    } else {
      const status = getGoogleConfigStatus(
        creds.googleClientEmail && creds.googlePrivateKey
          ? {
              clientEmail: creds.googleClientEmail,
              privateKey: creds.googlePrivateKey,
              projectId: creds.googleProjectId,
            }
          : undefined
      );
      googleStatus = {
        configured: status.configured,
        clientEmail: status.clientEmail,
        projectId: status.projectId,
      };
    }

    res.json({
      isAdmin,
      googleConfigured: googleStatus.configured,
      googleClientEmail: googleStatus.clientEmail,
      googleProjectId: googleStatus.projectId,
      hasGoogleApiKey: Boolean(creds.googleApiKey),
      hasGeminiApiKey: Boolean(creds.geminiApiKey),
      isUsingAiStudioDefault: !creds.geminiApiKey,
    });
  });

  /**
   * POST /api/auth/credentials
   * Updates user-specific Google credentials and AI keys securely on backend
   */
  app.post('/api/auth/credentials', (req, res) => {
    const authHeader = req.headers.authorization;
    const user = dbStore.getFullUserByToken(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
      const { serviceAccountJson, clientEmail, privateKey, projectId, googleApiKey, geminiApiKey } = req.body || {};
      const updates: UserCredentials = {};

      if (serviceAccountJson && typeof serviceAccountJson === 'string') {
        try {
          const parsed = JSON.parse(serviceAccountJson);
          updates.googleClientEmail = parsed.client_email || parsed.clientEmail;
          updates.googlePrivateKey = parsed.private_key || parsed.privateKey;
          updates.googleProjectId = parsed.project_id || parsed.projectId;
        } catch {
          return res.status(400).json({ error: 'JSON da Service Account inválido.' });
        }
      } else {
        if (clientEmail) updates.googleClientEmail = clientEmail;
        if (privateKey) updates.googlePrivateKey = privateKey;
        if (projectId) updates.googleProjectId = projectId;
      }

      if (googleApiKey !== undefined) updates.googleApiKey = googleApiKey;
      if (geminiApiKey !== undefined) updates.geminiApiKey = geminiApiKey;

      dbStore.updateUserCredentials(user.id, updates);

      // If admin updated credentials, clear cache for default public survey
      if (user.email.toLowerCase() === ADMIN_EMAIL && updates.googleClientEmail) {
        cachedPublicSurvey = null;
      }

      const status = getGoogleConfigStatus({
        clientEmail: updates.googleClientEmail || user.credentials?.googleClientEmail,
        privateKey: updates.googlePrivateKey || user.credentials?.googlePrivateKey,
        projectId: updates.googleProjectId || user.credentials?.googleProjectId,
      });

      res.json({
        success: true,
        message: 'Credenciais salvas com sucesso.',
        googleConfigured: status.configured,
        googleClientEmail: status.clientEmail,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao salvar credenciais.' });
    }
  });

  // ============================================================
  // PROJECTS & DASHBOARDS PERSISTENCE ENDPOINTS
  // ============================================================

  /**
   * GET /api/projects
   * Returns all survey projects saved for the authenticated user
   */
  app.get('/api/projects', (req, res) => {
    const authHeader = req.headers.authorization;
    const user = dbStore.getUserByToken(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const projects = dbStore.getUserProjects(user.id);
    res.json({ projects });
  });

  /**
   * GET /api/projects/:id
   * Returns specific survey project
   */
  app.get('/api/projects/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    const user = dbStore.getUserByToken(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const project = dbStore.getProject(user.id, req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    res.json({ project });
  });

  /**
   * POST /api/projects
   * Saves or updates a survey project for the user
   */
  app.post('/api/projects', (req, res) => {
    const authHeader = req.headers.authorization;
    const user = dbStore.getUserByToken(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
      const { id, name, description, survey, displaySettings } = req.body || {};
      if (!survey || !Array.isArray(survey.questions)) {
        return res.status(400).json({ error: 'Dados da pesquisa inválidos.' });
      }

      const project = dbStore.saveProject(user.id, {
        id,
        name: name || survey.title || 'Pesquisa',
        description,
        survey,
        displaySettings,
      });

      res.json({ success: true, project });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao salvar projeto.' });
    }
  });

  /**
   * DELETE /api/projects/:id
   */
  app.delete('/api/projects/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    const user = dbStore.getUserByToken(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const success = dbStore.deleteProject(user.id, req.params.id);
    res.json({ success });
  });

  /**
   * GET /api/projects/:id/export
   * Generates a clean, sanitized JSON backup of the dashboard and survey
   * STRICTLY EXCLUDES ANY PASSWORDS OR CREDENTIALS
   */
  app.get('/api/projects/:id/export', (req, res) => {
    const authHeader = req.headers.authorization;
    const user = dbStore.getUserByToken(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
      const backup = dbStore.exportProjectBackup(user.id, req.params.id);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="backup_dashboard_${req.params.id}.json"`);
      res.json(backup);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao exportar backup do dashboard.' });
    }
  });

  /**
   * POST /api/projects/import
   * Imports a sanitized dashboard JSON backup into the user workspace
   */
  app.post('/api/projects/import', (req, res) => {
    const authHeader = req.headers.authorization;
    const user = dbStore.getUserByToken(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    try {
      const backup = req.body;
      const project = dbStore.importProjectBackup(user.id, backup);
      res.status(201).json({ success: true, project });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Falha ao restaurar backup JSON.' });
    }
  });

  // ============================================================
  // GOOGLE INTEGRATION API ENDPOINTS (Server-Side Only)
  // ============================================================

  /**
   * GET /api/google/status
   * Checks if Google service account is configured without exposing private credentials
   */
  app.get('/api/google/status', (req, res) => {
    try {
      const creds = resolveGoogleCreds(req);
      const status = getGoogleConfigStatus(creds);
      res.json(status);
    } catch (err: any) {
      res.status(500).json({
        configured: false,
        error: err.message || 'Erro ao verificar configuração do Google.',
      });
    }
  });

  /**
   * GET /api/google/drive/files
   * Lists relevant survey spreadsheets and files from Google Drive
   */
  app.get('/api/google/drive/files', async (req, res) => {
    try {
      const creds = resolveGoogleCreds(req);
      const status = getGoogleConfigStatus(creds);
      if (!status.configured) {
        return res.status(400).json({
          error: 'Google Drive não configurado.',
          details:
            'Configure a Service Account do Google nas Configurações da sua conta ou via variáveis de ambiente.',
        });
      }

      const authClient = await getAuthenticatedGoogleClient(creds);
      const searchQuery = typeof req.query.q === 'string' ? req.query.q : undefined;
      const files = await listDriveFiles(authClient, searchQuery);

      res.json({ files });
    } catch (err: any) {
      console.error('[Google Drive API Error]', err.message);
      res.status(500).json({
        error: 'Não foi possível acessar o Google Drive.',
        details: err.message || 'Falha na comunicação com a API do Google Drive.',
      });
    }
  });

  /**
   * GET /api/google/sheets/:fileId/metadata
   * Returns metadata and list of sheet tabs for the selected file
   */
  app.get('/api/google/sheets/:fileId/metadata', async (req, res) => {
    try {
      const { fileId } = req.params;
      if (!fileId) {
        return res.status(400).json({ error: 'fileId é obrigatório' });
      }

      const creds = resolveGoogleCreds(req);
      const authClient = await getAuthenticatedGoogleClient(creds);
      const metadata = await getSpreadsheetMetadata(authClient, fileId);

      res.json(metadata);
    } catch (err: any) {
      console.error('[Google Sheets Metadata Error]', err.message);
      res.status(500).json({
        error: 'Não foi possível obter os metadados da planilha.',
        details: err.message || 'Falha ao ler abas da planilha.',
      });
    }
  });

  /**
   * GET /api/google/sheets/:fileId
   * Fetches data for the given spreadsheet/file and returns standardized SpreadsheetData
   */
  app.get('/api/google/sheets/:fileId', async (req, res) => {
    try {
      const { fileId } = req.params;
      const sheetName = typeof req.query.sheet === 'string' ? req.query.sheet : undefined;

      if (!fileId) {
        return res.status(400).json({ error: 'fileId é obrigatório' });
      }

      const creds = resolveGoogleCreds(req);
      const authClient = await getAuthenticatedGoogleClient(creds);
      const spreadsheetData = await getSpreadsheetData(authClient, fileId, sheetName);

      res.json(spreadsheetData);
    } catch (err: any) {
      console.error('[Google Sheets Data Error]', err.message);
      res.status(500).json({
        error: 'Não foi possível carregar os dados da planilha.',
        details: err.message || 'Falha ao processar linhas e colunas da planilha.',
      });
    }
  });

  // ============================================================
  // GOOGLE FORMS ENDPOINTS
  // ============================================================

  /**
   * POST /api/google/forms/parse-url
   * Validates and extracts formId from a Google Forms URL or raw ID
   */
  app.post('/api/google/forms/parse-url', (req, res) => {
    try {
      const { url } = req.body || {};
      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          isValid: false,
          error: 'URL ou ID do formulário não fornecido.',
        });
      }

      const formId = extractFormId(url);
      if (!formId) {
        return res.status(400).json({
          isValid: false,
          error: 'URL inválida. Forneça o link de edição do Google Forms ou o ID do formulário.',
        });
      }

      res.json({
        isValid: true,
        formId,
      });
    } catch (err: any) {
      res.status(500).json({
        isValid: false,
        error: err.message || 'Erro ao processar URL do formulário.',
      });
    }
  });

  /**
   * GET /api/google/forms/:formId
   */
  app.get('/api/google/forms/:formId', async (req, res) => {
    try {
      const { formId } = req.params;
      if (!formId) {
        return res.status(400).json({ error: 'formId é obrigatório' });
      }

      const creds = resolveGoogleCreds(req);
      const status = getGoogleConfigStatus(creds);
      if (!status.configured) {
        return res.status(400).json({
          error: 'Credenciais do Google não configuradas.',
          details:
            'Configure sua Service Account do Google nas Configurações da conta ou no servidor.',
        });
      }

      const authClient = await getAuthenticatedGoogleClient(creds);
      const survey = await getGoogleFormData(authClient, formId);

      res.json(survey);
    } catch (err: any) {
      console.error('[Google Forms API Error]', err.message);
      const isNotFound = err.message.includes('não encontrado');
      const isForbidden = err.message.includes('Permissão insuficiente');

      res.status(isNotFound ? 404 : isForbidden ? 403 : 500).json({
        error: 'Não foi possível carregar o Google Forms.',
        details: err.message || 'Falha na comunicação com a API Google Forms.',
      });
    }
  });

  // ============================================================
  // GEMINI AI QUALITATIVE ANALYSIS ENDPOINTS (Server-Side Only)
  // ============================================================

  app.post('/api/ai/qualitative', async (req, res) => {
    try {
      const {
        questionId,
        questionTitle,
        questionDescription,
        surveyTitle,
        surveyDescription,
        responses,
        totalRespondents,
      } = req.body || {};

      if (!questionId || !questionTitle) {
        return res.status(400).json({
          error: 'Parâmetros obrigatórios ausentes (questionId, questionTitle).',
        });
      }

      if (!Array.isArray(responses)) {
        return res.status(400).json({
          error: 'O parâmetro responses deve ser uma lista de strings.',
        });
      }

      const effectiveGeminiKey = resolveGeminiApiKey(req);

      const result = await analyzeQualitativeQuestionServer(
        {
          questionId,
          questionTitle,
          questionDescription,
          surveyTitle,
          surveyDescription,
          responses,
          totalRespondents: totalRespondents || responses.length,
        },
        effectiveGeminiKey
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error('[API /api/ai/qualitative Error]', err.message);
      const isMissingKey = err.message.includes('GEMINI_API_KEY') || err.message.includes('Chave de API');
      res.status(isMissingKey ? 400 : 500).json({
        success: false,
        error: isMissingKey
          ? 'Chave do Gemini não configurada. Configure sua chave ou utilize o AI Studio.'
          : 'Falha ao processar análise qualitativa com Gemini.',
        details: err.message,
      });
    }
  });

  app.post('/api/ai/overall', async (req, res) => {
    try {
      const { surveyTitle, surveyDescription, questionsSummary } = req.body || {};

      if (!surveyTitle || !Array.isArray(questionsSummary)) {
        return res.status(400).json({
          error: 'Parâmetros obrigatórios ausentes (surveyTitle, questionsSummary).',
        });
      }

      const effectiveGeminiKey = resolveGeminiApiKey(req);

      const result = await analyzeOverallSurveyServer(
        {
          surveyTitle,
          surveyDescription,
          questionsSummary,
        },
        effectiveGeminiKey
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error('[API /api/ai/overall Error]', err.message);
      const isMissingKey = err.message.includes('GEMINI_API_KEY') || err.message.includes('Chave de API');
      res.status(isMissingKey ? 400 : 500).json({
        success: false,
        error: isMissingKey
          ? 'Chave do Gemini não configurada. Configure sua chave ou utilize o AI Studio.'
          : 'Falha ao gerar síntese executiva geral.',
        details: err.message,
      });
    }
  });

  // ============================================================
  // HEALTH CHECK
  // ============================================================
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // ============================================================
  // VITE DEV SERVER / PRODUCTION STATIC SERVING
  // ============================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Survey Analyzer server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
