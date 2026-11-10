import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;
let currentDbPath = '';

export function getDatabasePath(): string {
  const baseDir = process.env.OLIVELAS_DATA_DIR
    ? path.resolve(process.env.OLIVELAS_DATA_DIR)
    : path.resolve(process.cwd(), 'data');

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return path.join(baseDir, 'local_tunnel.db');
}

export function getDb(): Database.Database {
  const targetPath = getDatabasePath();
  if (!dbInstance || currentDbPath !== targetPath) {
    if (dbInstance) {
      try {
        dbInstance.close();
      } catch {}
    }
    currentDbPath = targetPath;
    dbInstance = new Database(targetPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
  }
  return dbInstance;
}

// Proxy mantendo compatibilidade total com `db.prepare(...)`, `db.exec(...)`, `db.pragma(...)`
export const db: Database.Database = new Proxy({} as Database.Database, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export function initDatabase(customDataDir?: string) {
  if (customDataDir) {
    process.env.OLIVELAS_DATA_DIR = customDataDir;
  }
  const database = getDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      default_tunnel_provider TEXT NOT NULL DEFAULT 'cloudflared',
      ngrok_authtoken TEXT DEFAULT '',
      ngrok_domain TEXT DEFAULT '',
      cloudflared_token TEXT DEFAULT '',
      cloudflared_protocol TEXT NOT NULL DEFAULT 'auto',
      auto_stop_on_exit INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      execution_mode TEXT NOT NULL DEFAULT 'app_and_tunnel',
      local_path TEXT DEFAULT '',
      start_command TEXT DEFAULT '',
      local_host TEXT NOT NULL DEFAULT 'localhost',
      local_port INTEGER NOT NULL DEFAULT 3000,
      local_protocol TEXT NOT NULL DEFAULT 'http',
      env_vars TEXT DEFAULT '',
      tunnel_provider TEXT NOT NULL DEFAULT 'cloudflared',
      tunnel_auth_mode TEXT NOT NULL DEFAULT 'quick',
      tunnel_custom_token TEXT DEFAULT '',
      tunnel_custom_domain TEXT DEFAULT '',
      tunnel_custom_command TEXT DEFAULT '',
      auto_restart INTEGER NOT NULL DEFAULT 0,
      auto_start INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_public_url TEXT DEFAULT '',
      detected_urls_json TEXT DEFAULT '[]',
      last_started_at TEXT,
      last_stopped_at TEXT,
      last_status TEXT DEFAULT 'stopped',
      last_error_message TEXT DEFAULT '',
      total_runs INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS run_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      app_name TEXT NOT NULL,
      execution_mode TEXT NOT NULL,
      tunnel_provider TEXT NOT NULL,
      local_url TEXT NOT NULL,
      public_url TEXT DEFAULT '',
      status TEXT NOT NULL,
      error_message TEXT,
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      public_url TEXT DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- Inserir registro padrão de settings se não existir
    INSERT OR IGNORE INTO settings (id, default_tunnel_provider, cloudflared_protocol)
    VALUES (1, 'cloudflared', 'auto');
  `);

  // Migração segura para bancos existentes: adicionar coluna detected_urls_json
  try {
    const cols = database.prepare(`PRAGMA table_info(applications)`).all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === 'detected_urls_json')) {
      database.exec(`ALTER TABLE applications ADD COLUMN detected_urls_json TEXT DEFAULT '[]'`);
    }
  } catch (err) {
    console.warn('Aviso ao verificar coluna detected_urls_json:', err);
  }

  // Configurar/atualizar o inicializador e configurações de túnel dos 2 projetos locais principais (Ofertas WhatsApp e OpenWA)
  const defaultLocalProjects = [
    {
      matchNames: [
        'Ofertas WhatsApp',
        'Ofertas WhatsApp (Olivelas WPP Chat)',
        'Olivelas WPP Chat System (Ofertas WhatsApp)',
        'olivelas-wpp-chat-system',
      ],
      name: 'Ofertas WhatsApp',
      description: 'Sistema de disparo de ofertas e atendimento WhatsApp (Frontend 5173 + Backend 3001)',
      execution_mode: 'app_and_tunnel',
      local_path: '/home/willian/Downloads/projetos/olivelas-wpp-chat-system',
      start_command: './start.sh',
      local_host: 'localhost',
      local_port: 5173,
      local_protocol: 'http',
      tunnel_provider: 'cloudflared',
      tunnel_auth_mode: 'quick',
      tunnel_custom_command: 'ssh -R 80:localhost:{port} nokey@localhost.run',
    },
    {
      matchNames: [
        'OpenWA',
        'OpenWA (Gateway & Dashboard)',
        'OpenWA Gateway & Dashboard',
        'openwa',
      ],
      name: 'OpenWA',
      description: 'Open Source WhatsApp HTTP API Gateway (API/Swagger 2785 + Dashboard 2886)',
      execution_mode: 'app_and_tunnel',
      local_path: '/home/willian/Downloads/projetos/OpenWA',
      start_command: 'npm run dev',
      local_host: 'localhost',
      local_port: 2785,
      local_protocol: 'http',
      tunnel_provider: 'cloudflared',
      tunnel_auth_mode: 'quick',
      tunnel_custom_command: 'ssh -R 80:localhost:{port} nokey@localhost.run',
    },
  ];

  for (const proj of defaultLocalProjects) {
    try {
      const allRows = database.prepare(`SELECT * FROM applications ORDER BY id ASC`).all() as any[];
      const matchingRows = allRows.filter(
        (r) =>
          r.local_path === proj.local_path ||
          proj.matchNames.some((n) => n.toLowerCase() === String(r.name || '').toLowerCase())
      );

      if (matchingRows.length > 0) {
        const primary = matchingRows[0];
        database
          .prepare(
            `UPDATE applications SET
              name = ?,
              description = ?,
              execution_mode = 'app_and_tunnel',
              local_path = ?,
              start_command = ?,
              local_host = COALESCE(NULLIF(local_host, ''), ?),
              local_port = ?,
              local_protocol = COALESCE(NULLIF(local_protocol, ''), ?),
              tunnel_provider = COALESCE(NULLIF(tunnel_provider, ''), ?),
              tunnel_auth_mode = COALESCE(NULLIF(tunnel_auth_mode, ''), ?),
              tunnel_custom_command = COALESCE(NULLIF(tunnel_custom_command, ''), ?),
              is_active = 1
            WHERE id = ?`
          )
          .run(
            proj.name,
            proj.description,
            proj.local_path,
            proj.start_command,
            proj.local_host,
            proj.local_port,
            proj.local_protocol,
            proj.tunnel_provider,
            proj.tunnel_auth_mode,
            proj.tunnel_custom_command,
            primary.id
          );
        // Remover duplicatas se houver
        for (let i = 1; i < matchingRows.length; i++) {
          database.prepare(`DELETE FROM applications WHERE id = ?`).run(matchingRows[i].id);
        }
      } else {
        database
          .prepare(
            `INSERT INTO applications (
              name, description, execution_mode, local_path, start_command,
              local_host, local_port, local_protocol, tunnel_provider, tunnel_auth_mode, tunnel_custom_command, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
          )
          .run(
            proj.name,
            proj.description,
            proj.execution_mode,
            proj.local_path,
            proj.start_command,
            proj.local_host,
            proj.local_port,
            proj.local_protocol,
            proj.tunnel_provider,
            proj.tunnel_auth_mode,
            proj.tunnel_custom_command
          );
      }
    } catch (err) {
      console.warn(`Aviso ao verificar projeto padrão ${proj.name}:`, err);
    }
  }

  // Resetar status caso o backend tenha sido reiniciado abruptamente
  database.prepare(`UPDATE applications SET last_status = 'stopped' WHERE last_status IN ('running', 'starting')`).run();
  database.prepare(`UPDATE run_history SET status = 'stopped', ended_at = CURRENT_TIMESTAMP WHERE status = 'running'`).run();

  console.log('✅ SQLite database initialized at:', getDatabasePath());
}
