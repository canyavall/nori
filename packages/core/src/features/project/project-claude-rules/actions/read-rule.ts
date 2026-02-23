import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ClaudeRuleType, FlowResult } from '@nori/shared';

function classifyRulePath(relativePath: string): ClaudeRuleType {
  if (relativePath === 'CLAUDE.md') return 'root';
  if (relativePath === '.claude/CLAUDE.md') return 'project';
  return 'modular';
}

export function readRule(
  projectPath: string,
  relativePath: string,
): FlowResult<{ relativePath: string; content: string; type: ClaudeRuleType }> {
  // Path traversal guard
  const resolved = resolve(projectPath, relativePath);
  if (!resolved.startsWith(resolve(projectPath))) {
    return {
      success: false,
      error: {
        code: 'INVALID_PATH',
        message: 'Path traversal detected',
        severity: 'error',
        recoverable: false,
      },
    };
  }

  let content: string;
  try {
    content = readFileSync(resolved, 'utf-8');
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        success: false,
        error: {
          code: 'RULE_NOT_FOUND',
          message: `Rule file not found: ${relativePath}`,
          severity: 'error',
          recoverable: true,
        },
      };
    }
    return {
      success: false,
      error: {
        code: 'FILE_READ_FAILED',
        message: `Failed to read ${relativePath}`,
        severity: 'error',
        recoverable: true,
      },
    };
  }

  return {
    success: true,
    data: { relativePath, content, type: classifyRulePath(relativePath) },
  };
}
