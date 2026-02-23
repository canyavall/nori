import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../types.js';

// ─── Mock @nori/core ──────────────────────────────────────────────
const mockRunVaultRegistration = vi.fn();
const mockRunVaultLocalRegistration = vi.fn();
const mockRunVaultLinkProject = vi.fn();
const mockRunVaultUnlinkProject = vi.fn();
const mockRunVaultKnowledgeImport = vi.fn();
const mockRunVaultKnowledgeExport = vi.fn();
const mockQueryAll = vi.fn();
const mockQueryOne = vi.fn();

vi.mock('@nori/core', () => ({
  runVaultRegistration: mockRunVaultRegistration,
  runVaultLocalRegistration: mockRunVaultLocalRegistration,
  runVaultLinkProject: mockRunVaultLinkProject,
  runVaultUnlinkProject: mockRunVaultUnlinkProject,
  runVaultKnowledgeImport: mockRunVaultKnowledgeImport,
  runVaultKnowledgeExport: mockRunVaultKnowledgeExport,
  queryAll: mockQueryAll,
  queryOne: mockQueryOne,
}));

// ─── Mock SSE (returns JSON directly instead of streaming) ────────
vi.mock('../sse/emitter.js', () => ({
  withSSE: vi.fn(async (c: import('hono').Context, handler: (emitter: { emit: () => void }) => Promise<unknown>) => {
    const emitter = { emit: vi.fn() };
    const result = await handler(emitter);
    return c.json(result);
  }),
}));

// ─── Mock database middleware ─────────────────────────────────────
const mockSaveDb = vi.fn();
vi.mock('../middleware/database.js', () => ({
  saveDb: mockSaveDb,
}));

// ─── Import route AFTER all mocks are set up ─────────────────────
const { vaultRoutes } = await import('./vault.routes.js');

// ─── Test helpers ─────────────────────────────────────────────────

function buildApp() {
  const app = new Hono<AppEnv>();
  // Inject a stub db into context
  app.use('*', (c, next) => {
    c.set('db', {} as never);
    return next();
  });
  app.route('/api/vault', vaultRoutes);
  return app;
}

const mockVault = {
  id: 'vault-id-123',
  name: 'test-vault',
  vault_type: 'git' as const,
  git_url: 'https://github.com/owner/repo.git',
  branch: 'main',
  local_path: '/tmp/test-vault',
  created_at: '2026-02-21T00:00:00.000Z',
  updated_at: '2026-02-21T00:00:00.000Z',
  last_synced_at: null,
};

const mockLocalVault = {
  ...mockVault,
  vault_type: 'local' as const,
  git_url: null,
  branch: null,
};

// ─── Tests ────────────────────────────────────────────────────────

