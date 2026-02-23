import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ClaudeHookConfig, FlowResult } from '@nori/shared';

interface HooksData {
  shared: ClaudeHookConfig | null;
  local: ClaudeHookConfig | null;
  sharedRaw: string;
  localRaw: string;
}

function readSettingsHooks(
  filePath: string,
): { hooks: ClaudeHookConfig | null; raw: string; error?: string } {
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    return { hooks: null, raw: '' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { hooks: null, raw, error: `Invalid JSON in ${filePath}` };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { hooks: null, raw };
  }

  const obj = parsed as Record<string, unknown>;
  const hooks = obj.hooks;
  if (!hooks || typeof hooks !== 'object') {
    return { hooks: null, raw };
  }

  return { hooks: hooks as ClaudeHookConfig, raw };
}

export function readHooks(
  projectPath: string,
): FlowResult<HooksData> {
  const sharedPath = join(projectPath, '.claude', 'settings.json');
  const localPath = join(projectPath, '.claude', 'settings.local.json');

  const sharedResult = readSettingsHooks(sharedPath);
  const localResult = readSettingsHooks(localPath);

  if (sharedResult.error) {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: sharedResult.error,
        severity: 'warning',
        recoverable: true,
      },
    };
  }

  if (localResult.error) {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: localResult.error,
        severity: 'warning',
        recoverable: true,
      },
    };
  }

  return {
    success: true,
    data: {
      shared: sharedResult.hooks,
      local: localResult.hooks,
      sharedRaw: sharedResult.raw,
      localRaw: localResult.raw,
    },
  };
}
