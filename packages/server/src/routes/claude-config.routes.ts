import { Hono } from 'hono';
import {
  runListClaudeSkills,
  runReadClaudeSkill,
  runWriteClaudeSkill,
  runListClaudeRules,
  runReadClaudeRule,
  runWriteClaudeRule,
  runReadClaudeHooks,
  runWriteClaudeHooks,
  runReadClaudeMcps,
  runWriteClaudeMcps,
} from '@nori/core';
import type { AppEnv } from '../types.js';

const claudeConfig = new Hono<AppEnv>();

function decodeProjectPath(c: { req: { query: (key: string) => string | undefined } }): string | null {
  const encoded = c.req.query('projectPath');
  if (!encoded) return null;
  try {
    return atob(encoded);
  } catch {
    return null;
  }
}

// ── Skills ──────────────────────────────────────────────────────────

claudeConfig.get('/skills', async (c) => {
  const projectPath = decodeProjectPath(c);
  if (!projectPath) return c.json({ error: { code: 'MISSING_PROJECT_PATH', message: 'projectPath query param required' } }, 400);

  const result = await runListClaudeSkills({ projectPath });
  if (!result.success) return c.json({ error: result.error }, 500);
  return c.json({ data: result.data.skills });
});

claudeConfig.get('/skills/:name', async (c) => {
  const projectPath = decodeProjectPath(c);
  if (!projectPath) return c.json({ error: { code: 'MISSING_PROJECT_PATH', message: 'projectPath query param required' } }, 400);

  const name = c.req.param('name');
  const result = await runReadClaudeSkill({ projectPath, name });
  if (!result.success) {
    const status = result.error.code === 'SKILL_NOT_FOUND' ? 404 : 500;
    return c.json({ error: result.error }, status);
  }
  return c.json({ data: result.data });
});

claudeConfig.put('/skills/:name', async (c) => {
  const projectPath = decodeProjectPath(c);
  if (!projectPath) return c.json({ error: { code: 'MISSING_PROJECT_PATH', message: 'projectPath query param required' } }, 400);

  const name = c.req.param('name');
  const body = await c.req.json<{ content: string }>();
  const result = await runWriteClaudeSkill({ projectPath, name, content: body.content });
  if (!result.success) {
    const status = result.error.code === 'SKILL_NOT_FOUND' ? 404 : 500;
    return c.json({ error: result.error }, status);
  }
  return c.json({ data: result.data.skill });
});

// ── Rules ───────────────────────────────────────────────────────────

claudeConfig.get('/rules', async (c) => {
  const projectPath = decodeProjectPath(c);
  if (!projectPath) return c.json({ error: { code: 'MISSING_PROJECT_PATH', message: 'projectPath query param required' } }, 400);

  const result = await runListClaudeRules({ projectPath });
  if (!result.success) return c.json({ error: result.error }, 500);
  return c.json({ data: result.data.rules });
});

claudeConfig.get('/rules/:relativePath{.+}', async (c) => {
  const projectPath = decodeProjectPath(c);
  if (!projectPath) return c.json({ error: { code: 'MISSING_PROJECT_PATH', message: 'projectPath query param required' } }, 400);

  const relativePath = c.req.param('relativePath');
  const result = await runReadClaudeRule({ projectPath, relativePath });
  if (!result.success) {
    const status = result.error.code === 'RULE_NOT_FOUND' ? 404 : result.error.code === 'INVALID_PATH' ? 400 : 500;
    return c.json({ error: result.error }, status);
  }
  return c.json({ data: result.data });
});

claudeConfig.put('/rules/:relativePath{.+}', async (c) => {
  const projectPath = decodeProjectPath(c);
  if (!projectPath) return c.json({ error: { code: 'MISSING_PROJECT_PATH', message: 'projectPath query param required' } }, 400);

  const relativePath = c.req.param('relativePath');
  const body = await c.req.json<{ content: string }>();
  const result = await runWriteClaudeRule({ projectPath, relativePath, content: body.content });
  if (!result.success) {
    const status = result.error.code === 'INVALID_PATH' ? 400 : 500;
    return c.json({ error: result.error }, status);
  }
  return c.json({ data: result.data.rule });
});

// ── Hooks ───────────────────────────────────────────────────────────

claudeConfig.get('/hooks', async (c) => {
  const projectPath = decodeProjectPath(c);
  if (!projectPath) return c.json({ error: { code: 'MISSING_PROJECT_PATH', message: 'projectPath query param required' } }, 400);

  const result = await runReadClaudeHooks({ projectPath });
  if (!result.success) return c.json({ error: result.error }, 500);
  return c.json({ data: result.data });
});

claudeConfig.put('/hooks', async (c) => {
  const projectPath = decodeProjectPath(c);
  if (!projectPath) return c.json({ error: { code: 'MISSING_PROJECT_PATH', message: 'projectPath query param required' } }, 400);

  const body = await c.req.json<{ target: 'shared' | 'local'; hooks: string }>();
  const result = await runWriteClaudeHooks({ projectPath, target: body.target, hooksJson: body.hooks });
  if (!result.success) {
    const status = result.error.code === 'INVALID_JSON' ? 400 : 500;
    return c.json({ error: result.error }, status);
  }
  return c.json({ data: result.data });
});

// ── MCPs ────────────────────────────────────────────────────────────

claudeConfig.get('/mcps', async (c) => {
  const projectPath = decodeProjectPath(c);
  if (!projectPath) return c.json({ error: { code: 'MISSING_PROJECT_PATH', message: 'projectPath query param required' } }, 400);

  const result = await runReadClaudeMcps({ projectPath });
  if (!result.success) return c.json({ error: result.error }, 500);
  return c.json({ data: result.data });
});

claudeConfig.put('/mcps', async (c) => {
  const projectPath = decodeProjectPath(c);
  if (!projectPath) return c.json({ error: { code: 'MISSING_PROJECT_PATH', message: 'projectPath query param required' } }, 400);

  const body = await c.req.json<{ content: string }>();
  const result = await runWriteClaudeMcps({ projectPath, content: body.content });
  if (!result.success) {
    const status = result.error.code === 'INVALID_JSON' ? 400 : 500;
    return c.json({ error: result.error }, status);
  }
  return c.json({ data: result.data });
});

export { claudeConfig as claudeConfigRoutes };