describe('POST /api/vault', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('vault_type = git', () => {
    it('calls runVaultRegistration with git payload', async () => {
      mockRunVaultRegistration.mockResolvedValueOnce({
        success: true,
        data: { vault: mockVault, knowledge_count: 5 },
      });

      const app = buildApp();
      const res = await app.request('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vault_type: 'git',
          vault_name: 'test-vault',
          git_url: 'https://github.com/owner/repo.git',
          branch: 'main',
        }),
      });

      expect(res.status).toBe(200);
      expect(mockRunVaultRegistration).toHaveBeenCalledOnce();
      expect(mockRunVaultLocalRegistration).not.toHaveBeenCalled();

      const body = await res.json() as { success: boolean; data: { vault: typeof mockVault; knowledge_count: number } };
      expect(body.success).toBe(true);
      expect(body.data.vault.name).toBe('test-vault');
    });

    it('defaults to git flow when vault_type is omitted', async () => {
      mockRunVaultRegistration.mockResolvedValueOnce({
        success: true,
        data: { vault: mockVault, knowledge_count: 0 },
      });

      const app = buildApp();
      await app.request('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vault_name: 'test-vault',
          git_url: 'https://github.com/owner/repo.git',
          branch: 'main',
        }),
      });

      expect(mockRunVaultRegistration).toHaveBeenCalledOnce();
      expect(mockRunVaultLocalRegistration).not.toHaveBeenCalled();
    });

    it('calls saveDb on success', async () => {
      mockRunVaultRegistration.mockResolvedValueOnce({
        success: true,
        data: { vault: mockVault, knowledge_count: 0 },
      });

      const app = buildApp();
      await app.request('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vault_type: 'git',
          vault_name: 'test-vault',
          git_url: 'https://github.com/owner/repo.git',
          branch: 'main',
        }),
      });

      expect(mockSaveDb).toHaveBeenCalledOnce();
    });

    it('does not call saveDb on failure', async () => {
      mockRunVaultRegistration.mockResolvedValueOnce({
        success: false,
        error: { code: 'GIT_ACCESS_DENIED', message: 'Auth failed', step: '02', severity: 'error', recoverable: true },
      });

      const app = buildApp();
      await app.request('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vault_type: 'git',
          vault_name: 'test-vault',
          git_url: 'https://github.com/owner/repo.git',
          branch: 'main',
        }),
      });

      expect(mockSaveDb).not.toHaveBeenCalled();
    });
  });

  describe('vault_type = local', () => {
    it('calls runVaultLocalRegistration with local payload', async () => {
      mockRunVaultLocalRegistration.mockResolvedValueOnce({
        success: true,
        data: { vault: mockLocalVault, knowledge_count: 0 },
      });

      const app = buildApp();
      const res = await app.request('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vault_type: 'local',
          vault_name: 'my-local-vault',
        }),
      });

      expect(res.status).toBe(200);
      expect(mockRunVaultLocalRegistration).toHaveBeenCalledOnce();
      expect(mockRunVaultRegistration).not.toHaveBeenCalled();

      const body = await res.json() as { success: boolean; data: { vault: typeof mockLocalVault; knowledge_count: number } };
      expect(body.success).toBe(true);
      expect(body.data.vault.vault_type).toBe('local');
    });

    it('calls saveDb on success', async () => {
      mockRunVaultLocalRegistration.mockResolvedValueOnce({
        success: true,
        data: { vault: mockLocalVault, knowledge_count: 0 },
      });

      const app = buildApp();
      await app.request('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vault_type: 'local',
          vault_name: 'my-local-vault',
        }),
      });

      expect(mockSaveDb).toHaveBeenCalledOnce();
    });

    it('returns 400 for invalid local payload (missing vault_name)', async () => {
      const app = buildApp();
      const res = await app.request('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vault_type: 'local' }),
      });

      expect(res.status).toBe(400);
      expect(mockRunVaultLocalRegistration).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid git payload (missing git_url)', async () => {
      const app = buildApp();
      const res = await app.request('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vault_type: 'git', vault_name: 'test' }),
      });

      expect(res.status).toBe(400);
      expect(mockRunVaultRegistration).not.toHaveBeenCalled();
    });
  });
});

describe('GET /api/vault', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns list of vaults', async () => {
    mockQueryAll.mockReturnValueOnce([mockVault, mockLocalVault]);

    const app = buildApp();
    const res = await app.request('/api/vault');

    expect(res.status).toBe(200);
    const body = await res.json() as { data: typeof mockVault[] };
    expect(body.data).toHaveLength(2);
  });
});

// ─── GET /api/vault/:id/links ────────────────────────────────────────────────

describe('GET /api/vault/:id/links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLink = {
    id: 'link-id-1',
    vault_id: 'vault-id-123',
    project_path: '/home/user/my-project',
    created_at: '2026-02-22T00:00:00.000Z',
  };

  it('returns links for the vault', async () => {
    mockQueryAll.mockReturnValueOnce([mockLink]);

    const app = buildApp();
    const res = await app.request('/api/vault/vault-id-123/links');

    expect(res.status).toBe(200);
    const body = await res.json() as { data: typeof mockLink[] };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].project_path).toBe('/home/user/my-project');
  });

  it('returns empty array when vault has no links', async () => {
    mockQueryAll.mockReturnValueOnce([]);

    const app = buildApp();
    const res = await app.request('/api/vault/vault-id-123/links');

    expect(res.status).toBe(200);
    const body = await res.json() as { data: unknown[] };
    expect(body.data).toHaveLength(0);
  });
});

// ─── DELETE /api/vault/:id/links/:linkId ─────────────────────────────────────

