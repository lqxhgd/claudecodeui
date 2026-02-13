import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
};

const c = {
    info: (text) => `${colors.cyan}${text}${colors.reset}`,
    bright: (text) => `${colors.bright}${text}${colors.reset}`,
    dim: (text) => `${colors.dim}${text}${colors.reset}`,
};

// Use DATABASE_PATH environment variable if set, otherwise use default location
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'auth.db');
const INIT_SQL_PATH = path.join(__dirname, 'init.sql');

// Ensure database directory exists if custom path is provided
if (process.env.DATABASE_PATH) {
  const dbDir = path.dirname(DB_PATH);
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`Created database directory: ${dbDir}`);
    }
  } catch (error) {
    console.error(`Failed to create database directory ${dbDir}:`, error.message);
    throw error;
  }
}

// Create database connection
const db = new Database(DB_PATH);

// Enable WAL mode for better multi-user concurrent read/write performance
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

// Show app installation path prominently
const appInstallPath = path.join(__dirname, '../..');
console.log('');
console.log(c.dim('═'.repeat(60)));
console.log(`${c.info('[INFO]')} App Installation: ${c.bright(appInstallPath)}`);
console.log(`${c.info('[INFO]')} Database: ${c.dim(path.relative(appInstallPath, DB_PATH))}`);
if (process.env.DATABASE_PATH) {
  console.log(`       ${c.dim('(Using custom DATABASE_PATH from environment)')}`);
}
console.log(c.dim('═'.repeat(60)));
console.log('');

const runMigrations = () => {
  try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const columnNames = tableInfo.map(col => col.name);

    if (!columnNames.includes('git_name')) {
      console.log('Running migration: Adding git_name column');
      db.exec('ALTER TABLE users ADD COLUMN git_name TEXT');
    }

    if (!columnNames.includes('git_email')) {
      console.log('Running migration: Adding git_email column');
      db.exec('ALTER TABLE users ADD COLUMN git_email TEXT');
    }

    if (!columnNames.includes('has_completed_onboarding')) {
      console.log('Running migration: Adding has_completed_onboarding column');
      db.exec('ALTER TABLE users ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT 0');
    }

    // Multi-user migration: add role column
    if (!columnNames.includes('role')) {
      console.log('Running migration: Adding role column to users');
      db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
      // First user becomes admin
      const firstUser = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get();
      if (firstUser) {
        db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(firstUser.id);
        console.log(`Promoted user id=${firstUser.id} to admin`);
      }
    }

    // Create new tables if they don't exist (idempotent via IF NOT EXISTS in init.sql)
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);

    if (!tables.includes('user_settings')) {
      console.log('Running migration: Creating user_settings table');
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          setting_key TEXT NOT NULL,
          setting_value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, setting_key)
        );
        CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
      `);
    }

    if (!tables.includes('user_sessions')) {
      console.log('Running migration: Creating user_sessions table');
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          project_name TEXT NOT NULL,
          session_id TEXT NOT NULL,
          provider TEXT NOT NULL DEFAULT 'claude',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, session_id)
        );
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
      `);
    }

    if (!tables.includes('notification_config')) {
      console.log('Running migration: Creating notification_config table');
      db.exec(`
        CREATE TABLE IF NOT EXISTS notification_config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          webhook_url TEXT NOT NULL,
          webhook_type TEXT NOT NULL DEFAULT 'wechat_work',
          events TEXT NOT NULL DEFAULT 'git_commit,deploy_success,deploy_failure',
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_notification_config_user_id ON notification_config(user_id);
      `);
    }

    if (!tables.includes('notification_log')) {
      console.log('Running migration: Creating notification_log table');
      db.exec(`
        CREATE TABLE IF NOT EXISTS notification_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          event_type TEXT NOT NULL,
          payload TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON notification_log(user_id);
      `);
    }

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error.message);
    throw error;
  }
};

// Initialize database with schema
const initializeDatabase = async () => {
  try {
    const initSQL = fs.readFileSync(INIT_SQL_PATH, 'utf8');
    db.exec(initSQL);
    console.log('Database initialized successfully');
    runMigrations();
  } catch (error) {
    console.error('Error initializing database:', error.message);
    throw error;
  }
};

