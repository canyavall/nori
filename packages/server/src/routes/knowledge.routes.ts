import { Hono } from 'hono';
import { knowledgeCreateSchema, knowledgeEditSchema } from '@nori/shared';
import {
  queryAll,
  queryOne,
  loadExisting,
  queryKnowledgeEntries,
  queryKnowledgeEntryById,
} from '@nori/core';
import { withSSE } from '../sse/emitter.js';
import { saveDb } from '../middleware/database.js';
import type { AppEnv } from '../types.js';

const knowledge = new Hono<AppEnv>();

// AI-generate knowledge proposals from a prompt
knowledge.post('/ai-generate', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !body.vault_id || !body.prompt) {
    return c.json({ error: { code: 'INVALID_INPUT', message: 'vault_id and prompt are required' } }, 400);
  }

  const db = c.get('db');
  const { runKnowledgeAiGenerate } = await import('@nori/core');
  const result = await runKnowledgeAiGenerate({ vault_id: body.vault_id, prompt: body.prompt, db });

  if (!result.success) {
    return c.json({ error: result.error }, 500);
  }
  return c.json({ data: result.data });
});

// Search knowledge entries
knowledge.get('/search', async (c) => {
  const query = c.req.query('q') ?? '';
  const vaultId = c.req.query('vault_id');
  const db = c.get('db');

  const { runKnowledgeSearch } = await import('@nori/core');
  const result = await runKnowledgeSearch({ query, vault_id: vaultId, db });

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }
  return c.json({ data: result.data });
});

// Get knowledge entry content (markdown file)
knowledge.get('/:id/content', async (c) => {
  const entryId = c.req.param('id');
  const db = c.get('db');

  const entry = queryOne(db, 'SELECT * FROM knowledge_entries WHERE id = ?', [entryId]);
  if (!entry) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Entry not found' } }, 404);
  }

  const result = loadExisting(entry.file_path as string);
  if (!result.success) {
    return c.json({ error: result.error }, 500);
  }

  return c.json({ data: { content: result.data.content, frontmatter: result.data.frontmatter } });
});

// Get single knowledge entry
knowledge.get('/:id', async (c) => {
  const entryId = c.req.param('id');
  const db = c.get('db');

  const entry = queryKnowledgeEntryById(db, entryId);
  if (!entry) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Entry not found' } }, 404);
  }

  return c.json({ data: entry });
});

// List knowledge entries
knowledge.get('/', async (c) => {
  const vaultId = c.req.query('vault_id');
  const db = c.get('db');
  const entries = queryKnowledgeEntries(db, vaultId ?? undefined);
  return c.json({ data: entries });
});

// Create knowledge entry (SSE)
knowledge.post('/', async (c) => {
  const body = await c.req.json();
  const input = knowledgeCreateSchema.parse(body);
  const db = c.get('db');

  // Get vault path
  const vault = queryOne(db, 'SELECT local_path FROM vaults WHERE id = ?', [input.vault_id]);
  if (!vault) {
    return c.json({ error: { code: 'VAULT_NOT_FOUND', message: 'Vault not found' } }, 404);
  }

  return withSSE(c, async (emitter) => {
    const { runKnowledgeCreate } = await import('@nori/core');
    const result = await runKnowledgeCreate(
      {
        vault_id: input.vault_id,
        vault_path: vault.local_path as string,
        title: input.title,
        category: input.category,
        tags: input.tags,
        description: input.description,
        required_knowledge: input.required_knowledge,
        rules: input.rules,
        content: input.content,
        db,
      },
      emitter
    );

    if (result.success) {
      saveDb();
    }
    return result;
  });
});

// Edit knowledge entry (SSE)
knowledge.put('/:id', async (c) => {
  const entryId = c.req.param('id');
  const body = await c.req.json();
  const input = knowledgeEditSchema.parse(body);
  const db = c.get('db');

  const entry = queryOne(db, 'SELECT * FROM knowledge_entries WHERE id = ?', [entryId]);
  if (!entry) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Entry not found' } }, 404);
  }

  const vault = queryOne(db, 'SELECT local_path FROM vaults WHERE id = ?', [entry.vault_id]);
  if (!vault) {
    return c.json({ error: { code: 'VAULT_NOT_FOUND', message: 'Vault not found' } }, 404);
  }

  return withSSE(c, async (emitter) => {
    const { runKnowledgeEdit } = await import('@nori/core');
    const result = await runKnowledgeEdit(
      {
        vault_id: entry.vault_id as string,
        vault_path: vault.local_path as string,
        file_path: entry.file_path as string,
        title: input.title,
        category: input.category,
        tags: input.tags,
        description: input.description,
        required_knowledge: input.required_knowledge,
        rules: input.rules,
        content: input.content,
        db,
      },
      emitter
    );

    if (result.success) {
      saveDb();
    }
    return result;
  });
});

// Delete knowledge entry (SSE)
knowledge.delete('/:id', async (c) => {
  const entryId = c.req.param('id');
  const db = c.get('db');

  const entry = queryOne(db, 'SELECT * FROM knowledge_entries WHERE id = ?', [entryId]);
  if (!entry) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Entry not found' } }, 404);
  }

  const vault = queryOne(db, 'SELECT local_path FROM vaults WHERE id = ?', [entry.vault_id]);
  if (!vault) {
    return c.json({ error: { code: 'VAULT_NOT_FOUND', message: 'Vault not found' } }, 404);
  }

  return withSSE(c, async (emitter) => {
    const { runKnowledgeDelete } = await import('@nori/core');
    const result = await runKnowledgeDelete(
      {
        vault_id: entry.vault_id as string,
        vault_path: vault.local_path as string,
        file_path: entry.file_path as string,
        db,
      },
      emitter
    );

    if (result.success) {
      saveDb();
    }
    return result;
  });
});

// Audit knowledge entry (SSE)
knowledge.post('/:id/audit', async (c) => {
  const entryId = c.req.param('id');
  const db = c.get('db');

  const entry = queryOne(db, 'SELECT * FROM knowledge_entries WHERE id = ?', [entryId]);
  if (!entry) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Entry not found' } }, 404);
  }

  return withSSE(c, async (emitter) => {
    const { runKnowledgeAudit } = await import('@nori/core');
    const result = await runKnowledgeAudit(
      { file_path: entry.file_path as string },
      emitter
    );
    return result;
  });
});

export { knowledge as knowledgeRoutes };
