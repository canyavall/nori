import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ClaudeMcpServer, FlowResult } from '@nori/shared';

export function readMcps(
  projectPath: string,
): FlowResult<{ servers: ClaudeMcpServer[]; raw: string }> {
  const mcpPath = join(projectPath, '.mcp.json');

  let raw: string;
  try {
    raw = readFileSync(mcpPath, 'utf-8');
  } catch {
    return { success: true, data: { servers: [], raw: '' } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in .mcp.json',
        severity: 'warning',
        recoverable: true,
      },
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { success: true, data: { servers: [], raw } };
  }

  const obj = parsed as Record<string, unknown>;
  const mcpServers = obj.mcpServers;
  if (!mcpServers || typeof mcpServers !== 'object') {
    return { success: true, data: { servers: [], raw } };
  }

  const servers: ClaudeMcpServer[] = Object.entries(
    mcpServers as Record<string, unknown>,
  ).map(([name, config]) => {
    const cfg = typeof config === 'object' && config !== null
      ? (config as Record<string, unknown>)
      : {};

    let type: 'http' | 'stdio' | 'sse' = 'stdio';
    if (typeof cfg.url === 'string') {
      type = cfg.type === 'sse' ? 'sse' : 'http';
    }
    if (typeof cfg.command === 'string') {
      type = 'stdio';
    }

    return {
      name,
      type,
      url: typeof cfg.url === 'string' ? cfg.url : undefined,
      command: typeof cfg.command === 'string' ? cfg.command : undefined,
      args: Array.isArray(cfg.args) ? cfg.args : undefined,
      env: typeof cfg.env === 'object' && cfg.env !== null
        ? (cfg.env as Record<string, string>)
        : undefined,
    };
  });

  return { success: true, data: { servers, raw } };
}
