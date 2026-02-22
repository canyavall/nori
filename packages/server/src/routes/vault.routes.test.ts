import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// ─── Mock @nori/core ──────────────────────────────────────────────
const mockRunVaultRegistration = vi.fn();
const mockRunVaultLocalRegistration = vi.fn();
const mockRunVaultLinkProject = vi.fn();
const mockQueryAll = vi.fn();
const mockQueryOne = vi.fn();

vi.mock('@nori/core', () => ({
  runVaultRegistration: mockRunVaultRegistration,
  runVaultLocalRegistration: mockRunVaultLocalRegistration,
  runVaultLinkProject: mockRunVaultLinkProject,
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
  const app = new Hono();
  // Inject a stub db into context
  app.use('*', (c, next) => {
    c.set('db', {} as import('sql.js').Database);
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
