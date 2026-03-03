import { rm } from 'node:fs/promises';
import type { StepResult, FlowError } from '@nori/shared';

export async function deleteLocalFiles(
  vaultType: 'git' | 'local',
  localPath: string
): Promise<StepResult<{ deleted_files: boolean }> | FlowError> {
  if (vaultType !== 'local') {
    return { success: true, data: { deleted_files: false } };
  }

  try {
    await rm(localPath, { recursive: true, force: true });
    return { success: true, data: { deleted_files: true } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'FS_DELETE_FAILED',
        message: `Failed to delete local vault files: ${message}`,
        step: '05-delete-local-files',
        severity: 'fatal',
        recoverable: false,
        details: { local_path: localPath, error: message },
      },
    };
  }
}
