import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { validateFolders } from './actions/validate-folders.js';
import { validateFiles } from './actions/validate-files.js';
import { selfHeal, type SelfHealResult } from './actions/self-heal.js';

export interface IntegrityCheckResult {
  folders_valid: string[];
  folders_missing: string[];
  files_valid: string[];
  files_missing: string[];
  self_heal: SelfHealResult;
}

export async function runAppIntegrityCheck(
  emitter?: FlowEmitter
): Promise<FlowResult<IntegrityCheckResult>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('app:integrity-check:started', {});

  // Step 01: Validate folders
  emit.emit('app:integrity-check:validating-folders', {});
  const foldersResult = validateFolders();
  if (!foldersResult.success) return foldersResult;

  // Step 02: Validate files
  emit.emit('app:integrity-check:validating-files', {});
  const filesResult = validateFiles();
  if (!filesResult.success) return filesResult;

  // Step 03: Self-heal
  const needsHeal = foldersResult.data.missing.length > 0 || filesResult.data.missing.length > 0;
  let healResult: SelfHealResult = { issues_fixed: [], issues_remaining: [] };

  if (needsHeal) {
    emit.emit('app:integrity-check:self-healing', {
      missing_dirs: foldersResult.data.missing.length,
      missing_files: filesResult.data.missing.length,
    });
    const healStepResult = selfHeal(foldersResult.data.missing, filesResult.data.missing);
    if (!healStepResult.success) return healStepResult;
    healResult = healStepResult.data;
  }

  emit.emit('app:integrity-check:completed', {
    folders_ok: foldersResult.data.valid.length,
    files_ok: filesResult.data.valid.length,
    issues_fixed: healResult.issues_fixed.length,
    issues_remaining: healResult.issues_remaining.length,
  });

  return {
    success: true,
    data: {
      folders_valid: foldersResult.data.valid,
      folders_missing: foldersResult.data.missing,
      files_valid: filesResult.data.valid,
      files_missing: filesResult.data.missing,
      self_heal: healResult,
    },
  };
}