// User database operations
const userDb = {
  // Check if any users exist
  hasUsers: () => {
    try {
      const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
      return row.count > 0;
    } catch (err) {
      throw err;
    }
  },

  // Create a new user (first user auto-promoted to admin)
  createUser: (username, passwordHash, role = null) => {
    try {
      const assignedRole = role || (userDb.hasUsers() ? 'user' : 'admin');
      const stmt = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
      const result = stmt.run(username, passwordHash, assignedRole);
      return { id: result.lastInsertRowid, username, role: assignedRole };
    } catch (err) {
      throw err;
    }
  },

  // Get user by username
  getUserByUsername: (username) => {
    try {
      const row = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
      return row;
    } catch (err) {
      throw err;
    }
  },

  // Update last login time
  updateLastLogin: (userId) => {
    try {
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
    } catch (err) {
      throw err;
    }
  },

  // Get user by ID
  getUserById: (userId) => {
    try {
      const row = db.prepare('SELECT id, username, role, created_at, last_login FROM users WHERE id = ? AND is_active = 1').get(userId);
      return row;
    } catch (err) {
      throw err;
    }
  },

  getFirstUser: () => {
    try {
      const row = db.prepare('SELECT id, username, role, created_at, last_login FROM users WHERE is_active = 1 LIMIT 1').get();
      return row;
    } catch (err) {
      throw err;
    }
  },

  // Get all users (admin only)
  getAllUsers: () => {
    try {
      return db.prepare('SELECT id, username, role, created_at, last_login, is_active FROM users ORDER BY created_at DESC').all();
    } catch (err) {
      throw err;
    }
  },

  // Update user role
  updateUserRole: (userId, role) => {
    try {
      const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
      return stmt.run(role, userId).changes > 0;
    } catch (err) {
      throw err;
    }
  },

  // Deactivate user (soft delete)
  deactivateUser: (userId) => {
    try {
      const stmt = db.prepare('UPDATE users SET is_active = 0 WHERE id = ?');
      return stmt.run(userId).changes > 0;
    } catch (err) {
      throw err;
    }
  },

  // Reactivate user
  reactivateUser: (userId) => {
    try {
      const stmt = db.prepare('UPDATE users SET is_active = 1 WHERE id = ?');
      return stmt.run(userId).changes > 0;
    } catch (err) {
      throw err;
    }
  },

  updateGitConfig: (userId, gitName, gitEmail) => {
    try {
      const stmt = db.prepare('UPDATE users SET git_name = ?, git_email = ? WHERE id = ?');
      stmt.run(gitName, gitEmail, userId);
    } catch (err) {
      throw err;
    }
  },

  getGitConfig: (userId) => {
    try {
      const row = db.prepare('SELECT git_name, git_email FROM users WHERE id = ?').get(userId);
      return row;
    } catch (err) {
      throw err;
    }
  },

  completeOnboarding: (userId) => {
    try {
      const stmt = db.prepare('UPDATE users SET has_completed_onboarding = 1 WHERE id = ?');
      stmt.run(userId);
    } catch (err) {
      throw err;
    }
  },

  hasCompletedOnboarding: (userId) => {
    try {
      const row = db.prepare('SELECT has_completed_onboarding FROM users WHERE id = ?').get(userId);
      return row?.has_completed_onboarding === 1;
    } catch (err) {
      throw err;
    }
  }
};

