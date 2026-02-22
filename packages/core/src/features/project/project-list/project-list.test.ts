import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runMigrations } from '../../shared/utils/database.js';
import { runProjectList } from './project-list.js';

// ── Setup ──────────────────────────────────────────────────────────────────────

let db: Database;
let tempDirs: string[] = [];

beforeEach(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  runMigrations(db);
  tempDirs = [];
});

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Creates a real temp directory so existsSync() passes in runProjectList */
function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'nori-test-'));
  tempDirs.push(dir);
  return dir;
}

function insertProject(opts: {
  id?: string;
  name?: string;
  path: string;
  is_git?: boolean;
  connected_vaults?: string[];
}) {
  const id = opts.id ?? crypto.randomUUID();
  db.run(
    `INSERT INTO projects (id, name, path, is_git, connected_vaults, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [
      id,
      opts.name ?? 'project',
      opts.path,
      opts.is_git ? 1 : 0,
      JSON.stringify(opts.connected_vaults ?? []),
    ],
  );
  return id;
}

function insertVault(vaultId: string) {
  db.run(
    `INSERT INTO vaults (id, name, git_url, branch, local_path, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [vaultId, `vault-${vaultId}`, 'https://github.com/x/y.git', 'main', `/vaults/${vaultId}`],
  );
}

function insertVaultLink(vaultId: string, projectPath: string) {
  db.run(
    `INSERT INTO vault_links (id, vault_id, project_path, created_at)
     VALUES (?, ?, ?, datetime('now'))`,
    [crypto.randomUUID(), vaultId, projectPath],
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('runProjectList', () => {
  it('returns empty list when no projects', async () => {
    const result = await runProjectList({ db });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projects).toHaveLength(0);
    }
  });

  it('returns projects with empty connected_vaults when no links exist', async () => {
    const projectPath = makeTempDir();
    insertProject({ path: projectPath });
    const result = await runProjectList({ db });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projects[0].connected_vaults).toEqual([]);
    }
  });

  it('populates connected_vaults from vault_links, not the projects JSON column', async () => {
    const projectPath = makeTempDir();
    // Register project with empty connected_vaults (JSON column = [])
    insertProject({ path: projectPath, connected_vaults: [] });

    // Register a vault and link it to the project
    const vaultId = 'vault-abc';
    insertVault(vaultId);
    insertVaultLink(vaultId, projectPath);

    const result = await runProjectList({ db });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projects[0].connected_vaults).toEqual([vaultId]);
    }
  });

  it('returns all vault IDs linked to a project', async () => {
    const projectPath = makeTempDir();
    insertProject({ path: projectPath });

    const vault1 = 'vault-1';
    const vault2 = 'vault-2';
    insertVault(vault1);
    insertVault(vault2);
    insertVaultLink(vault1, projectPath);
    insertVaultLink(vault2, projectPath);

    const result = await runProjectList({ db });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projects[0].connected_vaults.sort()).toEqual([vault1, vault2].sort());
    }
  });

  it('does not cross-contaminate vaults between different projects', async () => {
    const path1 = makeTempDir();
    const path2 = makeTempDir();
    insertProject({ id: 'p1', path: path1 });
    insertProject({ id: 'p2', path: path2 });

    const vaultA = 'vault-a';
    const vaultB = 'vault-b';
    insertVault(vaultA);
    insertVault(vaultB);
    insertVaultLink(vaultA, path1);
    insertVaultLink(vaultB, path2);

    const result = await runProjectList({ db });
    expect(result.success).toBe(true);
    if (result.success) {
      const p1 = result.data.projects.find((p) => p.id === 'p1');
      const p2 = result.data.projects.find((p) => p.id === 'p2');
      expect(p1?.connected_vaults).toEqual([vaultA]);
      expect(p2?.connected_vaults).toEqual([vaultB]);
    }
  });

  it('ignores the stale connected_vaults JSON column when vault_links exist', async () => {
    const projectPath = makeTempDir();
    const staleVaultId = 'old-vault-not-in-links';
    const realVaultId = 'real-vault-in-links';

    // Simulate a stale JSON column with a vault that's no longer linked
    insertProject({ path: projectPath, connected_vaults: [staleVaultId] });
    insertVault(realVaultId);
    insertVaultLink(realVaultId, projectPath);

    const result = await runProjectList({ db });
    expect(result.success).toBe(true);
    if (result.success) {
      const proj = result.data.projects[0];
      expect(proj.connected_vaults).toContain(realVaultId);
      expect(proj.connected_vaults).not.toContain(staleVaultId);
    }
  });
});
