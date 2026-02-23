import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { runKnowledgeEdit } from './knowledge-edit.js';
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

/** Seeds a knowledge_entries row and writes its markdown file. */
function seedEntry(
  db: Database,
  vaultPath: string,
  opts: {
    id: string;
    vault_id: string;
    category: string;
    title: string;
    tags: string[];
    content: string;
    description?: string;
    required_knowledge?: string[];
    rules?: string[];
  }
): string {
  const dir = join(vaultPath, opts.category);
  mkdirSync(dir, { recursive: true });
  const slug = opts.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const filePath = join(dir, `${slug}.md`);
  const desc = opts.description ?? VALID_DESC;
  const reqKnowledge = opts.required_knowledge ?? [];
  const rules = opts.rules ?? [];
  const frontmatter = `---\ntitle: ${opts.title}\ncategory: ${opts.category}\ntags: [${opts.tags.join(', ')}]\ndescription: "${desc}"\nrequired_knowledge: [${reqKnowledge.join(', ')}]\nrules: [${rules.join(', ')}]\n---\n`;
  writeFileSync(filePath, frontmatter + opts.content, 'utf-8');

  const now = new Date().toISOString();
  db.run(
    `INSERT INTO knowledge_entries (id, vault_id, file_path, title, category, tags, description, required_knowledge, rules, content_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [opts.id, opts.vault_id, filePath, opts.title, opts.category, JSON.stringify(opts.tags), desc, JSON.stringify(reqKnowledge), JSON.stringify(rules), 'abc123', now, now]
  );

  return filePath;
}

// ─── regenerateIndex unit tests ───────────────────────────────────────────────

describe('regenerateIndex (edit)', () => {
  let db: Database;

  beforeEach(async () => {
    db = await makeDb();
    // seed an existing row to update
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO knowledge_entries (id, vault_id, file_path, title, category, tags, description, required_knowledge, rules, content_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['e1', 'v1', '/vault/cat/entry.md', 'Old Title', 'old-cat', '["old-tag"]', 'old desc', '[]', '[]', 'hash0', now, now]
    );
  });

  afterEach(() => {
    db.close();
  });

  it('updates title, category, tags, description, required_knowledge, and rules in the DB', () => {
    const result = regenerateIndex(
      '/vault/cat/entry.md',
      'New Title',
      'new-cat',
      ['new-tag', 'tag-b', 'tag-c'],
      'new description',
      ['prereq'],
      ['rule one'],
      'Updated content.',
      db
    );

    expect(result.success).toBe(true);

    const rows = queryRows(db, 'SELECT * FROM knowledge_entries WHERE file_path = ?', ['/vault/cat/entry.md']);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('New Title');
    expect(rows[0].category).toBe('new-cat');
    expect(rows[0].tags).toBe('["new-tag","tag-b","tag-c"]');
    expect(rows[0].description).toBe('new description');
    expect(rows[0].required_knowledge).toBe('["prereq"]');
    expect(rows[0].rules).toBe('["rule one"]');
  });

  it('updates the content_hash', () => {
    regenerateIndex('/vault/cat/entry.md', 'T', 'c', ['tag-a', 'tag-b', 'tag-c'], 'desc', [], [], 'new content', db);
    const rows = queryRows(db, 'SELECT content_hash FROM knowledge_entries WHERE file_path = ?', ['/vault/cat/entry.md']);
    expect(rows[0].content_hash).not.toBe('hash0');
  });

  it('updates the updated_at timestamp', async () => {
    const before = queryRows(db, 'SELECT updated_at FROM knowledge_entries WHERE file_path = ?', ['/vault/cat/entry.md'])[0].updated_at as string;
    await new Promise((r) => setTimeout(r, 5));
    regenerateIndex('/vault/cat/entry.md', 'T', 'c', ['tag-a', 'tag-b', 'tag-c'], 'desc', [], [], 'content', db);
    const after = queryRows(db, 'SELECT updated_at FROM knowledge_entries WHERE file_path = ?', ['/vault/cat/entry.md'])[0].updated_at as string;
    expect(after >= before).toBe(true);
  });

  it('does nothing if file_path does not match any row', () => {
    const result = regenerateIndex('/nonexistent/path.md', 'T', 'c', ['tag-a', 'tag-b', 'tag-c'], 'desc', [], [], 'content', db);
    expect(result.success).toBe(true);
    // The original row is untouched
    const rows = queryRows(db, 'SELECT title FROM knowledge_entries WHERE id = ?', ['e1']);
    expect(rows[0].title).toBe('Old Title');
  });

  it('returns success: true with total_entries = 1', () => {
    const result = regenerateIndex('/vault/cat/entry.md', 'T', 'c', ['tag-a', 'tag-b', 'tag-c'], 'desc', [], [], 'content', db);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.total_entries).toBe(1);
  });
});

// ─── runKnowledgeEdit integration tests ───────────────────────────────────────

describe('runKnowledgeEdit', () => {
  let db: Database;
  let vaultPath: string;
  let events: Array<{ event: string; data: Record<string, unknown> }>;

  beforeEach(async () => {
    db = await makeDb();
    vaultPath = join(tmpdir(), `nori-test-edit-${Date.now()}`);
    mkdirSync(vaultPath, { recursive: true });
    events = [];
  });

  afterEach(() => {
    db.close();
    if (existsSync(vaultPath)) rmSync(vaultPath, { recursive: true, force: true });
  });

  it('updates the markdown file on disk', async () => {
    const filePath = seedEntry(db, vaultPath, {
      id: 'e1',
      vault_id: 'v1',
      category: 'auth',
      title: 'JWT Auth',
      tags: VALID_TAGS,
      content: 'Original content.',
    });

    const result = await runKnowledgeEdit(
      {
        vault_id: 'v1',
        vault_path: vaultPath,
        file_path: filePath,
        title: 'JWT Auth Updated',
        category: 'auth',
        tags: ['jwt-auth', 'security', 'tokens'],
        description: VALID_DESC,
        required_knowledge: [],
        rules: [],
        content: 'Updated content.',
        db,
      },
      { emit: (e: string, d: Record<string, unknown>) => events.push({ event: e, data: d ?? {} }) }
    );

    expect(result.success).toBe(true);
    expect(existsSync(filePath)).toBe(true);
  });

  it('updates the DB record with new title, category, tags, and new fields', async () => {
    const filePath = seedEntry(db, vaultPath, {
      id: 'e2',
      vault_id: 'v1',
      category: 'auth',
      title: 'Old Title',
      tags: VALID_TAGS,
      content: 'Old content.',
    });

    await runKnowledgeEdit({
      vault_id: 'v1',
      vault_path: vaultPath,
      file_path: filePath,
      title: 'New Title',
      category: 'new-cat',
      tags: ['new-tag', 'tag-b', 'tag-c'],
      description: 'Updated description',
      required_knowledge: ['prereq-one'],
      rules: ['Must follow this rule'],
      content: 'New content.',
      db,
    });

    const rows = queryRows(db, 'SELECT * FROM knowledge_entries WHERE file_path = ?', [filePath]);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('New Title');
    expect(rows[0].category).toBe('new-cat');
    expect(rows[0].tags).toBe('["new-tag","tag-b","tag-c"]');
    expect(rows[0].description).toBe('Updated description');
    expect(rows[0].required_knowledge).toBe('["prereq-one"]');
    expect(rows[0].rules).toBe('["Must follow this rule"]');
  });

  it('returns entry_id, file_path, and title on success', async () => {
    const filePath = seedEntry(db, vaultPath, {
      id: 'e3',
      vault_id: 'v1',
      category: 'cat',
      title: 'Entry',
      tags: VALID_TAGS,
      content: 'Content.',
    });

    const result = await runKnowledgeEdit({
      vault_id: 'v1',
      vault_path: vaultPath,
      file_path: filePath,
      title: 'Entry',
      category: 'cat',
      tags: VALID_TAGS,
      description: VALID_DESC,
      required_knowledge: [],
      rules: [],
      content: 'Content.',
      db,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.entry_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.data.file_path).toBe(filePath);
    expect(result.data.title).toBe('Entry');
  });

  it('emits knowledge:edit:started and knowledge:edit:completed events', async () => {
    const filePath = seedEntry(db, vaultPath, {
      id: 'e4',
      vault_id: 'v1',
      category: 'cat',
      title: 'Event Entry',
      tags: VALID_TAGS,
      content: 'Content.',
    });

    await runKnowledgeEdit(
      {
        vault_id: 'v1',
        vault_path: vaultPath,
        file_path: filePath,
        title: 'Event Entry',
        category: 'cat',
        tags: VALID_TAGS,
        description: VALID_DESC,
        required_knowledge: [],
        rules: [],
        content: 'Content.',
        db,
      },
      { emit: (e: string, d: Record<string, unknown>) => events.push({ event: e, data: d ?? {} }) }
    );

    const emitted = events.map((e) => e.event);
    expect(emitted).toContain('knowledge:edit:started');
    expect(emitted).toContain('knowledge:edit:completed');
    expect(emitted).toContain('knowledge:edit:regenerating-index');
  });

  it('fails with ENTRY_NOT_FOUND when file does not exist', async () => {
    const result = await runKnowledgeEdit({
      vault_id: 'v1',
      vault_path: vaultPath,
      file_path: join(vaultPath, 'nonexistent.md'),
      title: 'T',
      category: 'c',
      tags: VALID_TAGS,
      description: VALID_DESC,
      required_knowledge: [],
      rules: [],
      content: 'content',
      db,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('ENTRY_NOT_FOUND');
  });
});
