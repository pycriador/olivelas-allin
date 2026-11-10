import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { ProcessManager } from '../services/processManager.js';
import { encryptData } from '../services/crypto.js';

const router = Router();

// Listar todas as aplicações com status em tempo real
router.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM applications ORDER BY id DESC').all() as any[];
    const enriched = rows.map((r) => ProcessManager.enrichApp(r));
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar todas as aplicações ativas
router.post('/start-all', async (_req: Request, res: Response) => {
  try {
    const count = await ProcessManager.startAll();
    res.json({ success: true, message: `${count} aplicação(ões) iniciada(s).` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Parar todas as aplicações rodando
router.post('/stop-all', async (_req: Request, res: Response) => {
  try {
    const count = await ProcessManager.stopAll();
    res.json({ success: true, message: `${count} aplicação(ões) interrompida(s).` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Criar nova aplicação / túnel
router.post('/', (req: Request, res: Response) => {
  try {
    const {
      name,
      description = '',
      execution_mode = 'app_and_tunnel',
      local_path = '',
      start_command = '',
      local_host = 'localhost',
      local_port = 3000,
      local_protocol = 'http',
      env_vars = '',
      tunnel_provider = 'cloudflared',
      tunnel_auth_mode = 'quick',
      tunnel_custom_token = '',
      tunnel_custom_domain = '',
      tunnel_custom_command = '',
      auto_restart = false,
      auto_start = false,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'O nome de identificação é obrigatório.' });
    }

    const portNum = parseInt(String(local_port), 10) || 3000;
    const encryptedToken = tunnel_custom_token ? encryptData(String(tunnel_custom_token).trim()) : '';

    const info = db
      .prepare(
        `INSERT INTO applications (
          name, description, execution_mode, local_path, start_command,
          local_host, local_port, local_protocol, env_vars,
          tunnel_provider, tunnel_auth_mode, tunnel_custom_token,
          tunnel_custom_domain, tunnel_custom_command, auto_restart, auto_start
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        String(name).trim(),
        String(description).trim(),
        execution_mode,
        String(local_path).trim(),
        String(start_command).trim(),
        String(local_host || 'localhost').trim(),
        portNum,
        local_protocol || 'http',
        String(env_vars || ''),
        tunnel_provider || 'cloudflared',
        tunnel_auth_mode || 'quick',
        encryptedToken,
        String(tunnel_custom_domain || '').trim(),
        String(tunnel_custom_command || '').trim(),
        auto_restart ? 1 : 0,
        auto_start ? 1 : 0
      );

    const created = db.prepare('SELECT * FROM applications WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(ProcessManager.enrichApp(created));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar aplicação / túnel
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const existing = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Aplicação não encontrada.' });
    }

    const {
      name,
      description,
      execution_mode,
      local_path,
      start_command,
      local_host,
      local_port,
      local_protocol,
      env_vars,
      tunnel_provider,
      tunnel_auth_mode,
      tunnel_custom_token,
      tunnel_custom_domain,
      tunnel_custom_command,
      auto_restart,
      auto_start,
      is_active,
    } = req.body;

    let tokenToSave = existing.tunnel_custom_token;
    if (tunnel_custom_token !== undefined) {
      tokenToSave = tunnel_custom_token ? encryptData(String(tunnel_custom_token).trim()) : '';
    }

    db.prepare(
      `UPDATE applications SET
        name = ?,
        description = ?,
        execution_mode = ?,
        local_path = ?,
        start_command = ?,
        local_host = ?,
        local_port = ?,
        local_protocol = ?,
        env_vars = ?,
        tunnel_provider = ?,
        tunnel_auth_mode = ?,
        tunnel_custom_token = ?,
        tunnel_custom_domain = ?,
        tunnel_custom_command = ?,
        auto_restart = ?,
        auto_start = ?,
        is_active = ?
      WHERE id = ?`
    ).run(
      name !== undefined ? String(name).trim() : existing.name,
      description !== undefined ? String(description).trim() : existing.description,
      execution_mode !== undefined ? execution_mode : existing.execution_mode,
      local_path !== undefined ? String(local_path).trim() : existing.local_path,
      start_command !== undefined ? String(start_command).trim() : existing.start_command,
      local_host !== undefined ? String(local_host).trim() : existing.local_host,
      local_port !== undefined ? parseInt(String(local_port), 10) || 3000 : existing.local_port,
      local_protocol !== undefined ? local_protocol : existing.local_protocol,
      env_vars !== undefined ? String(env_vars) : existing.env_vars,
      tunnel_provider !== undefined ? tunnel_provider : existing.tunnel_provider,
      tunnel_auth_mode !== undefined ? tunnel_auth_mode : existing.tunnel_auth_mode,
      tokenToSave,
      tunnel_custom_domain !== undefined ? String(tunnel_custom_domain).trim() : existing.tunnel_custom_domain,
      tunnel_custom_command !== undefined ? String(tunnel_custom_command).trim() : existing.tunnel_custom_command,
      auto_restart !== undefined ? (auto_restart ? 1 : 0) : existing.auto_restart,
      auto_start !== undefined ? (auto_start ? 1 : 0) : existing.auto_start,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      id
    );

    const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    res.json(ProcessManager.enrichApp(updated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir aplicação
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await ProcessManager.stopApp(id);
    db.prepare('DELETE FROM applications WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar aplicação
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await ProcessManager.startApp(id);
    const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    res.json({ success: true, app: ProcessManager.enrichApp(updated) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Parar aplicação
router.post('/:id/stop', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await ProcessManager.stopApp(id);
    const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    res.json({ success: true, app: ProcessManager.enrichApp(updated) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reiniciar aplicação
router.post('/:id/restart', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await ProcessManager.stopApp(id);
    await ProcessManager.startApp(id);
    const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    res.json({ success: true, app: ProcessManager.enrichApp(updated) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar/Expor apenas o túnel público sob demanda (ex: Cloudflared ou Ngrok rápido, opcionalmente em uma porta específica)
router.post('/:id/tunnel/start', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { provider, port } = req.body || {};
    const parsedPort = port ? parseInt(String(port), 10) : undefined;
    await ProcessManager.startTunnelForApp(id, provider, parsedPort);
    const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    res.json({ success: true, app: ProcessManager.enrichApp(updated) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Parar apenas o túnel público mantendo o app local rodando
router.post('/:id/tunnel/stop', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await ProcessManager.stopTunnelForApp(id);
    const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    res.json({ success: true, app: ProcessManager.enrichApp(updated) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obter logs do console da aplicação
router.get('/:id/logs', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const logs = ProcessManager.getLogs(id);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Limpar logs do console da aplicação
router.delete('/:id/logs', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    ProcessManager.clearLogs(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
