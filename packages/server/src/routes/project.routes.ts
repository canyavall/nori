import { Hono } from 'hono';
import { projectRegisterSchema } from '@nori/shared';
import type { DiscoveredProject, Project } from '@nori/shared';
import { runProjectRegister, runProjectList, runProjectDiscoverClaudeCode } from '@nori/core';
import { saveDb } from '../middleware/database.js';
import type { AppEnv } from '../types.js';

const project = new Hono<AppEnv>();

// List all projects (merged: Nori-registered + Claude Code discovered)
project.get('/', async (c) => {
  const db = c.get('db');

  const [listResult, discoverResult] = await Promise.all([
    runProjectList({ db }),
    runProjectDiscoverClaudeCode(),
  ]);

  if (!listResult.success) {
    return c.json({ error: listResult.error }, 500);
  }

  const noriProjects = listResult.data.projects;
  const discovered = discoverResult.success ? discoverResult.data.discovered : [];

  // Build a set of registered paths for fast lookup
  const registeredPaths = new Set(noriProjects.map((p: Project) => p.path));

  // Start with Nori-registered projects
  const merged: DiscoveredProject[] = noriProjects.map((p: Project) => {
    const claudeMatch = discovered.find((d: DiscoveredProject) => d.path === p.path);
    return {
      ...p,
      source: claudeMatch ? 'both' as const : 'nori' as const,
      has_nori: true,
      claude_code: claudeMatch?.claude_code,
    };
  });

  // Append Claude Code-only discoveries (not registered in Nori)
  for (const d of discovered) {
    if (!registeredPaths.has(d.path)) {
      merged.push(d);
    }
  }

  return c.json({ data: merged });
});

// Discover Claude Code projects only
project.get('/discover', async (c) => {
  const result = await runProjectDiscoverClaudeCode();
  if (!result.success) {
    return c.json({ error: result.error }, 500);
  }
  return c.json({ data: result.data.discovered });
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
