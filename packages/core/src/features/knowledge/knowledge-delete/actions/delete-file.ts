import { unlinkSync } from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export interface DeleteFileResult {
  deleted_file_path: string;
}

export function deleteFile(filePath: string): StepResult<DeleteFileResult> | FlowError {
  try {
    unlinkSync(filePath);

    return {
      success: true,
      data: {
        deleted_file_path: filePath,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('EACCES') || message.includes('EPERM')) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: `Permission denied deleting ${filePath}`,
          step: '03-delete-file',
          severity: 'fatal',
          recoverable: false,
          details: { file_path: filePath, error_code: 'EACCES' },
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: `Failed to delete knowledge file: ${message}`,
        step: '03-delete-file',
        severity: 'fatal',
        recoverable: false,
        details: { file_path: filePath, error: message },
      },
    };
  }
}
