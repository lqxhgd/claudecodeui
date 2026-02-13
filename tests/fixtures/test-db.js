/**
 * Test database setup/teardown utility
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createTestDb() {
  const dbPath = path.join(__dirname, `test-${Date.now()}.db`);
  const db = new Database(dbPath);

  // Load and execute init.sql
  const initSql = fs.readFileSync(
    path.join(__dirname, '../../server/database/init.sql'),
    'utf8'
  );
  db.exec(initSql);

  return { db, dbPath };
}

export function cleanupTestDb(dbPath) {
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  } catch (err) {
    console.warn('Failed to cleanup test db:', err.message);
  }
}
