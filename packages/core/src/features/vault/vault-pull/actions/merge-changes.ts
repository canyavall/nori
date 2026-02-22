import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import * as fs from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export interface MergeResult {
  merged: boolean;
  merge_type: 'fast-forward' | 'merge' | 'already-up-to-date';
  merge_time_ms: number;
}

export async function mergeChanges(
  dir: string,
  url: string,
  ref: string
): Promise<StepResult<MergeResult> | FlowError> {
  const start = Date.now();

  try {
    // Attempt fast-forward first (most common case for pull)
    await (git as any).fastForward({
      fs,
      http,
      dir,
      ref,
      singleBranch: true,
    });

    return {
      success: true,
      data: {
        merged: true,
        merge_type: 'fast-forward',
        merge_time_ms: Date.now() - start,
      },
    };
  } catch (fastForwardErr) {
    // Fast-forward failed, try full merge
    try {
      const localLog = await git.log({ fs, dir, depth: 1, ref });
      const ours = localLog[0]?.oid;
      const remoteRef = `origin/${ref}`;
      const remoteLog = await git.log({ fs, dir, depth: 1, ref: remoteRef });
      const theirs = remoteLog[0]?.oid;

      if (!ours || !theirs) {
        return {
          success: false,
          error: {
            code: 'MERGE_FAILED',
            message: 'Could not determine HEAD references for merge',
            step: '05-merge-changes',
            severity: 'error',
            recoverable: true,
            details: { dir, ref, ours, theirs },
          },
        };
      }

      if (ours === theirs) {
        return {
          success: true,
          data: {
            merged: true,
            merge_type: 'already-up-to-date',
            merge_time_ms: Date.now() - start,
          },
        };
      }

      await (git as any).merge({
        fs,
        dir,
        ours,
        theirs,
        author: { name: 'Nori', email: 'nori@local' },
      });

      return {
        success: true,
        data: {
          merged: true,
          merge_type: 'merge',
          merge_time_ms: Date.now() - start,
        },
      };
    } catch (mergeErr) {
      const message = mergeErr instanceof Error ? mergeErr.message : String(mergeErr);
      return {
        success: false,
        error: {
          code: 'MERGE_CONFLICT',
          message: `Merge failed with conflicts: ${message}`,
          step: '05-merge-changes',
          severity: 'warning',
          recoverable: true,
          details: { dir, ref, error: message, merge_time_ms: Date.now() - start },
        },
      };
    }
  }
}
