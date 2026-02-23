import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runReadClaudeMcps, runWriteClaudeMcps } from './project-claude-mcps.js';

let tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'nori-mcps-test-'));
  tempDirs.push(dir);
  return dir;
}

describe('runReadClaudeMcps', () => {
  it('returns empty when .mcp.json does not exist', async () => {
    const dir = makeTempDir();
    const result = await runReadClaudeMcps({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.servers).toHaveLength(0);
      expect(result.data.raw).toBe('');
    }
  });

  it('parses MCP servers from .mcp.json', async () => {
    const dir = makeTempDir();
    const mcpConfig = {
      mcpServers: {
        'my-server': {
          command: 'npx',
          args: ['-y', 'my-mcp-server'],
          env: { API_KEY: 'test' },
        },
        'http-server': {
          url: 'https://example.com/mcp',
        },
      },
    };
    writeFileSync(join(dir, '.mcp.json'), JSON.stringify(mcpConfig), 'utf-8');

    const result = await runReadClaudeMcps({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.servers).toHaveLength(2);
      const stdio = result.data.servers.find((s: { name: string }) => s.name === 'my-server');
      expect(stdio?.type).toBe('stdio');
      expect(stdio?.command).toBe('npx');
      expect(stdio?.args).toEqual(['-y', 'my-mcp-server']);
      expect(stdio?.env).toEqual({ API_KEY: 'test' });

      const http = result.data.servers.find((s: { name: string }) => s.name === 'http-server');
      expect(http?.type).toBe('http');
      expect(http?.url).toBe('https://example.com/mcp');
    }
  });

  it('returns error for malformed JSON', async () => {
    const dir = makeTempDir();
    writeFileSync(join(dir, '.mcp.json'), '{not valid}', 'utf-8');

    const result = await runReadClaudeMcps({ projectPath: dir });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_JSON');
    }
  });

  it('returns empty when no mcpServers key', async () => {
    const dir = makeTempDir();
    writeFileSync(join(dir, '.mcp.json'), JSON.stringify({ version: 1 }), 'utf-8');

    const result = await runReadClaudeMcps({ projectPath: dir });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.servers).toHaveLength(0);
    }
  });
});

describe('runWriteClaudeMcps', () => {
  it('writes MCP config to .mcp.json', async () => {
    const dir = makeTempDir();
    const content = JSON.stringify({
      mcpServers: {
        'new-server': { command: 'node', args: ['server.js'] },
      },
    });

    const result = await runWriteClaudeMcps({ projectPath: dir, content });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.servers).toHaveLength(1);
      expect(result.data.servers[0].name).toBe('new-server');
    }

    const raw = readFileSync(join(dir, '.mcp.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.mcpServers['new-server'].command).toBe('node');
  });

  it('preserves other keys in .mcp.json', async () => {
    const dir = makeTempDir();
    writeFileSync(
      join(dir, '.mcp.json'),
      JSON.stringify({ version: 1, mcpServers: { old: { command: 'old' } } }),
      'utf-8',
    );

    const content = JSON.stringify({
      mcpServers: { new: { command: 'new' } },
    });

    await runWriteClaudeMcps({ projectPath: dir, content });

    const raw = readFileSync(join(dir, '.mcp.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe(1);
    expect(parsed.mcpServers.new.command).toBe('new');
  });

  it('rejects invalid JSON', async () => {
    const dir = makeTempDir();
    const result = await runWriteClaudeMcps({ projectPath: dir, content: 'not json' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_JSON');
    }
  });
});
