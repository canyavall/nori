import { mkdirSync } from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export function createDirectory(localPath: string): StepResult<{ local_path: string }> | FlowError {
  try {
    mkdirSync(localPath, { recursive: true });
    return { success: true, data: { local_path: localPath } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'DIR_CREATE_FAILED',
        message: `Failed to create vault directory at ${localPath}: ${message}`,
        step: '02-create-directory',
        severity: 'fatal',
        recoverable: false,
        details: { local_path: localPath, error: message },
      },
    };
  }
}
