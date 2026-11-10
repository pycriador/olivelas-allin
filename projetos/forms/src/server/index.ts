import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { groupsRouter } from './routes/groups';
import { formsRouter } from './routes/forms';
import { responsesRouter } from './routes/responses';
import { dashboardsRouter } from './routes/dashboards';
import { tokensRouter } from './routes/tokens';
import { googleRouter } from './routes/google';
import { auditRouter } from './routes/audit';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), system: 'Olivelas IAM Forms API' });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/forms', formsRouter);
app.use('/api/forms', responsesRouter);
app.use('/api/dashboards', dashboardsRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/google', googleRouter);
app.use('/api/audit-logs', auditRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Server Unhandled Error]:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`[Olivelas IAM Forms Server] Running on http://localhost:${PORT}`);
});
