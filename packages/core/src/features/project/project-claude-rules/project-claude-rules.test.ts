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

  it('does NOT include root CLAUDE.md (moved to claude-mds feature)', async () => {
    const dir = makeTempDir();
    writeFileSync(join(dir, 'CLAUDE.md'), '# Root rules', 'utf-8');

    const result = await runListClaudeRules({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules).toHaveLength(0);
    }
  });

  it('does NOT include .claude/CLAUDE.md (moved to claude-mds feature)', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# Project rules', 'utf-8');

    const result = await runListClaudeRules({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules).toHaveLength(0);
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

  it('only returns modular rules even when CLAUDE.md files are present', async () => {
    const dir = makeTempDir();
    writeFileSync(join(dir, 'CLAUDE.md'), '# Root', 'utf-8');
    mkdirSync(join(dir, '.claude', 'rules'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# Project', 'utf-8');
    writeFileSync(join(dir, '.claude', 'rules', 'testing.md'), '# Testing', 'utf-8');

    const result = await runListClaudeRules({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules).toHaveLength(1);
      expect(result.data.rules[0].type).toBe('modular');
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
  it('reads a modular rule file', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude', 'rules'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'rules', 'api.md'), '# API rules content', 'utf-8');

    const result = await runReadClaudeRule({ projectPath: dir, relativePath: '.claude/rules/api.md' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe('# API rules content');
      expect(result.data.type).toBe('modular');
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
    const result = await runReadClaudeRule({ projectPath: dir, relativePath: '.claude/rules/missing.md' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('RULE_NOT_FOUND');
    }
  });
});

describe('runWriteClaudeRule', () => {
  it('writes content to a modular rule file', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude', 'rules'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'rules', 'api.md'), '# Old content', 'utf-8');

    const result = await runWriteClaudeRule({
      projectPath: dir,
      relativePath: '.claude/rules/api.md',
      content: '# New content',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rule.type).toBe('modular');
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
