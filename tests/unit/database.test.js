import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createTestDb, cleanupTestDb } from '../fixtures/test-db.js';

describe('Database Operations', () => {
  let db, dbPath;

  beforeAll(() => {
    ({ db, dbPath } = createTestDb());
  });

  afterAll(() => {
    db.close();
    cleanupTestDb(dbPath);
  });

  test('should create tables', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('api_keys');
    expect(tableNames).toContain('user_credentials');
    expect(tableNames).toContain('user_settings');
    expect(tableNames).toContain('user_sessions');
    expect(tableNames).toContain('notification_config');
    expect(tableNames).toContain('notification_log');
  });

  test('should create user with admin role for first user', () => {
    db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')").run('admin', 'hash123');
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    expect(user.role).toBe('admin');
  });

  test('should create notification config', () => {
    db.prepare("INSERT INTO notification_config (user_id, webhook_url) VALUES (1, 'https://example.com/hook')").run();
    const config = db.prepare('SELECT * FROM notification_config WHERE user_id = 1').get();
    expect(config.webhook_url).toBe('https://example.com/hook');
    expect(config.webhook_type).toBe('wechat_work');
  });

  test('should track user sessions', () => {
    db.prepare("INSERT INTO user_sessions (user_id, project_name, session_id, provider) VALUES (1, 'test-project', 'session-1', 'claude')").run();
    const session = db.prepare('SELECT * FROM user_sessions WHERE session_id = ?').get('session-1');
    expect(session.user_id).toBe(1);
    expect(session.provider).toBe('claude');
  });
});
