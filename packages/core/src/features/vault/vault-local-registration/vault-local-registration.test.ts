import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { runVaultLocalRegistration } from './vault-local-registration.js';
import { runMigrations } from '../../shared/utils/database.js';
import { validateName } from './actions/validate-name.js';

// ─── Helpers ─────────────────────────────────────────────────────

let SQL: Awaited<ReturnType<typeof initSqlJs>>;

async function makeDb(): Promise<Database> {
  if (!SQL) SQL = await initSqlJs();
  const db = new SQL.Database();
  runMigrations(db);
  return db;
}

// ─── validate-name unit tests ─────────────────────────────────────

describe('validateName', () => {
  it('accepts a valid alphanumeric name', () => {
    const result = validateName('my-vault');
    expect(result.success).toBe(true);
  });

  it('accepts names with underscores and hyphens', () => {
    expect(validateName('my_vault-01').success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = validateName('');
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.code).toBe('INVALID_NAME');
  });

  it('rejects name with spaces', () => {
    const result = validateName('my vault');
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.code).toBe('INVALID_NAME');
  });

  it('rejects name with special characters', () => {
    const result = validateName('my/vault');
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.code).toBe('INVALID_NAME');
  });

  it('rejects name over 100 characters', () => {
    const result = validateName('a'.repeat(101));
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.code).toBe('INVALID_NAME');
  });

  it('accepts name exactly 100 characters', () => {
    expect(validateName('a'.repeat(100)).success).toBe(true);
  });
});

// ─── vault-local-registration integration tests ───────────────────

describe('runVaultLocalRegistration', () => {
  let db: Database;
  let tmpVaultsDir: string;
  let events: Array<{ event: string; data: Record<string, unknown> }>;

  beforeEach(async () => {
    db = await makeDb();
    tmpVaultsDir = join(tmpdir(), `nori-test-${Date.now()}`);
    mkdirSync(tmpVaultsDir, { recursive: true });
    events = [];
  });

  afterEach(() => {
    db.close();
    if (existsSync(tmpVaultsDir)) {
      rmSync(tmpVaultsDir, { recursive: true, force: true });
    }
  });

  it('creates vault directory and DB record on success', async () => {
    const result = await runVaultLocalRegistration(
      { vault_name: 'test-vault', db, vaults_dir: tmpVaultsDir },
      { emit: (e: string, d: Record<string, unknown>) => events.push({ event: e, data: d ?? {} }) }
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    // DB record created
    expect(result.data.vault.name).toBe('test-vault');
    expect(result.data.vault.vault_type).toBe('local');
    expect(result.data.vault.git_url).toBeNull();
    expect(result.data.vault.branch).toBeNull();

    // Directory created
    expect(existsSync(result.data.vault.local_path)).toBe(true);

    // Emitted lifecycle events
    const emittedEvents = events.map((e) => e.event);
    expect(emittedEvents).toContain('vault:local-registration:started');
    expect(emittedEvents).toContain('vault:local-registration:completed');
  });

  it('returns INVALID_NAME for a name with spaces', async () => {
    const result = await runVaultLocalRegistration(
      { vault_name: 'bad name', db, vaults_dir: tmpVaultsDir },
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('INVALID_NAME');
  });

  it('returns DUPLICATE_VAULT_NAME when name already exists', async () => {
    // Register once
    await runVaultLocalRegistration({ vault_name: 'dupe-vault', db, vaults_dir: tmpVaultsDir });

    // Try again with same name
    const result = await runVaultLocalRegistration(
      { vault_name: 'dupe-vault', db, vaults_dir: tmpVaultsDir },
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('DUPLICATE_VAULT_NAME');
  });

  it('returns a vault with a valid UUID id', async () => {
    const result = await runVaultLocalRegistration(
      { vault_name: 'uuid-vault', db, vaults_dir: tmpVaultsDir },
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.vault.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('does not create directory if name is invalid', async () => {
    const vaultPath = join(tmpVaultsDir, 'bad name');
    await runVaultLocalRegistration(
      { vault_name: 'bad name', db, vaults_dir: tmpVaultsDir },
    );
    expect(existsSync(vaultPath)).toBe(false);
  });
});
