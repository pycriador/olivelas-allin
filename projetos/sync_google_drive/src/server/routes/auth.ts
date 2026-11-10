import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { GDriveService } from '../services/gdrive.js';
import { encryptData, decryptData } from '../services/crypto.js';

const router = Router();

// Obter status atual de autenticação
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await GDriveService.getStatus();
    const settings = db.prepare('SELECT auth_mode, oauth_client_id FROM settings WHERE id = 1').get() as any;
    
    res.json({
      ...status,
      hasClientId: !!settings?.oauth_client_id,
      clientId: settings?.oauth_client_id ? decryptData(settings.oauth_client_id).substring(0, 12) + '...' : '',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Salvar Client ID e Secret do OAuth e gerar URL de consentimento
router.post('/oauth/config', async (req: Request, res: Response) => {
  try {
    const { clientId, clientSecret } = req.body;
    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: 'Client ID e Client Secret são obrigatórios.' });
    }

    if (clientSecret.trim().includes('.apps.googleusercontent.com') || clientSecret.trim() === clientId.trim()) {
      return res.status(400).json({
        error: 'Você colou o Client ID no campo do Client Secret! O Client Secret (Chave secreta do cliente) normalmente começa com "GOCSPX-". Copie a Chave Secreta no Google Cloud Console.',
      });
    }

    db.prepare(`
      UPDATE settings 
      SET auth_mode = 'oauth', 
          oauth_client_id = ?, 
          oauth_client_secret = ?, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `).run(encryptData(clientId.trim()), encryptData(clientSecret.trim()));

    const oauth2Client = GDriveService.getOAuth2Client(clientId.trim(), clientSecret.trim());
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    });

    res.json({ success: true, authUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Gerar URL de login OAuth com credenciais já salvas
router.get('/oauth/url', (req: Request, res: Response) => {
  try {
    const settings = db.prepare('SELECT oauth_client_id, oauth_client_secret FROM settings WHERE id = 1').get() as any;
    if (!settings?.oauth_client_id || !settings?.oauth_client_secret) {
      return res.status(400).json({ error: 'OAuth não configurado. Forneça Client ID e Secret primeiro.' });
    }

    const oauth2Client = GDriveService.getOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    });

    res.json({ authUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Callback OAuth chamado pelo Google
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.send(`
        <html><body><script>
          window.opener ? window.opener.postMessage({ type: 'oauth_error', error: 'Código não fornecido' }, '*') : window.location.href = 'http://localhost:5173/?auth=error';
          window.close();
        </script></body></html>
      `);
    }

    const oauth2Client = GDriveService.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Obter dados do usuário
    const { google } = await import('googleapis');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    let userInfo: any = {};
    try {
      const userRes = await oauth2.userinfo.get();
      userInfo = userRes.data;
    } catch (e) {
      console.warn('Could not fetch userinfo:', e);
    }

    // Salvar tokens criptografados no SQLite
    db.prepare(`
      UPDATE settings 
      SET auth_mode = 'oauth', 
          oauth_tokens = ?, 
          oauth_user_email = ?, 
          oauth_user_name = ?, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `).run(
      encryptData(JSON.stringify(tokens)),
      userInfo.email || null,
      userInfo.name || null
    );

    // Emitir evento em tempo real para todos os clientes conectados
    const { events } = await import('../services/events.js');
    events.emit('notification', {
      title: 'Google Drive Conectado',
      message: `Conta ${userInfo.email || ''} conectada com sucesso via OAuth 2.0.`,
      type: 'info',
      createdAt: new Date().toISOString(),
    });

    res.send(`
      <html>
        <head><title>Autenticado com Sucesso</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px; background: #0f172a; color: #f8fafc;">
          <h2>✅ Autenticação com Google Drive concluída!</h2>
          <p>Você pode fechar esta janela agora.</p>
          <script>
            try {
              localStorage.setItem('gdrive_oauth_success', Date.now().toString());
              const bc = new BroadcastChannel('gdrive_sync_auth');
              bc.postMessage({ type: 'oauth_success' });
              bc.close();
            } catch (e) {}

            if (window.opener) {
              try { window.opener.postMessage({ type: 'oauth_success' }, '*'); } catch (e) {}
              setTimeout(() => window.close(), 1000);
            } else {
              setTimeout(() => { window.location.href = 'http://localhost:5173/?auth=success'; }, 1000);
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('OAuth Callback error:', err);
    res.status(500).send(`Erro na autenticação: ${err.message}`);
  }
});

// Salvar Service Account JSON
router.post('/service-account', async (req: Request, res: Response) => {
  try {
    const { credentialsJson } = req.body;
    if (!credentialsJson) {
      return res.status(400).json({ error: 'JSON da Service Account é obrigatório.' });
    }

    // Validar JSON
    let parsed: any;
    try {
      parsed = typeof credentialsJson === 'string' ? JSON.parse(credentialsJson) : credentialsJson;
      if (!parsed.client_email || !parsed.private_key) {
        throw new Error('Arquivo JSON inválido. Precisa conter client_email e private_key.');
      }
    } catch (e: any) {
      return res.status(400).json({ error: `JSON inválido: ${e.message}` });
    }

    db.prepare(`
      UPDATE settings 
      SET auth_mode = 'service_account', 
          service_account_json = ?, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `).run(encryptData(JSON.stringify(parsed)));

    // Testar conexão
    const status = await GDriveService.getStatus();

    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Desconectar / Limpar credenciais
router.post('/disconnect', (req: Request, res: Response) => {
  try {
    db.prepare(`
      UPDATE settings 
      SET oauth_tokens = NULL, 
          oauth_user_email = NULL, 
          oauth_user_name = NULL, 
          service_account_json = NULL, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `).run();

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
