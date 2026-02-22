import { mkdirSync } from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export interface SelfHealResult {
  issues_fixed: string[];
  issues_remaining: string[];
}

export function selfHeal(
  missingDirs: string[],
  missingFiles: string[]
): StepResult<SelfHealResult> | FlowError {
  const issuesFixed: string[] = [];
  const issuesRemaining: string[] = [];

  // Attempt to create missing directories
  for (const dir of missingDirs) {
    try {
      mkdirSync(dir, { recursive: true });
      issuesFixed.push(`Created directory: ${dir}`);
    } catch {
      issuesRemaining.push(`Failed to create directory: ${dir}`);
    }
  }

  // Missing files are noted but not auto-created (DB is created on first use)
  for (const file of missingFiles) {
    issuesRemaining.push(`Missing file: ${file}`);
  }

  return { success: true, data: { issues_fixed: issuesFixed, issues_remaining: issuesRemaining } };
}