// API Keys database operations
const apiKeysDb = {
  // Generate a new API key
  generateApiKey: () => {
    return 'ck_' + crypto.randomBytes(32).toString('hex');
  },

  // Create a new API key
  createApiKey: (userId, keyName) => {
    try {
      const apiKey = apiKeysDb.generateApiKey();
      const stmt = db.prepare('INSERT INTO api_keys (user_id, key_name, api_key) VALUES (?, ?, ?)');
      const result = stmt.run(userId, keyName, apiKey);
      return { id: result.lastInsertRowid, keyName, apiKey };
    } catch (err) {
      throw err;
    }
  },

  // Get all API keys for a user
  getApiKeys: (userId) => {
    try {
      const rows = db.prepare('SELECT id, key_name, api_key, created_at, last_used, is_active FROM api_keys WHERE user_id = ? ORDER BY created_at DESC').all(userId);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  // Validate API key and get user
  validateApiKey: (apiKey) => {
    try {
      const row = db.prepare(`
        SELECT u.id, u.username, ak.id as api_key_id
        FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        WHERE ak.api_key = ? AND ak.is_active = 1 AND u.is_active = 1
      `).get(apiKey);

      if (row) {
        // Update last_used timestamp
        db.prepare('UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = ?').run(row.api_key_id);
      }

      return row;
    } catch (err) {
      throw err;
    }
  },

  // Delete an API key
  deleteApiKey: (userId, apiKeyId) => {
    try {
      const stmt = db.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?');
      const result = stmt.run(apiKeyId, userId);
      return result.changes > 0;
    } catch (err) {
      throw err;
    }
  },

  // Toggle API key active status
  toggleApiKey: (userId, apiKeyId, isActive) => {
    try {
      const stmt = db.prepare('UPDATE api_keys SET is_active = ? WHERE id = ? AND user_id = ?');
      const result = stmt.run(isActive ? 1 : 0, apiKeyId, userId);
      return result.changes > 0;
    } catch (err) {
      throw err;
    }
  }
};

// User credentials database operations (for GitHub tokens, GitLab tokens, etc.)
const credentialsDb = {
  // Create a new credential
  createCredential: (userId, credentialName, credentialType, credentialValue, description = null) => {
    try {
      const stmt = db.prepare('INSERT INTO user_credentials (user_id, credential_name, credential_type, credential_value, description) VALUES (?, ?, ?, ?, ?)');
      const result = stmt.run(userId, credentialName, credentialType, credentialValue, description);
      return { id: result.lastInsertRowid, credentialName, credentialType };
    } catch (err) {
      throw err;
    }
  },

  // Get all credentials for a user, optionally filtered by type
  getCredentials: (userId, credentialType = null) => {
    try {
      let query = 'SELECT id, credential_name, credential_type, description, created_at, is_active FROM user_credentials WHERE user_id = ?';
      const params = [userId];

      if (credentialType) {
        query += ' AND credential_type = ?';
        params.push(credentialType);
      }

      query += ' ORDER BY created_at DESC';

      const rows = db.prepare(query).all(...params);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  // Get active credential value for a user by type (returns most recent active)
  getActiveCredential: (userId, credentialType) => {
    try {
      const row = db.prepare('SELECT credential_value FROM user_credentials WHERE user_id = ? AND credential_type = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1').get(userId, credentialType);
      return row?.credential_value || null;
    } catch (err) {
      throw err;
    }
  },

  // Delete a credential
  deleteCredential: (userId, credentialId) => {
    try {
      const stmt = db.prepare('DELETE FROM user_credentials WHERE id = ? AND user_id = ?');
      const result = stmt.run(credentialId, userId);
      return result.changes > 0;
    } catch (err) {
      throw err;
    }
  },

  // Toggle credential active status
  toggleCredential: (userId, credentialId, isActive) => {
    try {
      const stmt = db.prepare('UPDATE user_credentials SET is_active = ? WHERE id = ? AND user_id = ?');
      const result = stmt.run(isActive ? 1 : 0, credentialId, userId);
      return result.changes > 0;
    } catch (err) {
      throw err;
    }
  }
};

// User settings database operations (per-user preferences)
const userSettingsDb = {
  getSetting: (userId, key) => {
    try {
      const row = db.prepare('SELECT setting_value FROM user_settings WHERE user_id = ? AND setting_key = ?').get(userId, key);
      return row?.setting_value ?? null;
    } catch (err) {
      throw err;
    }
  },

  setSetting: (userId, key, value) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO user_settings (user_id, setting_key, setting_value, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, setting_key)
        DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP
      `);
      stmt.run(userId, key, value);
    } catch (err) {
      throw err;
    }
  },

  getAllSettings: (userId) => {
    try {
      const rows = db.prepare('SELECT setting_key, setting_value FROM user_settings WHERE user_id = ?').all(userId);
      const result = {};
      for (const row of rows) {
        result[row.setting_key] = row.setting_value;
      }
      return result;
    } catch (err) {
      throw err;
    }
  },

  deleteSetting: (userId, key) => {
    try {
      return db.prepare('DELETE FROM user_settings WHERE user_id = ? AND setting_key = ?').run(userId, key).changes > 0;
    } catch (err) {
      throw err;
    }
  }
};

// User sessions tracking (session ownership per user)
const userSessionsDb = {
  trackSession: (userId, projectName, sessionId, provider = 'claude') => {
    try {
      const stmt = db.prepare(`
        INSERT INTO user_sessions (user_id, project_name, session_id, provider, last_active)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, session_id)
        DO UPDATE SET last_active = CURRENT_TIMESTAMP
      `);
      stmt.run(userId, projectName, sessionId, provider);
    } catch (err) {
      throw err;
    }
  },

  getUserSessions: (userId, projectName = null) => {
    try {
      let query = 'SELECT * FROM user_sessions WHERE user_id = ?';
      const params = [userId];
      if (projectName) {
        query += ' AND project_name = ?';
        params.push(projectName);
      }
      query += ' ORDER BY last_active DESC';
      return db.prepare(query).all(...params);
    } catch (err) {
      throw err;
    }
  },

  getSessionOwner: (sessionId) => {
    try {
      return db.prepare('SELECT user_id FROM user_sessions WHERE session_id = ?').get(sessionId)?.user_id ?? null;
    } catch (err) {
      throw err;
    }
  },

  deleteSession: (userId, sessionId) => {
    try {
      return db.prepare('DELETE FROM user_sessions WHERE user_id = ? AND session_id = ?').run(userId, sessionId).changes > 0;
    } catch (err) {
      throw err;
    }
  }
};

// Notification database operations
const notificationDb = {
  getConfig: (userId) => {
    try {
      return db.prepare('SELECT * FROM notification_config WHERE user_id = ? AND is_active = 1').all(userId);
    } catch (err) {
      throw err;
    }
  },

  saveConfig: (userId, webhookUrl, webhookType = 'wechat_work', events = 'git_commit,deploy_success,deploy_failure') => {
    try {
      const stmt = db.prepare(`
        INSERT INTO notification_config (user_id, webhook_url, webhook_type, events)
        VALUES (?, ?, ?, ?)
      `);
      const result = stmt.run(userId, webhookUrl, webhookType, events);
      return { id: result.lastInsertRowid };
    } catch (err) {
      throw err;
    }
  },

  updateConfig: (userId, configId, webhookUrl, events) => {
    try {
      const stmt = db.prepare('UPDATE notification_config SET webhook_url = ?, events = ? WHERE id = ? AND user_id = ?');
      return stmt.run(webhookUrl, events, configId, userId).changes > 0;
    } catch (err) {
      throw err;
    }
  },

  deleteConfig: (userId, configId) => {
    try {
      return db.prepare('DELETE FROM notification_config WHERE id = ? AND user_id = ?').run(configId, userId).changes > 0;
    } catch (err) {
      throw err;
    }
  },

  toggleConfig: (userId, configId, isActive) => {
    try {
      return db.prepare('UPDATE notification_config SET is_active = ? WHERE id = ? AND user_id = ?').run(isActive ? 1 : 0, configId, userId).changes > 0;
    } catch (err) {
      throw err;
    }
  },

  addLog: (userId, eventType, payload, status, errorMessage = null) => {
    try {
      const stmt = db.prepare('INSERT INTO notification_log (user_id, event_type, payload, status, error_message) VALUES (?, ?, ?, ?, ?)');
      stmt.run(userId, eventType, JSON.stringify(payload), status, errorMessage);
    } catch (err) {
      console.error('Failed to write notification log:', err.message);
    }
  },

  getLogs: (userId, limit = 50, offset = 0) => {
    try {
      return db.prepare('SELECT * FROM notification_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(userId, limit, offset);
    } catch (err) {
      throw err;
    }
  }
};

// Backward compatibility - keep old names pointing to new system
const githubTokensDb = {
  createGithubToken: (userId, tokenName, githubToken, description = null) => {
    return credentialsDb.createCredential(userId, tokenName, 'github_token', githubToken, description);
  },
  getGithubTokens: (userId) => {
    return credentialsDb.getCredentials(userId, 'github_token');
  },
  getActiveGithubToken: (userId) => {
    return credentialsDb.getActiveCredential(userId, 'github_token');
  },
  deleteGithubToken: (userId, tokenId) => {
    return credentialsDb.deleteCredential(userId, tokenId);
  },
  toggleGithubToken: (userId, tokenId, isActive) => {
    return credentialsDb.toggleCredential(userId, tokenId, isActive);
  }
};

export {
  db,
  initializeDatabase,
  userDb,
  apiKeysDb,
  credentialsDb,
  githubTokensDb, // Backward compatibility
  userSettingsDb,
  userSessionsDb,
  notificationDb
};