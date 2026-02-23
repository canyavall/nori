import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import type { VaultUnlinkProjectResponse } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { validateVaultExists } from '../vault-link-project/actions/validate-vault-exists.js';
import { validateLinkExists } from './actions/validate-link-exists.js';
import { deleteLink } from './actions/delete-link.js';

export interface VaultUnlinkProjectInput {
  vault_id: string;
  link_id: string;
  db: Database;
}

export async function runVaultUnlinkProject(
  input: VaultUnlinkProjectInput,
  emitter?: FlowEmitter
): Promise<FlowResult<VaultUnlinkProjectResponse>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('vault:unlink-project:started', { vault_id: input.vault_id, link_id: input.link_id });

  // Step 01: Validate vault exists
  emit.emit('vault:unlink-project:validating-vault', { vault_id: input.vault_id });
  const vaultResult = validateVaultExists(input.db, input.vault_id);
  if (!vaultResult.success) return vaultResult;

  // Step 02: Validate link exists and belongs to this vault
  emit.emit('vault:unlink-project:validating-link', { link_id: input.link_id });
  const linkResult = validateLinkExists(input.db, input.vault_id, input.link_id);
  if (!linkResult.success) return linkResult;

  const { project_path } = linkResult.data;

  // Step 03: Delete the link
  emit.emit('vault:unlink-project:deleting-link', { link_id: input.link_id });
  const deleteResult = deleteLink(input.db, input.vault_id, input.link_id, project_path);
  if (!deleteResult.success) return deleteResult;

  emit.emit('vault:unlink-project:completed', {
    vault_id: input.vault_id,
    link_id: input.link_id,
    project_path,
  });

  return {
    success: true,
    data: {
      link_id: input.link_id,
      vault_id: input.vault_id,
      project_path,
    },
  };
}
