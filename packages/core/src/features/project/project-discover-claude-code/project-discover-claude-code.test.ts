import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { runProjectDiscoverClaudeCode } from './project-discover-claude-code.js';

// ── Setup ──────────────────────────────────────────────────────────────────────

let tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'nori-discover-test-'));
  tempDirs.push(dir);
  return dir;
}

function writeConfig(dir: string, content: string): string {
  const configPath = join(dir, 'claude.json');
  writeFileSync(configPath, content, 'utf-8');
  return configPath;
}

function expectedId(path: string): string {
  return createHash('sha256').update(path).digest('hex');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('runProjectDiscoverClaudeCode', () => {
  it('returns empty array when config file does not exist', async () => {
    const result = await runProjectDiscoverClaudeCode({
      configPath: '/non/existent/path/claude.json',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discovered).toHaveLength(0);
    }
  });

  it('returns empty array for malformed JSON', async () => {
    const dir = makeTempDir();
    const configPath = writeConfig(dir, 'not valid json {{{');
    const result = await runProjectDiscoverClaudeCode({ configPath });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discovered).toHaveLength(0);
    }
  });

  it('returns empty array when no projects key', async () => {
    const dir = makeTempDir();
    const configPath = writeConfig(dir, JSON.stringify({ version: '1.0' }));
    const result = await runProjectDiscoverClaudeCode({ configPath });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discovered).toHaveLength(0);
    }
  });

  it('returns empty array when projects is not an object', async () => {
    const dir = makeTempDir();
    const configPath = writeConfig(dir, JSON.stringify({ projects: 'not-object' }));
    const result = await runProjectDiscoverClaudeCode({ configPath });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discovered).toHaveLength(0);
    }
  });

  it('discovers projects from valid config', async () => {
    const projectDir = makeTempDir();
    const configDir = makeTempDir();

    const config = {
      projects: {
        [projectDir]: {
          lastSessionId: 'session-123',
          hasTrustDialogAccepted: true,
        },
      },
    };
    const configPath = writeConfig(configDir, JSON.stringify(config));

    const result = await runProjectDiscoverClaudeCode({ configPath });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discovered).toHaveLength(1);
      const p = result.data.discovered[0];
      expect(p.path).toBe(projectDir);
      expect(p.source).toBe('claude-code');
      expect(p.has_nori).toBe(false);
      expect(p.claude_code?.last_session_id).toBe('session-123');
      expect(p.claude_code?.has_trust_dialog_accepted).toBe(true);
    }
  });

  it('filters out non-existent paths', async () => {
    const existingDir = makeTempDir();
    const configDir = makeTempDir();

    const config = {
      projects: {
        [existingDir]: {},
        '/does/not/exist/at/all': {},
      },
    };
    const configPath = writeConfig(configDir, JSON.stringify(config));

    const result = await runProjectDiscoverClaudeCode({ configPath });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discovered).toHaveLength(1);
      expect(result.data.discovered[0].path).toBe(existingDir);
    }
  });

  it('detects .nori/ directory presence', async () => {
    const projectDir = makeTempDir();
    mkdirSync(join(projectDir, '.nori'));
    const configDir = makeTempDir();

    const config = { projects: { [projectDir]: {} } };
    const configPath = writeConfig(configDir, JSON.stringify(config));

    const result = await runProjectDiscoverClaudeCode({ configPath });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discovered[0].has_nori).toBe(true);
    }
  });

  it('detects .git/ directory presence', async () => {
    const projectDir = makeTempDir();
    mkdirSync(join(projectDir, '.git'));
    const configDir = makeTempDir();

    const config = { projects: { [projectDir]: {} } };
    const configPath = writeConfig(configDir, JSON.stringify(config));

    const result = await runProjectDiscoverClaudeCode({ configPath });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discovered[0].is_git).toBe(true);
    }
  });

  it('generates deterministic IDs from path', async () => {
    const projectDir = makeTempDir();
    const configDir = makeTempDir();

    const config = { projects: { [projectDir]: {} } };
    const configPath = writeConfig(configDir, JSON.stringify(config));

    const result1 = await runProjectDiscoverClaudeCode({ configPath });
    const result2 = await runProjectDiscoverClaudeCode({ configPath });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (result1.success && result2.success) {
      expect(result1.data.discovered[0].id).toBe(result2.data.discovered[0].id);
      expect(result1.data.discovered[0].id).toBe(expectedId(projectDir));
    }
  });

  it('uses folder basename as project name', async () => {
    const projectDir = makeTempDir();
    const configDir = makeTempDir();

    const config = { projects: { [projectDir]: {} } };
    const configPath = writeConfig(configDir, JSON.stringify(config));

    const result = await runProjectDiscoverClaudeCode({ configPath });
    expect(result.success).toBe(true);
    if (result.success) {
      const { basename } = await import('node:path');
      expect(result.data.discovered[0].name).toBe(basename(projectDir));
    }
  });
});
