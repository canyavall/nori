import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { checkCurrentVersion } from './actions/check-current-version.js';
import { fetchLatestVersion } from './actions/fetch-latest-version.js';
import { compareVersions } from './actions/compare-versions.js';
import { applyUpdate, type ApplyUpdateResult } from './actions/apply-update.js';

export interface AutoUpdateResult {
  current_version: string;
  latest_version: string;
  update_needed: boolean;
  update_result?: ApplyUpdateResult;
}

export async function runAppAutoupdate(
  emitter?: FlowEmitter
): Promise<FlowResult<AutoUpdateResult>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('app:autoupdate:started', {});

  // Step 01: Check current version
  emit.emit('app:autoupdate:checking-current-version', {});
  const currentResult = checkCurrentVersion();
  if (!currentResult.success) return currentResult;

  // Step 02: Fetch latest version
  emit.emit('app:autoupdate:fetching-latest-version', {});
  const latestResult = await fetchLatestVersion();
  if (!latestResult.success) {
    // Network/server errors are non-fatal — skip update check
    emit.emit('app:autoupdate:skipped', {
      reason: latestResult.error.message,
    });
    return {
      success: true,
      data: {
        current_version: currentResult.data.current_version,
        latest_version: 'unknown',
        update_needed: false,
      },
    };
  }

  // Step 03: Compare versions
  emit.emit('app:autoupdate:comparing-versions', {
    current_version: currentResult.data.current_version,
    latest_version: latestResult.data.latest_version,
  });
  const compareResult = compareVersions(
    currentResult.data.current_version,
    latestResult.data.latest_version
  );
  if (!compareResult.success) return compareResult;

  if (!compareResult.data.update_needed) {
    emit.emit('app:autoupdate:up-to-date', {
      current_version: currentResult.data.current_version,
    });
    return {
      success: true,
      data: {
        current_version: currentResult.data.current_version,
        latest_version: latestResult.data.latest_version,
        update_needed: false,
      },
    };
  }

  // Step 04: Apply update
  emit.emit('app:autoupdate:applying-update', {
    new_version: latestResult.data.latest_version,
  });
  const updateResult = await applyUpdate(
    latestResult.data.latest_version,
    latestResult.data.download_url
  );
  if (!updateResult.success) return updateResult;

  emit.emit('app:autoupdate:completed', {
    current_version: currentResult.data.current_version,
    new_version: latestResult.data.latest_version,
    applied: updateResult.data.applied,
  });

  return {
    success: true,
    data: {
      current_version: currentResult.data.current_version,
      latest_version: latestResult.data.latest_version,
      update_needed: true,
      update_result: updateResult.data,
    },
  };
}
