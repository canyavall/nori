import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ClaudeMcpServer, FlowResult } from '@nori/shared';

export function writeMcps(
  projectPath: string,
  content: string,
): FlowResult<{ servers: ClaudeMcpServer[] }> {
  // Validate incoming JSON
  let newContent: Record<string, unknown>;
  try {
    newContent = JSON.parse(content);
  } catch {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in MCP configuration',
        severity: 'error',
        recoverable: true,
      },
    };
  }

  const mcpPath = join(projectPath, '.mcp.json');

  // Read-modify-write to preserve other keys
  let existing: Record<string, unknown> = {};
  try {
    const raw = readFileSync(mcpPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      existing = parsed as Record<string, unknown>;
    }
  } catch {
    // File doesn't exist or is invalid — start fresh
  }

  // If the incoming content has mcpServers, update just that key
  // Otherwise treat the whole content as the new file
  if ('mcpServers' in newContent) {
    existing.mcpServers = newContent.mcpServers;
  } else {
    existing = newContent;
  }

  try {
    writeFileSync(mcpPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
  } catch {
    return {
      success: false,
      error: {
        code: 'FILE_WRITE_FAILED',
        message: `Failed to write .mcp.json`,
        severity: 'error',
        recoverable: true,
      },
    };
  }

  // Parse the servers for the response
  const mcpServers = existing.mcpServers;
  if (!mcpServers || typeof mcpServers !== 'object') {
    return { success: true, data: { servers: [] } };
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

  return { success: true, data: { servers } };
}
