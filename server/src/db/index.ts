import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'version-monitor.db');
const sqlite = new Database(dbPath);

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS repositories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      description TEXT,
      html_url TEXT,
      is_active INTEGER DEFAULT 1,
      cron_expression TEXT DEFAULT '0 */6 * * *',
      local_version TEXT,
      latest_version TEXT,
      latest_version_url TEXT,
      has_update INTEGER DEFAULT 0,
      last_checked_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(owner, repo)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      description TEXT
    );
  `);

  const defaultSettings = [
    { key: 'github_token', value: '', description: 'GitHub Personal Access Token (optional)' },
    { key: 'webhook_url', value: '', description: 'Webhook URL for notifications' },
    { key: 'webhook_method', value: 'POST', description: 'Webhook request method (GET/POST)' },
    { key: 'webhook_headers', value: '', description: 'Webhook request headers (Key: Value per line)' },
    { key: 'webhook_body', value: '', description: 'Webhook request body template' },
    { key: 'ntfy_url', value: '', description: 'ntfy server URL' },
    { key: 'ntfy_topic', value: '', description: 'ntfy topic' },
    { key: 'ntfy_method', value: 'POST', description: 'ntfy request method (GET/POST)' },
    { key: 'ntfy_headers', value: '', description: 'ntfy request headers (Key: Value per line)' },
    { key: 'ntfy_body', value: '', description: 'ntfy request body template' },
    { key: 'vocechat_url', value: '', description: 'VoceChat server URL' },
    { key: 'vocechat_token', value: '', description: 'VoceChat API token' },
    { key: 'vocechat_target_type', value: 'channel', description: 'VoceChat target type (channel/user)' },
    { key: 'vocechat_channel', value: '', description: 'VoceChat channel ID' },
    { key: 'vocechat_user', value: '', description: 'VoceChat user ID' },
    { key: 'vocechat_method', value: 'POST', description: 'VoceChat request method (GET/POST)' },
    { key: 'vocechat_headers', value: '', description: 'VoceChat request headers (Key: Value per line)' },
    { key: 'vocechat_body', value: '', description: 'VoceChat request body template' },
  ];

  const insertSetting = sqlite.prepare(
    'INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)'
  );

  for (const setting of defaultSettings) {
    insertSetting.run(setting.key, setting.value, setting.description);
  }

  console.log('Database initialized successfully');
}
