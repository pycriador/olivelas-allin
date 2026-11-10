import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import net from 'net';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initDatabase, db } from './db/index.js';
import { events } from './services/events.js';
import { ProcessManager } from './services/processManager.js';

import appsRouter from './routes/apps.js';
import settingsRouter from './routes/settings.js';
import historyRouter from './routes/history.js';
import notificationsRouter from './routes/notifications.js';
import systemRouter from './routes/system.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface StartServerOptions {
  port?: number;
  dataDir?: string;
  distDir?: string;
  allowFallbackPort?: boolean;
}

function findAvailablePort(preferredPort: number): Promise<number> {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => {
      const fallback = net.createServer();
      fallback.listen(0, '127.0.0.1', () => {
        const addr = fallback.address();
        const port = typeof addr === 'object' && addr ? addr.port : preferredPort;
        fallback.close(() => resolve(port));
      });
    });
    tester.once('listening', () => {
      tester.close(() => resolve(preferredPort));
    });
    tester.listen(preferredPort, '0.0.0.0');
  });
}

let activeServer: http.Server | null = null;
let activePort = Number(process.env.PORT || 3002);

export async function startServer(
  options: StartServerOptions = {}
): Promise<{ server: http.Server; port: number }> {
  if (activeServer) {
    return { server: activeServer, port: activePort };
  }

  if (options.dataDir) {
    process.env.OLIVELAS_DATA_DIR = options.dataDir;
  }

  const preferredPort = options.port || Number(process.env.PORT || 3002);
  const port = options.allowFallbackPort
    ? await findAvailablePort(preferredPort)
    : preferredPort;

  // Inicializar banco SQLite
  initDatabase(options.dataDir);

  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Server-Sent Events Endpoint para logs, URLs geradas e status em tempo real
  app.get('/api/events', (_req, res) => {
    events.addClient(res);
  });

  // Rotas da API
  app.use('/api/apps', appsRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/system', systemRouter);

  // Rota de checagem de saúde
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      mode: process.env.OLIVELAS_ELECTRON_MODE === '1' ? 'electron' : 'web',
      port,
      time: new Date().toISOString(),
    });
  });

  // Resolver diretório do frontend compilado (compatível com Web dev/prod e Electron empacotado)
  const candidateDistDirs = [
    options.distDir,
    path.resolve(__dirname, '../../dist/client'),
    path.resolve(__dirname, '../client'),
    path.resolve(__dirname, '../../dist'),
    path.resolve(process.cwd(), 'dist/client'),
    path.resolve(process.cwd(), 'dist'),
  ].filter(Boolean) as string[];

  const distPath =
    candidateDistDirs.find((dir) => {
      try {
        return fs.existsSync(path.join(dir, 'index.html'));
      } catch {
        return false;
      }
    }) || path.resolve(__dirname, '../../dist');

  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        res.status(200).send('API do Olivelas Local Tunnel operacional na porta ' + port);
      }
    });
  });

  // Inicializar gerenciador de processos (auto-start se configurado)
  ProcessManager.init();

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      activeServer = server;
      activePort = port;
      console.log(`🚀 Olivelas Local Tunnel backend rodando em: http://localhost:${port}`);
      resolve({ server, port });
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

export { ProcessManager, db, events };

// Se executado diretamente no Modo Web Tradicional (não importado pelo Electron)
const isRunningInElectron =
  Boolean((process.versions as any)?.electron) || process.env.OLIVELAS_ELECTRON_MODE === '1';

if (!isRunningInElectron) {
  startServer().catch((err) => {
    console.error('❌ Falha ao iniciar servidor Olivelas Local Tunnel:', err);
    process.exit(1);
  });
}
