import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initDatabase } from './db/index.js';
import { events } from './services/events.js';
import { FolderWatcherService } from './services/watcher.js';
import { SchedulerService } from './services/scheduler.js';

import authRouter from './routes/auth.js';
import foldersRouter from './routes/folders.js';
import historyRouter from './routes/history.js';
import notificationsRouter from './routes/notifications.js';
import systemRouter from './routes/system.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Inicializar banco SQLite
initDatabase();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Server-Sent Events Endpoint para atualizações e notificações assíncronas em tempo real
app.get('/api/events', (req, res) => {
  events.addClient(res);
});

// Rotas da API
app.use('/api/auth', authRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/history', historyRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/system', systemRouter);

// Rota de checagem de saúde
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Servir frontend compilado em ambiente de produção
const distPath = path.resolve(__dirname, '../../dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('API do Olivelas GDrive Sync operacional na porta ' + PORT);
    }
  });
});

// Iniciar serviços em background
FolderWatcherService.init();
SchedulerService.init();

// Iniciar servidor HTTP
app.listen(PORT, () => {
  console.log(`🚀 Olivelas GDrive Sync backend rodando em: http://localhost:${PORT}`);
});
