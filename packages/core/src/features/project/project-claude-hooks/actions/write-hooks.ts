import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { ClaudeHookConfig, FlowResult } from '@nori/shared';

export function writeHooks(
  projectPath: string,
  target: 'shared' | 'local',
  hooksJson: string,
): FlowResult<{ hooks: ClaudeHookConfig }> {
  // Validate incoming JSON
  let newHooks: ClaudeHookConfig;
  try {
    newHooks = JSON.parse(hooksJson);
  } catch {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in hooks content',
        severity: 'error',
        recoverable: true,
      },
    };
  }

  const fileName = target === 'local' ? 'settings.local.json' : 'settings.json';
  const filePath = join(projectPath, '.claude', fileName);

  // Read-modify-write
  let existing: Record<string, unknown> = {};
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      existing = parsed as Record<string, unknown>;
    }
  } catch {
    // File doesn't exist or is invalid — start fresh
  }

  existing.hooks = newHooks;

  try {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
  } catch {
    return {
      success: false,
      error: {
        code: 'FILE_WRITE_FAILED',
        message: `Failed to write ${filePath}`,
        severity: 'error',
        recoverable: true,
      },
    };
  }

  return { success: true, data: { hooks: newHooks } };
}
