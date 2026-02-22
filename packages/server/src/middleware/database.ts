import type { Context, Next } from 'hono';
import {
  openDatabase,
  saveDatabase,
  runMigrations,
  getNoriDbPath,
} from '@nori/core';
import type { AppEnv } from '../types.js';

type Database = AppEnv['Variables']['db'];

let sharedDb: Database | null = null;
let dbPath: string | null = null;

export async function initDatabase(): Promise<void> {
  dbPath = getNoriDbPath();
  sharedDb = await openDatabase({ path: dbPath, createIfMissing: true });
  runMigrations(sharedDb);
  console.log('[server] Database initialized and migrations applied');
}

export function getDb(): Database {
  if (!sharedDb) {
    throw new Error('Database not initialized — call initDatabase() at startup');
  }
  return sharedDb;
}

export function saveDb(): void {
  if (sharedDb && dbPath) {
    saveDatabase(sharedDb, dbPath);
  }
}

export function closeDb(): void {
  if (sharedDb) {
    if (dbPath) {
      saveDatabase(sharedDb, dbPath);
    }
    sharedDb.close();
    sharedDb = null;
    dbPath = null;
    console.log('[server] Database closed');
  }
}

/**
 * Middleware that injects the shared database into the request context.
 */
export async function databaseMiddleware(c: Context<AppEnv>, next: Next) {
  c.set('db', getDb());
  c.set('saveDb', saveDb);
  await next();
}
