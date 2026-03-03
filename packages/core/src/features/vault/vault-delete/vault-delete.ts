import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult, VaultDeleteResponse } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { validateVaultExists } from '../vault-link-project/actions/validate-vault-exists.js';
import { deleteKnowledgeEntries } from './actions/delete-knowledge-entries.js';
import { deleteVaultLinks } from './actions/delete-vault-links.js';
import { deleteVaultRecord } from './actions/delete-vault-record.js';
import { deleteLocalFiles } from './actions/delete-local-files.js';

export interface VaultDeleteInput {
  vault_id: string;
  db: Database;
}

export async function runVaultDelete(
  input: VaultDeleteInput,
  emitter?: FlowEmitter
): Promise<FlowResult<VaultDeleteResponse>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('vault:delete:started', { vault_id: input.vault_id });

  // Step 01: Validate vault exists
  emit.emit('vault:delete:validating-vault', { vault_id: input.vault_id });
  const vaultResult = validateVaultExists(input.db, input.vault_id);
  if (!vaultResult.success) return vaultResult;

  // Step 02: Delete knowledge entries
  emit.emit('vault:delete:deleting-knowledge-entries', { vault_id: input.vault_id });
  const knowledgeResult = deleteKnowledgeEntries(input.db, input.vault_id);
  if (!knowledgeResult.success) return knowledgeResult;

  // Step 03: Delete vault links
  emit.emit('vault:delete:deleting-vault-links', { vault_id: input.vault_id });
  const linksResult = deleteVaultLinks(input.db, input.vault_id);
  if (!linksResult.success) return linksResult;

  // Step 04: Delete vault record (reads vault data first)
  emit.emit('vault:delete:deleting-vault-record', { vault_id: input.vault_id });
  const recordResult = deleteVaultRecord(input.db, input.vault_id);
  if (!recordResult.success) return recordResult;

  const { name, vault_type, local_path } = recordResult.data;

  // Step 05: Delete local files (only for local vaults)
  if (vault_type === 'local') {
    emit.emit('vault:delete:deleting-local-files', { local_path });
  }
  const filesResult = await deleteLocalFiles(vault_type, local_path);
  if (!filesResult.success) return filesResult;

  const { deleted_files } = filesResult.data;

  emit.emit('vault:delete:completed', {
    vault_id: input.vault_id,
    vault_name: name,
    deleted_files,
  });

  return {
    success: true,
    data: {
      vault_id: input.vault_id,
      vault_name: name,
      vault_type,
      deleted_files,
    },
  };
}
