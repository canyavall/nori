import { add, remove } from 'isomorphic-git';
import * as fs from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export interface StageResult {
  staged_files: string[];
  staged_count: number;
}

export async function stageChanges(
  dir: string,
  changedFiles: string[]
): Promise<StepResult<StageResult> | FlowError> {
  try {
    for (const filepath of changedFiles) {
      // Check if file exists on disk to determine add vs remove
      const fullPath = `${dir}/${filepath}`;
      if (fs.existsSync(fullPath)) {
        await add({ fs, dir, filepath });
      } else {
        await remove({ fs, dir, filepath });
      }
    }

    return {
      success: true,
      data: {
        staged_files: changedFiles,
        staged_count: changedFiles.length,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'STAGING_FAILED',
        message: `Failed to stage files: ${message}`,
        step: '03-stage-changes',
        severity: 'fatal',
        recoverable: false,
        details: { dir, error: message, files: changedFiles },
      },
    };
  }
}
