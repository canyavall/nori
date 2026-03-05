import { Hono } from 'hono';
import { openDatabase, runMigrations } from '@nori/core';
import { vaultRoutes } from '../routes/vault.routes.js';
import { knowledgeRoutes } from '../routes/knowledge.routes.js';
import { errorHandler } from '../middleware/error-handler.js';
import type { AppEnv } from '../types.js';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export type TestDb = Awaited<ReturnType<typeof openDatabase>>;

export async function makeDb(): Promise<TestDb> {
  // Pass a non-existent path with createIfMissing — openDatabase returns a fresh
  // in-memory sql.js Database without writing to disk unless saveDatabase is called.
  const db = await openDatabase({
    path: join(tmpdir(), `nori-test-${randomUUID()}.db`),
    createIfMissing: true,
  });
  runMigrations(db);
  return db;
}

export function buildTestApp(db: TestDb) {
  const app = new Hono<AppEnv>();

  // Error handler first
  app.use('*', errorHandler);

  // Inject test DB — saveDb is a no-op (no disk I/O in tests)
  app.use('*', (c, next) => {
    c.set('db', db as never);
    c.set('saveDb', () => {});
    return next();
  });

  app.route('/api/vault', vaultRoutes);
  app.route('/api/knowledge', knowledgeRoutes);

  return app;
}

export interface SSEEvent {
  event: string;
  data: unknown;
}

export interface ConsumedSSE {
  events: SSEEvent[];
  result: unknown;
}

export async function consumeSSE(res: Response): Promise<ConsumedSSE> {
  const text = await res.text();
  const blocks = text.split('\n\n').filter(Boolean);
  const events: SSEEvent[] = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    let event = '';
    let data = '';
    for (const line of lines) {
      if (line.startsWith('event: ')) event = line.slice(7).trim();
      else if (line.startsWith('data: ')) data = line.slice(6).trim();
    }
    if (event && data) {
      try { events.push({ event, data: JSON.parse(data) }); }
      catch { events.push({ event, data }); }
    }
  }

  const resultEvent = events.find(e => e.event === 'result');
  return { events, result: resultEvent?.data ?? null };
}

export function insertVault(
  db: TestDb,
  overrides: { id?: string; name?: string; local_path: string; vault_type?: string }
): { id: string; name: string; vault_type: string; local_path: string } {
  const id = overrides.id ?? randomUUID();
  const name = overrides.name ?? `test-vault-${id.slice(0, 8)}`;
  const vaultType = overrides.vault_type ?? 'local';
  db.run(
    `INSERT INTO vaults (id, name, vault_type, local_path) VALUES (?, ?, ?, ?)`,
    [id, name, vaultType, overrides.local_path]
  );
  return { id, name, vault_type: vaultType, local_path: overrides.local_path };
}
