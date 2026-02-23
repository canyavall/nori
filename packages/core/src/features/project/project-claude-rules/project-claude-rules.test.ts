import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runListClaudeRules, runReadClaudeRule, runWriteClaudeRule } from './project-claude-rules.js';

let tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'nori-rules-test-'));
  tempDirs.push(dir);
  return dir;
}

describe('runListClaudeRules', () => {
  it('returns empty array when no rule files exist', async () => {
    const dir = makeTempDir();
    const result = await runListClaudeRules({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules).toHaveLength(0);
    }
  });

  it('discovers root CLAUDE.md', async () => {
    const dir = makeTempDir();
    writeFileSync(join(dir, 'CLAUDE.md'), '# Root rules', 'utf-8');

    const result = await runListClaudeRules({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules).toHaveLength(1);
      expect(result.data.rules[0].type).toBe('root');
      expect(result.data.rules[0].relativePath).toBe('CLAUDE.md');
    }
  });

  it('discovers .claude/CLAUDE.md', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# Project rules', 'utf-8');

    const result = await runListClaudeRules({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules).toHaveLength(1);
      expect(result.data.rules[0].type).toBe('project');
    }
  });

  it('discovers modular rules in .claude/rules/', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude', 'rules'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'rules', 'frontend.md'), '# Frontend rules', 'utf-8');

    const result = await runListClaudeRules({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules).toHaveLength(1);
      expect(result.data.rules[0].type).toBe('modular');
      expect(result.data.rules[0].name).toBe('frontend');
    }
  });

  it('discovers nested modular rules', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude', 'rules', 'backend'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'rules', 'backend', 'api.md'), '# API rules', 'utf-8');

    const result = await runListClaudeRules({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules).toHaveLength(1);
      expect(result.data.rules[0].name).toBe('api');
      expect(result.data.rules[0].relativePath).toBe('.claude/rules/backend/api.md');
    }
  });

  it('discovers all rule types together', async () => {
    const dir = makeTempDir();
    writeFileSync(join(dir, 'CLAUDE.md'), '# Root', 'utf-8');
    mkdirSync(join(dir, '.claude', 'rules'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# Project', 'utf-8');
    writeFileSync(join(dir, '.claude', 'rules', 'testing.md'), '# Testing', 'utf-8');

    const result = await runListClaudeRules({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules).toHaveLength(3);
      const types = result.data.rules.map((r: { type: string }) => r.type);
      expect(types).toContain('root');
      expect(types).toContain('project');
      expect(types).toContain('modular');
    }
  });

  it('parses globs from frontmatter', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude', 'rules'), { recursive: true });
    writeFileSync(
      join(dir, '.claude', 'rules', 'scoped.md'),
      '---\npaths:\n  - "src/**/*.ts"\n---\nScoped rules',
      'utf-8',
    );

    const result = await runListClaudeRules({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules[0].globs).toEqual(['src/**/*.ts']);
    }
  });
});

describe('runReadClaudeRule', () => {
  it('reads a rule file', async () => {
    const dir = makeTempDir();
    writeFileSync(join(dir, 'CLAUDE.md'), '# Root rules content', 'utf-8');

    const result = await runReadClaudeRule({ projectPath: dir, relativePath: 'CLAUDE.md' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe('# Root rules content');
      expect(result.data.type).toBe('root');
    }
  });

  it('rejects path traversal', async () => {
    const dir = makeTempDir();
    const result = await runReadClaudeRule({
      projectPath: dir,
      relativePath: '../../etc/passwd',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_PATH');
    }
  });

  it('returns error for missing file', async () => {
    const dir = makeTempDir();
    const result = await runReadClaudeRule({ projectPath: dir, relativePath: 'CLAUDE.md' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('RULE_NOT_FOUND');
    }
  });
});

describe('runWriteClaudeRule', () => {
  it('writes content to a rule file', async () => {
    const dir = makeTempDir();
    writeFileSync(join(dir, 'CLAUDE.md'), '# Old content', 'utf-8');

    const result = await runWriteClaudeRule({
      projectPath: dir,
      relativePath: 'CLAUDE.md',
      content: '# New content',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rule.type).toBe('root');
    }
  });

  it('rejects path traversal on write', async () => {
    const dir = makeTempDir();
    const result = await runWriteClaudeRule({
      projectPath: dir,
      relativePath: '../../etc/passwd',
      content: 'malicious',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_PATH');
    }
  });
});
