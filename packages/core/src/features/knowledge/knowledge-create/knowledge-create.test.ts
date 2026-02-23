import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { runKnowledgeCreate } from './knowledge-create.js';
import { regenerateIndex } from './actions/regenerate-index.js';
import { runMigrations } from '../../shared/utils/database.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

let SQL: Awaited<ReturnType<typeof initSqlJs>>;

async function makeDb(): Promise<Database> {
  if (!SQL) SQL = await initSqlJs();
  const db = new SQL.Database();
  runMigrations(db);
  return db;
}

function queryRows(db: Database, sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql);
  stmt.bind(params as (string | number | null)[]);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

const VALID_TAGS = ['my-tag', 'another-tag', 'third-tag'];
const VALID_DESC = 'A valid description for testing purposes.';

// ─── regenerateIndex unit tests ───────────────────────────────────────────────

describe('regenerateIndex (create)', () => {
  let db: Database;

  beforeEach(async () => {
    db = await makeDb();
  });

  afterEach(() => {
    db.close();
  });

  it('inserts a new row into knowledge_entries', () => {
    const result = regenerateIndex(
      'entry-id-1',
      'vault-id-1',
      '/vaults/v1/auth/jwt.md',
      'JWT Auth',
      'auth',
      ['jwt-auth', 'security', 'tokens'],
      'JWT authentication guide',
      ['http-basics'],
      ['Always validate token expiry'],
      '# JWT\n\nContent here.',
      db
    );

    expect(result.success).toBe(true);

    const rows = queryRows(db, 'SELECT * FROM knowledge_entries WHERE id = ?', ['entry-id-1']);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('JWT Auth');
    expect(rows[0].category).toBe('auth');
    expect(rows[0].vault_id).toBe('vault-id-1');
    expect(rows[0].file_path).toBe('/vaults/v1/auth/jwt.md');
    expect(rows[0].description).toBe('JWT authentication guide');
    expect(rows[0].required_knowledge).toBe('["http-basics"]');
    expect(rows[0].rules).toBe('["Always validate token expiry"]');
  });

  it('stores tags as JSON string', () => {
    regenerateIndex('e1', 'v1', '/f.md', 'T', 'cat', ['tag-a', 'tag-b', 'tag-c'], 'desc', [], [], 'content', db);
    const rows = queryRows(db, 'SELECT tags FROM knowledge_entries WHERE id = ?', ['e1']);
    expect(rows[0].tags).toBe('["tag-a","tag-b","tag-c"]');
  });

  it('stores a non-empty content_hash', () => {
    regenerateIndex('e2', 'v1', '/f.md', 'T', 'cat', ['tag-a', 'tag-b', 'tag-c'], 'desc', [], [], 'some content', db);
    const rows = queryRows(db, 'SELECT content_hash FROM knowledge_entries WHERE id = ?', ['e2']);
    expect(typeof rows[0].content_hash).toBe('string');
    expect((rows[0].content_hash as string).length).toBeGreaterThan(0);
  });

  it('replaces an existing row when entry_id collides (INSERT OR REPLACE)', () => {
    regenerateIndex('e3', 'v1', '/f.md', 'Old Title', 'cat', ['tag-a', 'tag-b', 'tag-c'], 'old desc', [], [], 'old', db);
    regenerateIndex('e3', 'v1', '/f.md', 'New Title', 'cat', ['tag-a', 'tag-b', 'tag-c'], 'new desc', [], [], 'new', db);
    const rows = queryRows(db, 'SELECT * FROM knowledge_entries WHERE id = ?', ['e3']);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('New Title');
    expect(rows[0].description).toBe('new desc');
  });

  it('returns success: true with total_entries = 1', () => {
    const result = regenerateIndex('e4', 'v1', '/f.md', 'T', 'cat', ['tag-a', 'tag-b', 'tag-c'], 'desc', [], [], 'content', db);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total_entries).toBe(1);
    }
  });
});

// ─── runKnowledgeCreate integration tests ─────────────────────────────────────

