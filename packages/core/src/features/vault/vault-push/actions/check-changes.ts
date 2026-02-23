import { statusMatrix } from 'isomorphic-git';
import * as fs from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export interface ChangesResult {
  has_changes: boolean;
  changed_files: string[];
  change_count: number;
}

export async function checkChanges(dir: string): Promise<StepResult<ChangesResult> | FlowError> {
  try {
    const matrix = await statusMatrix({ fs, dir });

    // statusMatrix returns rows of [filepath, head, workdir, stage]
    // HEAD=1, WORKDIR=1, STAGE=1 means unchanged
    const changedFiles: string[] = [];
    for (const row of matrix) {
      const [filepath, head, workdir, stage] = row as [string, number, number, number];
      if (head !== 1 || workdir !== 1 || stage !== 1) {
        changedFiles.push(filepath);
      }
    }

    if (changedFiles.length === 0) {
      return {
        success: true,
        data: {
          has_changes: false,
          changed_files: [],
          change_count: 0,
        },
      };
    }

    return {
      success: true,
      data: {
        has_changes: true,
        changed_files: changedFiles,
        change_count: changedFiles.length,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'GIT_STATUS_FAILED',
        message: `Failed to check local changes: ${message}`,
        step: '02-check-changes',
        severity: 'fatal',
        recoverable: false,
        details: { dir, error: message },
      },
    };
  }
}
