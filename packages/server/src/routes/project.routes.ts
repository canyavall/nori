import { Hono } from 'hono';
import { projectRegisterSchema } from '@nori/shared';
import { runProjectRegister, runProjectList } from '@nori/core';
import { saveDb } from '../middleware/database.js';
import type { AppEnv } from '../types.js';

const project = new Hono<AppEnv>();

// List all projects
project.get('/', async (c) => {
  const db = c.get('db');
  const result = await runProjectList({ db });
  if (!result.success) {
    return c.json({ error: result.error }, 500);
  }
  return c.json({ data: result.data.projects });
});

// Register a project
project.post('/', async (c) => {
  const body = await c.req.json();
  const input = projectRegisterSchema.parse(body);
  const db = c.get('db');

  const result = await runProjectRegister({ ...input, db });

  if (!result.success) {
    const status = result.error.code === 'PATH_NOT_FOUND' ? 404 : 400;
    return c.json({ error: result.error }, status);
  }

  saveDb();
  return c.json({ data: result.data.project }, 201);
});

export { project as projectRoutes };
