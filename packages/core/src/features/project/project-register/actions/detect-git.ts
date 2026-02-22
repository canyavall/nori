import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { StepResult } from '@nori/shared';

export function detectGit(projectPath: string): StepResult<{ is_git: boolean }> {
  const is_git = existsSync(join(projectPath, '.git'));
  return { success: true, data: { is_git } };
}
