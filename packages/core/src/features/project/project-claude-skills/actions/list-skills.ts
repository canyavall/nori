import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { ClaudeSkill, FlowResult } from '@nori/shared';

export function listSkills(
  projectPath: string,
): FlowResult<{ skills: ClaudeSkill[] }> {
  const skillsDir = join(projectPath, '.claude', 'skills');

  let entries: string[];
  try {
    entries = readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { success: true, data: { skills: [] } };
    }
    if ((err as NodeJS.ErrnoException).code === 'EACCES') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: `Cannot read ${skillsDir}`,
          severity: 'error',
          recoverable: true,
        },
      };
    }
    return { success: true, data: { skills: [] } };
  }

  const skills: ClaudeSkill[] = [];

  for (const name of entries) {
    const skillPath = join(skillsDir, name, 'SKILL.md');
    let raw: string;
    try {
      raw = readFileSync(skillPath, 'utf-8');
    } catch {
      continue; // No SKILL.md in this directory
    }

    try {
      const { data: fm, content } = matter(raw);
      skills.push({
        name,
        description: typeof fm.description === 'string' ? fm.description : '',
        globs: Array.isArray(fm.globs) ? fm.globs : undefined,
        alwaysApply: fm.alwaysApply === true,
        path: `.claude/skills/${name}/SKILL.md`,
        content: content.trim(),
      });
    } catch {
      skills.push({
        name,
        description: '',
        alwaysApply: false,
        path: `.claude/skills/${name}/SKILL.md`,
        parseError: true,
      });
    }
  }

  return { success: true, data: { skills } };
}
