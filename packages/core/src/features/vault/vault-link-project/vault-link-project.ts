import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import type { VaultLinkProjectResponse } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { validateVaultExists } from './actions/validate-vault-exists.js';
import { validateProjectPath } from './actions/validate-project-path.js';
import { writeLink } from './actions/write-link.js';

export interface VaultLinkProjectInput {
  vault_id: string;
  project_path: string;
  db: Database;
}

export async function runVaultLinkProject(
  input: VaultLinkProjectInput,
  emitter?: FlowEmitter
): Promise<FlowResult<VaultLinkProjectResponse>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('vault:link-project:started', { vault_id: input.vault_id, project_path: input.project_path });

  // Step 01: Validate vault exists
  emit.emit('vault:link-project:validating-vault', { vault_id: input.vault_id });
  const vaultResult = validateVaultExists(input.db, input.vault_id);
  if (!vaultResult.success) return vaultResult;

  // Step 02: Validate project path
  emit.emit('vault:link-project:validating-project', { project_path: input.project_path });
  const pathResult = validateProjectPath(input.project_path);
  if (!pathResult.success) return pathResult;

  // Step 03: Write link
  emit.emit('vault:link-project:writing-link', { vault_id: input.vault_id });
  const linkResult = writeLink(input.db, input.vault_id, input.project_path);
  if (!linkResult.success) return linkResult;

  emit.emit('vault:link-project:completed', {
    vault_id: input.vault_id,
    vault_name: vaultResult.data.name,
    project_path: input.project_path,
  });

  return {
    success: true,
    data: {
      link: linkResult.data,
      vault_name: vaultResult.data.name,
    },
  };
}
