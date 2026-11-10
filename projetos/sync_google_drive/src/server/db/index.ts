import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'gdrive_sync.db');
export const db = new Database(DB_PATH);

// Pragmas para performance e integridade
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      auth_mode TEXT NOT NULL DEFAULT 'oauth',
      oauth_client_id TEXT,
      oauth_client_secret TEXT,
      oauth_tokens TEXT,
      oauth_user_email TEXT,
      oauth_user_name TEXT,
      service_account_json TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      local_path TEXT NOT NULL,
      gdrive_folder_id TEXT NOT NULL,
      gdrive_folder_name TEXT,
      sync_mode TEXT NOT NULL DEFAULT 'upload',
      schedule_enabled INTEGER NOT NULL DEFAULT 0,
      schedule_interval TEXT NOT NULL DEFAULT 'hourly',
      schedule_cron TEXT,
      file_extensions TEXT DEFAULT '',
      watch_enabled INTEGER NOT NULL DEFAULT 1,
      watch_delay_seconds INTEGER NOT NULL DEFAULT 10,
      watch_auto_sync INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_synced_at TEXT,
      last_sync_status TEXT DEFAULT 'idle',
      last_sync_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id INTEGER NOT NULL,
      local_file_path TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      file_hash TEXT,
      gdrive_file_id TEXT,
      status TEXT NOT NULL,
      error_message TEXT,
      synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES sync_folders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES sync_folders(id) ON DELETE CASCADE
    );

    -- Inserir registro padrão de settings se não existir
    INSERT OR IGNORE INTO settings (id, auth_mode, oauth_user_email, oauth_user_name) VALUES (1, 'oauth', 'willian.o.jesus@gmail.com', 'Willian Jesus (Global Admin)');
  `);

  // Migrações dinâmicas para bases de dados existentes
  try {
    const columns = db.prepare('PRAGMA table_info(sync_folders)').all() as any[];
    const colNames = columns.map((c) => c.name);
    if (!colNames.includes('watch_delay_seconds')) {
      db.exec('ALTER TABLE sync_folders ADD COLUMN watch_delay_seconds INTEGER NOT NULL DEFAULT 10;');
    }
    if (!colNames.includes('watch_auto_sync')) {
      db.exec('ALTER TABLE sync_folders ADD COLUMN watch_auto_sync INTEGER NOT NULL DEFAULT 0;');
    }
  } catch (migErr) {
    console.warn('Migration warning:', migErr);
  }

  console.log('✅ SQLite database initialized at:', DB_PATH);
}
