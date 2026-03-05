import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { queryOne, runKnowledgeCreate } from '@nori/core';
import { makeDb, buildTestApp, consumeSSE, insertVault, type TestDb } from './harness.js';

describe('POST /api/knowledge (create entry)', () => {
  let db: TestDb;
  let app: ReturnType<typeof buildTestApp>;
  let tmpDir: string;
  let vaultId: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `nori-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    db = await makeDb();
    const vault = insertVault(db, { local_path: tmpDir });
    vaultId = vault.id;
    app = buildTestApp(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('creates entry in DB and writes markdown file', async () => {
    const res = await app.request('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vault_id: vaultId,
        title: 'Test Knowledge Entry',
        category: 'tutorial',
        tags: ['tag1', 'tag2', 'tag3'],
        description: 'A test knowledge entry for integration testing',
        required_knowledge: [],
        rules: [],
        content: '# Test Knowledge Entry\n\nThis is integration test content.',
      }),
    });

    expect(res.status).toBe(200);

    const { result } = await consumeSSE(res);
    const r = result as { success: boolean; data: { entry_id: string; file_path: string; title: string } };
    expect(r.success).toBe(true);
    expect(r.data.title).toBe('Test Knowledge Entry');

    // Verify entry row persisted in DB
    const row = queryOne(db, 'SELECT * FROM knowledge_entries WHERE id = ?', [r.data.entry_id]);
    expect(row).not.toBeNull();
    expect(row?.title).toBe('Test Knowledge Entry');
    expect(row?.vault_id).toBe(vaultId);

    // Verify markdown file was written to disk
    expect(existsSync(r.data.file_path)).toBe(true);
  });
});

describe('GET /api/knowledge/search (keyword search)', () => {
  let db: TestDb;
  let app: ReturnType<typeof buildTestApp>;
  let tmpDir: string;
  let vaultId: string;
  const seededTitle = 'Searchable Integration Entry';

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `nori-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    db = await makeDb();
    const vault = insertVault(db, { local_path: tmpDir });
    vaultId = vault.id;

    // Seed a knowledge entry directly via core flow (no HTTP)
    await runKnowledgeCreate(
      {
        vault_id: vaultId,
        vault_path: tmpDir,
        title: seededTitle,
        category: 'reference',
        tags: ['search', 'integration', 'testing'],
        description: 'Seeded entry for search integration test',
        required_knowledge: [],
        rules: [],
        content: '# Searchable Integration Entry\n\nContent for search testing.',
        db,
      }
    );

    app = buildTestApp(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('returns matching entries for keyword query', async () => {
    const res = await app.request(
      `/api/knowledge/search?q=Searchable&vault_id=${vaultId}`
    );

    expect(res.status).toBe(200);

    const body = await res.json() as { data: { results: Array<{ title: string }>; total_count: number } };
    expect(body.data.results.length).toBeGreaterThan(0);
    expect(body.data.results[0].title).toBe(seededTitle);
  });
});
