import { existsSync, statSync } from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export function validatePath(path: string): StepResult<{ path: string }> | FlowError {
  if (!existsSync(path)) {
    return { success: false, error: { code: 'PATH_NOT_FOUND', message: `Path does not exist: ${path}` } };
  }
  if (!statSync(path).isDirectory()) {
    return { success: false, error: { code: 'NOT_A_DIRECTORY', message: `Path is not a directory: ${path}` } };
  }
  return { success: true, data: { path } };
}