describe('runKnowledgeCreate', () => {
  let db: Database;
  let vaultPath: string;
  let events: Array<{ event: string; data: Record<string, unknown> }>;

  beforeEach(async () => {
    db = await makeDb();
    vaultPath = join(tmpdir(), `nori-test-create-${Date.now()}`);
    mkdirSync(vaultPath, { recursive: true });
    events = [];
  });

  afterEach(() => {
    db.close();
    if (existsSync(vaultPath)) rmSync(vaultPath, { recursive: true, force: true });
  });

  it('writes a markdown file to disk', async () => {
    const result = await runKnowledgeCreate(
      {
        vault_id: 'v1',
        vault_path: vaultPath,
        title: 'My Entry',
        category: 'general',
        tags: VALID_TAGS,
        description: VALID_DESC,
        required_knowledge: [],
        rules: [],
        content: '# My Entry\n\nHello.',
        db,
      },
      { emit: (e: string, d: Record<string, unknown>) => events.push({ event: e, data: d ?? {} }) }
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(existsSync(result.data.file_path)).toBe(true);
  });

  it('inserts the new entry into the knowledge_entries DB table', async () => {
    const result = await runKnowledgeCreate({
      vault_id: 'vault-abc',
      vault_path: vaultPath,
      title: 'DB Entry Test',
      category: 'testing',
      tags: VALID_TAGS,
      description: VALID_DESC,
      required_knowledge: ['prerequisite'],
      rules: ['Always test first'],
      content: '# DB Entry Test\n\nContent.',
      db,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const rows = queryRows(db, 'SELECT * FROM knowledge_entries WHERE id = ?', [result.data.entry_id]);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('DB Entry Test');
    expect(rows[0].category).toBe('testing');
    expect(rows[0].vault_id).toBe('vault-abc');
    expect(rows[0].description).toBe(VALID_DESC);
    expect(rows[0].required_knowledge).toBe('["prerequisite"]');
    expect(rows[0].rules).toBe('["Always test first"]');
  });

  it('returns entry_id, file_path, and title on success', async () => {
    const result = await runKnowledgeCreate({
      vault_id: 'v1',
      vault_path: vaultPath,
      title: 'Return Fields',
      category: 'cat',
      tags: VALID_TAGS,
      description: VALID_DESC,
      required_knowledge: [],
      rules: [],
      content: '# Content\n\nSome details here.',
      db,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.entry_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.data.title).toBe('Return Fields');
    expect(result.data.file_path).toContain('return-fields.md');
  });

  it('emits knowledge:create:started and knowledge:create:completed events', async () => {
    await runKnowledgeCreate(
      {
        vault_id: 'v1',
        vault_path: vaultPath,
        title: 'Events Test',
        category: 'cat',
        tags: VALID_TAGS,
        description: VALID_DESC,
        required_knowledge: [],
        rules: [],
        content: '# Events\n\nSome details here.',
        db,
      },
      { emit: (e: string, d: Record<string, unknown>) => events.push({ event: e, data: d ?? {} }) }
    );

    const emitted = events.map((e) => e.event);
    expect(emitted).toContain('knowledge:create:started');
    expect(emitted).toContain('knowledge:create:completed');
    expect(emitted).toContain('knowledge:create:regenerating-index');
  });

  it('fails with INVALID_FRONTMATTER when title is blank', async () => {
    const result = await runKnowledgeCreate({
      vault_id: 'v1',
      vault_path: vaultPath,
      title: '',
      category: 'cat',
      tags: VALID_TAGS,
      description: VALID_DESC,
      required_knowledge: [],
      rules: [],
      content: '# Content here',
      db,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('INVALID_FRONTMATTER');
  });

  it('fails with INVALID_FRONTMATTER when category is blank', async () => {
    const result = await runKnowledgeCreate({
      vault_id: 'v1',
      vault_path: vaultPath,
      title: 'Title',
      category: '',
      tags: VALID_TAGS,
      description: VALID_DESC,
      required_knowledge: [],
      rules: [],
      content: '# Content here',
      db,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('INVALID_FRONTMATTER');
  });

  it('fails with EMPTY_CONTENT when content is blank', async () => {
    const result = await runKnowledgeCreate({
      vault_id: 'v1',
      vault_path: vaultPath,
      title: 'Title',
      category: 'cat',
      tags: VALID_TAGS,
      description: VALID_DESC,
      required_knowledge: [],
      rules: [],
      content: '',
      db,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('EMPTY_CONTENT');
  });

  it('does not insert a DB row when file write fails (duplicate file)', async () => {
    // Create the entry once
    await runKnowledgeCreate({
      vault_id: 'v1',
      vault_path: vaultPath,
      title: 'Duplicate',
      category: 'cat',
      tags: VALID_TAGS,
      description: VALID_DESC,
      required_knowledge: [],
      rules: [],
      content: '# Dup\n\nDuplicate content.',
      db,
    });

    // Try creating again with the same title → same file name → FILE_ALREADY_EXISTS
    const result = await runKnowledgeCreate({
      vault_id: 'v1',
      vault_path: vaultPath,
      title: 'Duplicate',
      category: 'cat',
      tags: VALID_TAGS,
      description: VALID_DESC,
      required_knowledge: [],
      rules: [],
      content: '# Dup\n\nDuplicate content.',
      db,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('FILE_ALREADY_EXISTS');

    // DB should have exactly one entry for this title
    const rows = queryRows(db, 'SELECT * FROM knowledge_entries WHERE title = ?', ['Duplicate']);
    expect(rows).toHaveLength(1);
  });

  it('fails with INVALID_FRONTMATTER when tags < 3', async () => {
    const result = await runKnowledgeCreate({
      vault_id: 'v1',
      vault_path: vaultPath,
      title: 'Too Few Tags',
      category: 'cat',
      tags: ['one', 'two'],
      description: VALID_DESC,
      required_knowledge: [],
      rules: [],
      content: '# Content',
      db,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('INVALID_FRONTMATTER');
  });

  it('fails with INVALID_FRONTMATTER when tags are not kebab-case', async () => {
    const result = await runKnowledgeCreate({
      vault_id: 'v1',
      vault_path: vaultPath,
      title: 'Bad Tags',
      category: 'cat',
      tags: ['CamelCase', 'with spaces', 'under_score'],
      description: VALID_DESC,
      required_knowledge: [],
      rules: [],
      content: '# Content',
      db,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('INVALID_FRONTMATTER');
  });

  it('fails with INVALID_FRONTMATTER when description is missing', async () => {
    const result = await runKnowledgeCreate({
      vault_id: 'v1',
      vault_path: vaultPath,
      title: 'No Description',
      category: 'cat',
      tags: VALID_TAGS,
      description: '',
      required_knowledge: [],
      rules: [],
      content: '# Content',
      db,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('INVALID_FRONTMATTER');
  });

  it('fails with CONTENT_TOO_LONG when content exceeds 10K chars', async () => {
    const result = await runKnowledgeCreate({
      vault_id: 'v1',
      vault_path: vaultPath,
      title: 'Long Content',
      category: 'cat',
      tags: VALID_TAGS,
      description: VALID_DESC,
      required_knowledge: [],
      rules: [],
      content: 'x'.repeat(10_001),
      db,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('CONTENT_TOO_LONG');
  });
});
