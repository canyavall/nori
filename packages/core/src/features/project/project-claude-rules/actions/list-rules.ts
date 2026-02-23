import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';
import type { ClaudeRule, ClaudeRuleType, FlowResult } from '@nori/shared';

function scanRulesDir(dir: string, projectPath: string): ClaudeRule[] {
  const rules: ClaudeRule[] = [];

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return rules;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath, { throwIfNoEntry: false });
    if (!stat) continue;

    if (stat.isDirectory()) {
      rules.push(...scanRulesDir(fullPath, projectPath));
    } else if (entry.endsWith('.md')) {
      const relativePath = relative(projectPath, fullPath);
      rules.push(parseRuleFile(fullPath, relativePath, 'modular'));
    }
  }

  return rules;
}

function parseRuleFile(
  fullPath: string,
  relativePath: string,
  type: ClaudeRuleType,
): ClaudeRule {
  const name = relativePath.split('/').pop()?.replace(/\.md$/, '') ?? relativePath;

  let raw: string;
  try {
    raw = readFileSync(fullPath, 'utf-8');
  } catch {
    return { name, relativePath, type, parseError: true };
  }

  try {
    const { data: fm } = matter(raw);
    const globs = Array.isArray(fm.paths) ? fm.paths : undefined;
    return { name, relativePath, type, globs };
  } catch {
    return { name, relativePath, type, parseError: true };
  }
}

export function listRules(
  projectPath: string,
): FlowResult<{ rules: ClaudeRule[] }> {
  const rules: ClaudeRule[] = [];

  // Root CLAUDE.md
  const rootClaude = join(projectPath, 'CLAUDE.md');
  if (existsSync(rootClaude)) {
    rules.push(parseRuleFile(rootClaude, 'CLAUDE.md', 'root'));
  }

  // .claude/CLAUDE.md
  const projectClaude = join(projectPath, '.claude', 'CLAUDE.md');
  if (existsSync(projectClaude)) {
    rules.push(parseRuleFile(projectClaude, '.claude/CLAUDE.md', 'project'));
  }

  // .claude/rules/**/*.md
  const rulesDir = join(projectPath, '.claude', 'rules');
  if (existsSync(rulesDir)) {
    try {
      rules.push(...scanRulesDir(rulesDir, projectPath));
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'EACCES') {
        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: `Cannot read ${rulesDir}`,
            severity: 'error',
            recoverable: true,
          },
        };
      }
    }
  }

  return { success: true, data: { rules } };
}
