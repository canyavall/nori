import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FlowResult } from '@nori/shared';

export function readSkill(
  projectPath: string,
  name: string,
): FlowResult<{ name: string; content: string; path: string }> {
  const skillPath = join(projectPath, '.claude', 'skills', name, 'SKILL.md');
  const relativePath = `.claude/skills/${name}/SKILL.md`;

  let content: string;
  try {
    content = readFileSync(skillPath, 'utf-8');
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      return {
        success: false,
        error: {
          code: 'SKILL_NOT_FOUND',
          message: `Skill "${name}" not found`,
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

  return { success: true, data: { name, content, path: relativePath } };
}
