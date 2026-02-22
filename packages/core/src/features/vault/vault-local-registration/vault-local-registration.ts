import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import type { VaultRegistrationResponse } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { getVaultDir } from '../../shared/utils/path-resolver.js';
import { validateName } from './actions/validate-name.js';
import { createDirectory } from './actions/create-directory.js';
import { writeConfig } from './actions/write-config.js';
import { buildIndex } from './actions/build-index.js';

export interface VaultLocalRegistrationInput {
  vault_name: string;
  db: Database;
  /** Override the vaults directory (used in tests to avoid writing to ~/.nori) */
  vaults_dir?: string;
}

export async function runVaultLocalRegistration(
  input: VaultLocalRegistrationInput,
  emitter?: FlowEmitter
): Promise<FlowResult<VaultRegistrationResponse>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('vault:local-registration:started', { vault_name: input.vault_name });

  // Step 01: Validate name
  const nameResult = validateName(input.vault_name);
  if (!nameResult.success) return nameResult;

  // Step 02: Create directory
  const localPath = input.vaults_dir
    ? `${input.vaults_dir}/${input.vault_name}`
    : getVaultDir(input.vault_name);

  emit.emit('vault:local-registration:creating-directory', { vault_name: input.vault_name });
  const dirResult = createDirectory(localPath);
  if (!dirResult.success) return dirResult;

  // Step 03: Write config
  emit.emit('vault:local-registration:writing-config', { vault_name: input.vault_name });
  const configResult = await writeConfig(input.db, input.vault_name, localPath);
  if (!configResult.success) return configResult;

  const vault = configResult.data;

  // Step 04: Build index (non-fatal)
  emit.emit('vault:local-registration:building-index', { vault_name: input.vault_name });
  const indexResult = await buildIndex(vault.id, localPath, input.db, emit);
  const knowledgeCount = indexResult.success ? indexResult.data.entry_count : 0;

  emit.emit('vault:local-registration:completed', {
    vault_id: vault.id,
    vault_name: vault.name,
    local_path: localPath,
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
