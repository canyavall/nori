import { Hono } from 'hono';
import { vaultRegistrationSchema, vaultLocalRegistrationSchema, vaultLinkProjectSchema } from '@nori/shared';
import {
  runVaultRegistration,
  runVaultLocalRegistration,
  runVaultLinkProject,
  queryAll,
  queryOne,
} from '@nori/core';
import { withSSE } from '../sse/emitter.js';
import { saveDb } from '../middleware/database.js';
import type { AppEnv } from '../types.js';

const vault = new Hono<AppEnv>();

// List all vaults
vault.get('/', async (c) => {
  const db = c.get('db');
  const vaults = queryAll(db, 'SELECT * FROM vaults ORDER BY created_at DESC');
  return c.json({ data: vaults });
});

// Register a new vault (SSE) — dispatches to git or local flow based on vault_type
vault.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return c.json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } }, 400);
  }

  const db = c.get('db');
  const vaultType = (body as Record<string, unknown>).vault_type;

  if (vaultType === 'local') {
    const parsed = vaultLocalRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid input' } }, 400);
    }

    return withSSE(c, async (emitter) => {
      const result = await runVaultLocalRegistration(
        { vault_name: parsed.data.vault_name, db },
        emitter
      );
      if (result.success) saveDb();
      return result;
    });
  }

  // Default: git vault
  const parsed = vaultRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid input' } }, 400);
  }

  return withSSE(c, async (emitter) => {
    const result = await runVaultRegistration(
      {
        vault_name: parsed.data.vault_name,
        git_url: parsed.data.git_url,
        branch: parsed.data.branch,
        db,
      },
      emitter
    );
    if (result.success) saveDb();
    return result;
  });
});

// Link vault to project
vault.post('/:id/link', async (c) => {
  const vaultId = c.req.param('id');
  const body = await c.req.json();
  const input = vaultLinkProjectSchema.parse({ vault_id: vaultId, ...body });
  const db = c.get('db');

  const result = await runVaultLinkProject(
    { vault_id: input.vault_id, project_path: input.project_path, db },
  );

  if (result.success) {
    saveDb();
  }

  if (!result.success) {
    const status = result.error.severity === 'fatal' ? 500 : 400;
    return c.json({ error: result.error }, status);
  }

  return c.json({ data: result.data });
});

// Pull vault (SSE)
vault.post('/:id/pull', async (c) => {
  const vaultId = c.req.param('id');
  const db = c.get('db');

  return withSSE(c, async (emitter) => {
    const { runVaultPull } = await import('@nori/core');
    const result = await runVaultPull({ vault_id: vaultId, db }, emitter);

    if (result.success) {
      saveDb();
    }
    return result;
  });
});

// Push vault (SSE)
vault.post('/:id/push', async (c) => {
  const vaultId = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } }, 400);
  }
  const db = c.get('db');

  return withSSE(c, async (emitter) => {
    const { runVaultPush } = await import('@nori/core');
    const result = await runVaultPush(
      { vault_id: vaultId, db, commit_message: body.commit_message },
      emitter
    );
    if (result.success) {
      saveDb();
    }
    return result;
  });
});

// Reconcile vault (SSE)
vault.post('/:id/reconcile', async (c) => {
  const vaultId = c.req.param('id');
  const db = c.get('db');

  const vaultRow = queryOne(db, 'SELECT local_path FROM vaults WHERE id = ?', [vaultId]);
  if (!vaultRow) {
    return c.json({ error: { code: 'VAULT_NOT_FOUND', message: 'Vault not found' } }, 404);
  }

  return withSSE(c, async (emitter) => {
    const { runVaultReconciliation } = await import('@nori/core');
    const result = await runVaultReconciliation(
      { vault_id: vaultId, vault_path: vaultRow.local_path as string, db },
      emitter
    );
    if (result.success) {
      saveDb();
    }
    return result;
  });
});

// Regenerate vault database (SSE)
vault.post('/:id/regenerate-db', async (c) => {
  const vaultId = c.req.param('id');
  const db = c.get('db');

  const vaultRow = queryOne(db, 'SELECT local_path FROM vaults WHERE id = ?', [vaultId]);
  if (!vaultRow) {
    return c.json({ error: { code: 'VAULT_NOT_FOUND', message: 'Vault not found' } }, 404);
  }

  return withSSE(c, async (emitter) => {
    const { runVaultRegenerateDb } = await import('@nori/core');
    const result = await runVaultRegenerateDb(
      { vault_id: vaultId, vault_path: vaultRow.local_path as string, db },
      emitter
    );
    if (result.success) {
      saveDb();
    }
    return result;
  });
});

// Generate vector embeddings (SSE)
vault.post('/:id/embed', async (c) => {
  const vaultId = c.req.param('id');
  const db = c.get('db');

  return withSSE(c, async (emitter) => {
    const { runVaultVectorEmbedding } = await import('@nori/core');
    const result = await runVaultVectorEmbedding(
      { vault_id: vaultId, db },
      emitter
    );
    return result;
  });
});

// Audit vault (SSE)
vault.post('/:id/audit', async (c) => {
  const vaultId = c.req.param('id');
  const db = c.get('db');

  const vaultRow = queryOne(db, 'SELECT local_path FROM vaults WHERE id = ?', [vaultId]);
  if (!vaultRow) {
    return c.json({ error: { code: 'VAULT_NOT_FOUND', message: 'Vault not found' } }, 404);
  }

  return withSSE(c, async (emitter) => {
    const { runVaultAudit } = await import('@nori/core');
    const result = await runVaultAudit(
      { vault_id: vaultId, vault_path: vaultRow.local_path as string, db },
      emitter
    );
    return result;
  });
});

export { vault as vaultRoutes };
