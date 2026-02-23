import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runReadClaudeHooks, runWriteClaudeHooks } from './project-claude-hooks.js';

let tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'nori-hooks-test-'));
  tempDirs.push(dir);
  return dir;
}

describe('runReadClaudeHooks', () => {
  it('returns empty when no settings files exist', async () => {
    const dir = makeTempDir();
    const result = await runReadClaudeHooks({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.shared).toBeNull();
      expect(result.data.local).toBeNull();
      expect(result.data.sharedRaw).toBe('');
      expect(result.data.localRaw).toBe('');
    }
  });

  it('reads shared hooks from settings.json', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    const settings = {
      hooks: {
        PreToolUse: [{ type: 'command', command: 'echo test' }],
      },
    };
    writeFileSync(join(dir, '.claude', 'settings.json'), JSON.stringify(settings), 'utf-8');

    const result = await runReadClaudeHooks({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.shared).not.toBeNull();
      expect(result.data.shared?.PreToolUse).toBeDefined();
      expect(result.data.local).toBeNull();
    }
  });

  it('reads local hooks from settings.local.json', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    const settings = {
      hooks: {
        PostToolUse: [{ type: 'command', command: 'echo local' }],
      },
    };
    writeFileSync(join(dir, '.claude', 'settings.local.json'), JSON.stringify(settings), 'utf-8');

    const result = await runReadClaudeHooks({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.shared).toBeNull();
      expect(result.data.local).not.toBeNull();
    }
  });

  it('returns error for malformed JSON', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'settings.json'), '{invalid json', 'utf-8');

    const result = await runReadClaudeHooks({ projectPath: dir });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_JSON');
    }
  });

  it('returns null hooks when settings has no hooks key', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'settings.json'), JSON.stringify({ permissions: {} }), 'utf-8');

    const result = await runReadClaudeHooks({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.shared).toBeNull();
    }
  });
});

describe('runWriteClaudeHooks', () => {
  it('writes hooks to shared settings', async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'settings.json'), JSON.stringify({ permissions: {} }), 'utf-8');

    const hooks = { PreToolUse: [{ type: 'command', command: 'echo test' }] };
    const result = await runWriteClaudeHooks({
      projectPath: dir,
      target: 'shared',
      hooksJson: JSON.stringify(hooks),
    });

    expect(result.success).toBe(true);

    // Verify file was written correctly
    const raw = readFileSync(join(dir, '.claude', 'settings.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.permissions).toEqual({});
    expect(parsed.hooks).toEqual(hooks);
  });

  it('writes hooks to local settings', async () => {
    const dir = makeTempDir();

    const hooks = { PostToolUse: [{ type: 'command', command: 'echo local' }] };
    const result = await runWriteClaudeHooks({
      projectPath: dir,
      target: 'local',
      hooksJson: JSON.stringify(hooks),
    });

    expect(result.success).toBe(true);

    const raw = readFileSync(join(dir, '.claude', 'settings.local.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.hooks).toEqual(hooks);
  });

  it('rejects invalid JSON', async () => {
    const dir = makeTempDir();
    const result = await runWriteClaudeHooks({
      projectPath: dir,
      target: 'shared',
      hooksJson: 'not valid json',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_JSON');
    }
  });
});
