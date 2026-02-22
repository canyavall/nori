import { existsSync, statSync } from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export interface EntryExistsResult {
  file_path: string;
  file_size: number;
}

export function validateEntryExists(filePath: string): StepResult<EntryExistsResult> | FlowError {
  if (!existsSync(filePath)) {
    return {
      success: false,
      error: {
        code: 'ENTRY_NOT_FOUND',
        message: `Knowledge entry not found: ${filePath}`,
        step: '01-validate-entry-exists',
        severity: 'error',
        recoverable: false,
        details: { expected_path: filePath },
      },
    };
  }

  try {
    const stats = statSync(filePath);

    return {
      success: true,
      data: {
        file_path: filePath,
        file_size: stats.size,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    return {
      success: false,
      error: {
        code: 'STAT_FAILED',
        message: `Failed to read file info: ${message}`,
        step: '01-validate-entry-exists',
        severity: 'error',
        recoverable: false,
        details: { file_path: filePath, error: message },
      },
    };
  }
}
