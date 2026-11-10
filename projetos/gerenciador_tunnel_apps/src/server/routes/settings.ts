import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';
import { db } from '../db/index.js';
import { ProcessManager } from '../services/processManager.js';
import { encryptData } from '../services/crypto.js';

const router = Router();

// Obter status dos provedores instalados e configurações globais
router.get('/status', (_req: Request, res: Response) => {
  try {
    const status = ProcessManager.getSystemProvidersStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Salvar configurações de provedores (Ngrok Authtoken, Cloudflare Token, provedor padrão)
router.post('/', (req: Request, res: Response) => {
  try {
    const {
      defaultProvider,
      ngrokAuthtoken,
      ngrokDomain,
      cloudflaredToken,
      cloudflaredProtocol,
      clearNgrokToken,
      clearCloudflaredToken,
    } = req.body;

    const existing = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;

    let nextNgrokToken = existing?.ngrok_authtoken || '';
    if (clearNgrokToken) {
      nextNgrokToken = '';
    } else if (ngrokAuthtoken && String(ngrokAuthtoken).trim()) {
      const cleanToken = String(ngrokAuthtoken).trim();
      nextNgrokToken = encryptData(cleanToken);
      // Também tentar salvar no config do ngrok CLI se estiver instalado
      try {
        execSync(`ngrok config add-authtoken ${cleanToken}`, { stdio: 'ignore' });
      } catch {}
    }

    let nextCfToken = existing?.cloudflared_token || '';
    if (clearCloudflaredToken) {
      nextCfToken = '';
    } else if (cloudflaredToken && String(cloudflaredToken).trim()) {
      nextCfToken = encryptData(String(cloudflaredToken).trim());
    }

    db.prepare(
      `UPDATE settings SET
        default_tunnel_provider = ?,
        ngrok_authtoken = ?,
        ngrok_domain = ?,
        cloudflared_token = ?,
        cloudflared_protocol = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1`
    ).run(
      defaultProvider || existing?.default_tunnel_provider || 'cloudflared',
      nextNgrokToken,
      ngrokDomain !== undefined ? String(ngrokDomain).trim() : existing?.ngrok_domain || '',
      nextCfToken,
      cloudflaredProtocol || existing?.cloudflared_protocol || 'auto'
    );

    res.json({
      success: true,
      status: ProcessManager.getSystemProvidersStatus(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
