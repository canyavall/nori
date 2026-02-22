import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import type { VaultRegistrationResponse } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { getVaultDir } from '../../shared/utils/path-resolver.js';
import { validateUrl } from './actions/validate-url.js';
import { testGitAccess } from './actions/test-git-access.js';
import { cloneRepo } from './actions/clone-repo.js';
import { writeConfig } from './actions/write-config.js';
import { buildIndex } from './actions/build-index.js';

export interface VaultRegistrationInput {
  vault_name: string;
  git_url: string;
  branch: string;
  db: Database;
}

export async function runVaultRegistration(
  input: VaultRegistrationInput,
  emitter?: FlowEmitter
): Promise<FlowResult<VaultRegistrationResponse>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('vault:registration:started', { vault_name: input.vault_name });

  // Step 01: Validate URL
  emit.emit('vault:registration:validating-url', { url: input.git_url });
  const urlResult = validateUrl(input.git_url);
  if (!urlResult.success) return urlResult;

  // Step 02: Test git access
  emit.emit('vault:registration:testing-access', { url: input.git_url });
  const accessResult = await testGitAccess(input.git_url);
  if (!accessResult.success) return accessResult;

  // Step 03: Clone repo
  emit.emit('vault:registration:cloning', { url: input.git_url });
  const localPath = getVaultDir(input.vault_name);
  const cloneResult = await cloneRepo(input.git_url, localPath, input.branch);
  if (!cloneResult.success) return cloneResult;

  // Step 04: Write config
  emit.emit('vault:registration:writing-config', { vault_name: input.vault_name });
  const configResult = await writeConfig(
    input.db,
    input.vault_name,
    input.git_url,
    input.branch,
    localPath
  );
  if (!configResult.success) return configResult;

  const vault = configResult.data;

  // Step 05: Build index (non-fatal)
  emit.emit('vault:registration:building-index', { vault_name: input.vault_name });
  const indexResult = await buildIndex(vault.id, localPath, input.db, emit);
  const knowledgeCount = indexResult.success ? indexResult.data.entry_count : 0;

  emit.emit('vault:registration:completed', {
    vault_id: vault.id,
    vault_name: vault.name,
    knowledge_count: knowledgeCount,
  });

  return {
    success: true,
    data: {
      vault,
      knowledge_count: knowledgeCount,
    },
  };
}
