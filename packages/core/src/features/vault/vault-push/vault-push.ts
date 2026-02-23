import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { validateConfig } from './actions/validate-config.js';
import { checkChanges } from './actions/check-changes.js';
import { stageChanges } from './actions/stage-changes.js';
import { commit } from './actions/commit.js';
import { push } from './actions/push.js';

export interface VaultPushInput {
  vault_id: string;
  db: Database;
  commit_message?: string;
}

export interface VaultPushResponse {
  commit_hash: string;
  files_pushed: number;
}

export async function runVaultPush(
  input: VaultPushInput,
  emitter?: FlowEmitter
): Promise<FlowResult<VaultPushResponse>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('vault:push:started', { vault_id: input.vault_id });

  // Step 01: Validate config
  emit.emit('vault:push:validating-config', { vault_id: input.vault_id });
  const configResult = validateConfig(input.db, input.vault_id);
  if (!configResult.success) return configResult;

  const vault = configResult.data;

  if (!vault.git_url || !vault.branch) {
    return {
      success: false,
      error: {
        code: 'NOT_GIT_VAULT',
        message: 'Push is only supported for git-backed vaults',
        step: '01-validate-config',
        severity: 'error',
        recoverable: false,
      },
    };
  }

  // Step 02: Check changes
  emit.emit('vault:push:checking-changes', { vault_id: input.vault_id });
  const changesResult = await checkChanges(vault.local_path);
  if (!changesResult.success) return changesResult;

  if (!changesResult.data.has_changes) {
    emit.emit('vault:push:no-changes', { vault_id: input.vault_id, vault_name: vault.name });
    return {
      success: true,
      data: {
        commit_hash: '',
        files_pushed: 0,
      },
    };
  }

  emit.emit('vault:push:changes-detected', {
    vault_id: input.vault_id,
    changed_files: changesResult.data.changed_files,
    change_count: changesResult.data.change_count,
  });

  // Step 03: Stage changes
  emit.emit('vault:push:staging', { vault_id: input.vault_id });
  const stageResult = await stageChanges(vault.local_path, changesResult.data.changed_files);
  if (!stageResult.success) return stageResult;

  // Step 04: Commit
  emit.emit('vault:push:committing', { vault_id: input.vault_id });
  const commitResult = await commit(
    vault.local_path,
    stageResult.data.staged_count,
    input.commit_message
  );
  if (!commitResult.success) return commitResult;

  emit.emit('vault:push:committed', {
    vault_id: input.vault_id,
    commit_hash: commitResult.data.commit_hash,
    commit_message: commitResult.data.commit_message,
  });

  // Step 05: Push
  emit.emit('vault:push:pushing', { vault_id: input.vault_id, url: vault.git_url });
  const pushResult = await push(vault.local_path, vault.git_url, vault.branch);
  if (!pushResult.success) return pushResult;

  emit.emit('vault:push:completed', {
    vault_id: input.vault_id,
    vault_name: vault.name,
    commit_hash: commitResult.data.commit_hash,
    files_pushed: stageResult.data.staged_count,
  });

  return {
    success: true,
    data: {
      commit_hash: commitResult.data.commit_hash,
      files_pushed: stageResult.data.staged_count,
    },
  };
}
