import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import * as fs from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export interface PushResult {
  pushed: boolean;
  push_time_ms: number;
}

export async function push(
  dir: string,
  url: string,
  ref: string
): Promise<StepResult<PushResult> | FlowError> {
  const start = Date.now();

  try {
    await (git as any).push({
      fs,
      http,
      dir,
      url,
      remote: 'origin',
      ref,
    });

    return {
      success: true,
      data: {
        pushed: true,
        push_time_ms: Date.now() - start,
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
          step: '05-push',
          severity: 'error',
          recoverable: true,
          details: { dir, url, error: message, push_time_ms: Date.now() - start },
        },
      };
    }

    if (message.includes('non-fast-forward') || message.includes('rejected')) {
      return {
        success: false,
        error: {
          code: 'PUSH_REJECTED',
          message: `Remote rejected push. Pull first to resolve divergence: ${message}`,
          step: '05-push',
          severity: 'error',
          recoverable: true,
          details: { dir, url, error: message, push_time_ms: Date.now() - start },
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'PUSH_FAILED',
        message: `Failed to push to remote: ${message}`,
        step: '05-push',
        severity: 'error',
        recoverable: true,
        details: { dir, url, error: message, push_time_ms: Date.now() - start },
      },
    };
  }
}
