import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runListClaudeMds } from './project-claude-mds.js';

let tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'nori-claude-mds-test-'));
  tempDirs.push(dir);
  return dir;
}

describe('runListClaudeMds', () => {
  it('returns empty array when no CLAUDE.md files exist', async () => {
    const dir = makeTempDir();
    const result = await runListClaudeMds({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files).toHaveLength(0);
    }
  });

  it('discovers root CLAUDE.md', async () => {
    const dir = makeTempDir();
    writeFileSync(join(dir, 'CLAUDE.md'), '# Root rules', 'utf-8');

    const result = await runListClaudeMds({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files).toHaveLength(1);
      expect(result.data.files[0].relativePath).toBe('CLAUDE.md');
      expect(result.data.files[0].dir).toBe('.');
    }
  });

  it('discovers .claude/CLAUDE.md', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# Claude config rules', 'utf-8');

    const result = await runListClaudeMds({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files).toHaveLength(1);
      expect(result.data.files[0].relativePath).toBe('.claude/CLAUDE.md');
      expect(result.data.files[0].dir).toBe('.claude');
    }
  });

  it('discovers CLAUDE.md in subdirectories', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, 'packages', 'app'), { recursive: true });
    writeFileSync(join(dir, 'packages', 'app', 'CLAUDE.md'), '# App rules', 'utf-8');

    const result = await runListClaudeMds({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files).toHaveLength(1);
      expect(result.data.files[0].relativePath).toBe('packages/app/CLAUDE.md');
      expect(result.data.files[0].dir).toBe('packages/app');
    }
  });

  it('discovers multiple CLAUDE.md files at different depths', async () => {
    const dir = makeTempDir();
    writeFileSync(join(dir, 'CLAUDE.md'), '# Root', 'utf-8');
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# Claude', 'utf-8');
    mkdirSync(join(dir, 'packages', 'core'), { recursive: true });
    writeFileSync(join(dir, 'packages', 'core', 'CLAUDE.md'), '# Core', 'utf-8');

    const result = await runListClaudeMds({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files).toHaveLength(3);
      const paths = result.data.files.map((f: { relativePath: string }) => f.relativePath);
      expect(paths).toContain('CLAUDE.md');
      expect(paths).toContain('.claude/CLAUDE.md');
      expect(paths).toContain('packages/core/CLAUDE.md');
    }
  });

  it('sorts results with shallowest files first', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, 'packages', 'app', 'src'), { recursive: true });
    writeFileSync(join(dir, 'packages', 'app', 'src', 'CLAUDE.md'), '# Deep', 'utf-8');
    writeFileSync(join(dir, 'CLAUDE.md'), '# Root', 'utf-8');
    mkdirSync(join(dir, 'packages', 'core'), { recursive: true });
    writeFileSync(join(dir, 'packages', 'core', 'CLAUDE.md'), '# Core', 'utf-8');

    const result = await runListClaudeMds({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files[0].relativePath).toBe('CLAUDE.md');
      const depths = result.data.files.map((f: { relativePath: string }) =>
        f.relativePath.split('/').length - 1,
      );
      for (let i = 1; i < depths.length; i++) {
        expect(depths[i]).toBeGreaterThanOrEqual(depths[i - 1]);
      }
    }
  });

  it('ignores node_modules directory', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, 'node_modules', 'some-pkg'), { recursive: true });
    writeFileSync(join(dir, 'node_modules', 'some-pkg', 'CLAUDE.md'), '# Pkg rules', 'utf-8');

    const result = await runListClaudeMds({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files).toHaveLength(0);
    }
  });

  it('ignores .git directory', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.git'), { recursive: true });
    writeFileSync(join(dir, '.git', 'CLAUDE.md'), '# Git rules', 'utf-8');

    const result = await runListClaudeMds({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files).toHaveLength(0);
    }
  });

  it('does not pick up files named something other than CLAUDE.md', async () => {
    const dir = makeTempDir();
    writeFileSync(join(dir, 'claude.md'), '# lowercase', 'utf-8');
    writeFileSync(join(dir, 'CLAUDE.md.bak'), '# backup', 'utf-8');
    writeFileSync(join(dir, 'README.md'), '# readme', 'utf-8');

    const result = await runListClaudeMds({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files).toHaveLength(0);
    }
  });
});