describe('DELETE /api/vault/:id/links/:linkId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls runVaultUnlinkProject and returns result', async () => {
    mockRunVaultUnlinkProject.mockResolvedValueOnce({
      success: true,
      data: { link_id: 'link-1', vault_id: 'vault-id-123', project_path: '/home/user/proj' },
    });

    const app = buildApp();
    const res = await app.request('/api/vault/vault-id-123/links/link-1', { method: 'DELETE' });

    expect(res.status).toBe(200);
    expect(mockRunVaultUnlinkProject).toHaveBeenCalledOnce();
    expect(mockSaveDb).toHaveBeenCalledOnce();
    const body = await res.json() as { data: { link_id: string } };
    expect(body.data.link_id).toBe('link-1');
  });

  it('returns 404 when link not found', async () => {
    mockRunVaultUnlinkProject.mockResolvedValueOnce({
      success: false,
      error: { code: 'LINK_NOT_FOUND', message: 'Link not found', step: '02', severity: 'error', recoverable: true },
    });

    const app = buildApp();
    const res = await app.request('/api/vault/vault-id-123/links/bad-link', { method: 'DELETE' });

    expect(res.status).toBe(404);
    expect(mockSaveDb).not.toHaveBeenCalled();
  });

  it('returns 404 when vault not found', async () => {
    mockRunVaultUnlinkProject.mockResolvedValueOnce({
      success: false,
      error: { code: 'VAULT_NOT_FOUND', message: 'Vault not found', step: '01', severity: 'error', recoverable: true },
    });

    const app = buildApp();
    const res = await app.request('/api/vault/bad-vault/links/link-1', { method: 'DELETE' });

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/vault/:id/knowledge/import ────────────────────────────────────

describe('POST /api/vault/:id/knowledge/import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls runVaultKnowledgeImport and saves db on success', async () => {
    mockRunVaultKnowledgeImport.mockResolvedValueOnce({
      success: true,
      data: { imported_count: 3, skipped_count: 1 },
    });

    const app = buildApp();
    const res = await app.request('/api/vault/vault-id-123/knowledge/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_paths: ['/home/user/docs/note.md'] }),
    });

    expect(res.status).toBe(200);
    expect(mockRunVaultKnowledgeImport).toHaveBeenCalledOnce();
    expect(mockSaveDb).toHaveBeenCalledOnce();
    const body = await res.json() as { success: boolean; data: { imported_count: number } };
    expect(body.data.imported_count).toBe(3);
  });

  it('returns 400 when source_paths is missing', async () => {
    const app = buildApp();
    const res = await app.request('/api/vault/vault-id-123/knowledge/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    expect(mockRunVaultKnowledgeImport).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON', async () => {
    const app = buildApp();
    const res = await app.request('/api/vault/vault-id-123/knowledge/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    expect(res.status).toBe(400);
  });

  it('does not save db on flow failure', async () => {
    mockRunVaultKnowledgeImport.mockResolvedValueOnce({
      success: false,
      error: { code: 'VAULT_NOT_FOUND', message: 'Vault not found', step: '01', severity: 'error', recoverable: true },
    });

    const app = buildApp();
    await app.request('/api/vault/vault-id-123/knowledge/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_paths: ['/home/user/note.md'] }),
    });

    expect(mockSaveDb).not.toHaveBeenCalled();
  });
});

// ─── POST /api/vault/:id/knowledge/export ────────────────────────────────────

describe('POST /api/vault/:id/knowledge/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls runVaultKnowledgeExport and returns result', async () => {
    mockRunVaultKnowledgeExport.mockResolvedValueOnce({
      success: true,
      data: { exported_count: 5, destination_path: '/home/user/export' },
    });

    const app = buildApp();
    const res = await app.request('/api/vault/vault-id-123/knowledge/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination_path: '/home/user/export' }),
    });

    expect(res.status).toBe(200);
    expect(mockRunVaultKnowledgeExport).toHaveBeenCalledOnce();
    const body = await res.json() as { success: boolean; data: { exported_count: number } };
    expect(body.data.exported_count).toBe(5);
  });

  it('returns 400 when destination_path is missing', async () => {
    const app = buildApp();
    const res = await app.request('/api/vault/vault-id-123/knowledge/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    expect(mockRunVaultKnowledgeExport).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON', async () => {
    const app = buildApp();
    const res = await app.request('/api/vault/vault-id-123/knowledge/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    expect(res.status).toBe(400);
  });
});
