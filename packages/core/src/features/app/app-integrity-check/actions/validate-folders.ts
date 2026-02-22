import { existsSync } from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';
import { getNoriDataDir, getVaultsDir } from '../../../shared/utils/path-resolver.js';

export interface FolderValidationResult {
  valid: string[];
  missing: string[];
}

export function validateFolders(): StepResult<FolderValidationResult> | FlowError {
  const requiredDirs = [getNoriDataDir(), getVaultsDir()];
  const valid: string[] = [];
  const missing: string[] = [];

  for (const dir of requiredDirs) {
    if (existsSync(dir)) {
      valid.push(dir);
    } else {
      missing.push(dir);
    }
  }

  return { success: true, data: { valid, missing } };
}
