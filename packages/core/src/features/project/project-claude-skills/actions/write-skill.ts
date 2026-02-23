import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { ClaudeSkill, FlowResult } from '@nori/shared';

export function writeSkill(
  projectPath: string,
  name: string,
  content: string,
): FlowResult<{ skill: ClaudeSkill }> {
  const skillDir = join(projectPath, '.claude', 'skills', name);
  const skillPath = join(skillDir, 'SKILL.md');

  if (!existsSync(skillDir)) {
    return {
      success: false,
      error: {
        code: 'SKILL_NOT_FOUND',
        message: `Skill directory "${name}" does not exist`,
        severity: 'error',
        recoverable: true,
      },
    };
  }

  try {
    writeFileSync(skillPath, content, 'utf-8');
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EACCES') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: `Cannot write to ${skillPath}`,
          severity: 'error',
          recoverable: true,
        },
      };
    }
    return {
      success: false,
      error: {
        code: 'FILE_WRITE_FAILED',
        message: `Failed to write ${skillPath}`,
        severity: 'error',
        recoverable: true,
      },
    };
  }

  // Re-parse to return fresh metadata
  const raw = readFileSync(skillPath, 'utf-8');
  try {
    const { data: fm, content: body } = matter(raw);
    return {
      success: true,
      data: {
        skill: {
          name,
          description: typeof fm.description === 'string' ? fm.description : '',
          globs: Array.isArray(fm.globs) ? fm.globs : undefined,
          alwaysApply: fm.alwaysApply === true,
          path: `.claude/skills/${name}/SKILL.md`,
          content: body.trim(),
        },
      },
    };
  } catch {
    return {
      success: true,
      data: {
        skill: {
          name,
          description: '',
          alwaysApply: false,
          path: `.claude/skills/${name}/SKILL.md`,
          parseError: true,
        },
      },
    };
  }
}
