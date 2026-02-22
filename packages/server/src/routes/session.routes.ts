import { Hono } from 'hono';
import { sessionCreateSchema } from '@nori/shared';
import { queryAll, queryOne } from '@nori/core';
import { saveDb } from '../middleware/database.js';
import type { AppEnv } from '../types.js';

const session = new Hono<AppEnv>();

// List sessions
session.get('/', async (c) => {
  const db = c.get('db');
  const sessions = queryAll(db, 'SELECT * FROM sessions ORDER BY updated_at DESC');
  return c.json({ data: sessions });
});

// Get session
session.get('/:id', async (c) => {
  const sessionId = c.req.param('id');
  const db = c.get('db');

  const sess = queryOne(db, 'SELECT * FROM sessions WHERE id = ?', [sessionId]);
  if (!sess) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Session not found' } }, 404);
  }
  return c.json({ data: sess });
});

// Create session
session.post('/', async (c) => {
  const body = await c.req.json();
  const input = sessionCreateSchema.parse(body);
  const db = c.get('db');

  const { runSessionCreate } = await import('@nori/core');
  const result = await runSessionCreate({
    vault_id: input.vault_id,
    title: input.title,
    db,
  });

  if (result.success) {
    saveDb();
  }

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }
  return c.json({ data: result.data });
});

// Resume session
session.post('/:id/resume', async (c) => {
  const sessionId = c.req.param('id');
  const db = c.get('db');

  const { runSessionResume } = await import('@nori/core');
  const result = await runSessionResume({ session_id: sessionId, db });

  if (result.success) {
    saveDb();
  }

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }
  return c.json({ data: result.data });
});

// Archive session
session.post('/:id/archive', async (c) => {
  const sessionId = c.req.param('id');
  const db = c.get('db');

  const { runSessionArchive } = await import('@nori/core');
  const result = await runSessionArchive({ session_id: sessionId, db });

  if (result.success) {
    saveDb();
  }

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }
  return c.json({ data: result.data });
});

export { session as sessionRoutes };
