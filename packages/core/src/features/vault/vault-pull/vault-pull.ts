import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { validateConfig } from './actions/validate-config.js';
import { checkLocalChanges } from './actions/check-local-changes.js';
import { gitFetch } from './actions/git-fetch.js';
import { detectConflicts } from './actions/detect-conflicts.js';
import { mergeChanges } from './actions/merge-changes.js';
import { updateIndex } from './actions/update-index.js';
import { logEvent } from './actions/log-event.js';

export interface VaultPullInput {
  vault_id: string;
  db: Database;
}

export interface VaultPullResponse {
  files_changed: number;
  has_conflicts: boolean;
}

export async function runVaultPull(
  input: VaultPullInput,
  emitter?: FlowEmitter
): Promise<FlowResult<VaultPullResponse>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('vault:pull:started', { vault_id: input.vault_id });

  // Step 01: Validate config
  emit.emit('vault:pull:validating-config', { vault_id: input.vault_id });
  const configResult = validateConfig(input.db, input.vault_id);
  if (!configResult.success) return configResult;

  const vault = configResult.data;

  // Step 02: Check local changes
  emit.emit('vault:pull:checking-local-changes', { vault_id: input.vault_id });
  const localChangesResult = await checkLocalChanges(vault.local_path);
  if (!localChangesResult.success) return localChangesResult;

  if (localChangesResult.data.has_changes) {
    emit.emit('vault:pull:local-changes-detected', {
      vault_id: input.vault_id,
      changed_files: localChangesResult.data.changed_files,
      change_count: localChangesResult.data.changed_files.length,
    });
  }

  // Step 03: Git fetch
  emit.emit('vault:pull:fetching', { vault_id: input.vault_id, url: vault.git_url });
  const fetchResult = await gitFetch(vault.local_path, vault.git_url, vault.branch);
  if (!fetchResult.success) return fetchResult;

  // Step 04: Detect conflicts
  emit.emit('vault:pull:detecting-conflicts', { vault_id: input.vault_id });
  const conflictResult = await detectConflicts(vault.local_path, vault.branch);
  if (!conflictResult.success) return conflictResult;

  const hasConflicts = conflictResult.data.has_conflicts;

  if (hasConflicts) {
    emit.emit('vault:pull:conflicts-detected', {
      vault_id: input.vault_id,
      conflict_count: conflictResult.data.conflict_count,
      local_head: conflictResult.data.local_head,
      remote_head: conflictResult.data.remote_head,
    });
  }

  // Step 05: Merge changes
  emit.emit('vault:pull:merging', { vault_id: input.vault_id });
  const mergeResult = await mergeChanges(vault.local_path, vault.git_url, vault.branch);
  // Merge failures are non-fatal (conflicts reported to user)
  const mergeSucceeded = mergeResult.success;
  const filesChanged = localChangesResult.data.changed_files.length;

  if (!mergeSucceeded) {
    emit.emit('vault:pull:merge-warning', {
      vault_id: input.vault_id,
      error: mergeResult.error.message,
    });
  }

  // Step 06: Update index (non-fatal)
  emit.emit('vault:pull:updating-index', { vault_id: input.vault_id });
  const indexResult = await updateIndex(input.vault_id, vault.local_path);
  if (!indexResult.success) {
    emit.emit('vault:pull:index-warning', {
      vault_id: input.vault_id,
      error: indexResult.error.message,
    });
  }

  // Step 07: Log event
  emit.emit('vault:pull:logging-event', { vault_id: input.vault_id });
  const logResult = logEvent(input.db, input.vault_id);
  if (!logResult.success) {
    emit.emit('vault:pull:log-warning', {
      vault_id: input.vault_id,
      error: logResult.error.message,
    });
  }

  emit.emit('vault:pull:completed', {
    vault_id: input.vault_id,
    vault_name: vault.name,
    files_changed: filesChanged,
    has_conflicts: hasConflicts && !mergeSucceeded,
  });

  return {
    success: true,
    data: {
      files_changed: filesChanged,
      has_conflicts: hasConflicts && !mergeSucceeded,
    },
  };
}
