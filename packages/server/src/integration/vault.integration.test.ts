import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { queryOne } from '@nori/core';
import { makeDb, buildTestApp, consumeSSE, type TestDb } from './harness.js';

const NORI_VAULTS_DIR = join(homedir(), '.nori', 'vaults');

describe('POST /api/vault (local registration)', () => {
  let db: TestDb;
  let app: ReturnType<typeof buildTestApp>;
  let tmpName: string;

  beforeEach(async () => {
    tmpName = `nori-test-vault-${Date.now()}`;
    db = await makeDb();
    app = buildTestApp(db);
  });

  afterEach(() => {
    db.close();
    const vaultPath = join(NORI_VAULTS_DIR, tmpName);
    if (existsSync(vaultPath)) {
      rmSync(vaultPath, { recursive: true, force: true });
    }
  });

  it('creates vault in DB and initialises directory', async () => {
    const res = await app.request('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vault_type: 'local', vault_name: tmpName }),
    });

    expect(res.status).toBe(200);

    const { result } = await consumeSSE(res);
    const r = result as { success: boolean; data: { vault: { name: string; vault_type: string } } };
    expect(r.success).toBe(true);
    expect(r.data.vault.name).toBe(tmpName);
    expect(r.data.vault.vault_type).toBe('local');

    // Verify vault row persisted in DB
    const row = queryOne(db, 'SELECT * FROM vaults WHERE name = ?', [tmpName]);
    expect(row).not.toBeNull();
    expect(row?.name).toBe(tmpName);
    expect(row?.vault_type).toBe('local');

    // Verify directory was created on disk
    const vaultPath = join(NORI_VAULTS_DIR, tmpName);
    expect(existsSync(vaultPath)).toBe(true);
  });
});
