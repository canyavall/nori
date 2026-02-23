import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import * as fs from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export interface FetchResult {
  fetched: true;
  fetch_time_ms: number;
}

export async function gitFetch(
  dir: string,
  url: string,
  ref: string
): Promise<StepResult<FetchResult> | FlowError> {
  const start = Date.now();

  try {
    await git.fetch({
      fs,
      http,
      dir,
      url,
      ref,
      singleBranch: true,
    });

    return {
      success: true,
      data: {
        fetched: true,
        fetch_time_ms: Date.now() - start,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('401') || message.includes('403') || message.includes('Authentication')) {
      return {
        success: false,
        error: {
          code: 'AUTH_EXPIRED',
          message: `Authentication expired for remote: ${url}`,
          step: '03-git-fetch',
          severity: 'error',
          recoverable: true,
          details: { dir, url, error: message, elapsed_time_ms: Date.now() - start },
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: `Failed to fetch from remote: ${message}`,
        step: '03-git-fetch',
        severity: 'error',
        recoverable: true,
        details: { dir, url, error: message, elapsed_time_ms: Date.now() - start },
      },
    };
  }
}
