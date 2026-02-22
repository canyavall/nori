import { existsSync } from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';
import { getNoriDbPath } from '../../../shared/utils/path-resolver.js';

export interface FileValidationResult {
  valid: string[];
  missing: string[];
}

export function validateFiles(): StepResult<FileValidationResult> | FlowError {
  const requiredFiles = [getNoriDbPath()];
  const valid: string[] = [];
  const missing: string[] = [];

  for (const file of requiredFiles) {
    if (existsSync(file)) {
      valid.push(file);
    } else {
      missing.push(file);
    }
  }

  return { success: true, data: { valid, missing } };
}
