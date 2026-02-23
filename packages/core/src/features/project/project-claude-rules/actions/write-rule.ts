import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import type { ClaudeRule, ClaudeRuleType, FlowResult } from '@nori/shared';

function classifyRulePath(relativePath: string): ClaudeRuleType {
  if (relativePath === 'CLAUDE.md') return 'root';
  if (relativePath === '.claude/CLAUDE.md') return 'project';
  return 'modular';
}

export function writeRule(
  projectPath: string,
  relativePath: string,
  content: string,
): FlowResult<{ rule: ClaudeRule }> {
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

  try {
    writeFileSync(resolved, content, 'utf-8');
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EACCES') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: `Cannot write to ${relativePath}`,
          severity: 'error',
          recoverable: true,
        },
      };
    }
    return {
      success: false,
      error: {
        code: 'FILE_WRITE_FAILED',
        message: `Failed to write ${relativePath}`,
        severity: 'error',
        recoverable: true,
      },
    };
  }

  const type = classifyRulePath(relativePath);
  const name = relativePath.split('/').pop()?.replace(/\.md$/, '') ?? relativePath;

  try {
    const { data: fm } = matter(content);
    const globs = Array.isArray(fm.paths) ? fm.paths : undefined;
    return { success: true, data: { rule: { name, relativePath, type, globs } } };
  } catch {
    return { success: true, data: { rule: { name, relativePath, type, parseError: true } } };
  }
}
