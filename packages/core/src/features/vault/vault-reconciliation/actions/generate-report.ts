import type { StepResult } from '@nori/shared';
import type { ThreeWayComparison } from './compare-three-way.js';

export interface ReconciliationReport {
  vault_id: string;
  added_count: number;
  modified_count: number;
  deleted_count: number;
  conflict_count: number;
  added: string[];
  modified: string[];
  deleted: string[];
  conflicts: string[];
  has_changes: boolean;
  has_conflicts: boolean;
  generated_at: string;
}

export function generateReport(
  vaultId: string,
  comparison: ThreeWayComparison
): StepResult<ReconciliationReport> {
  const report: ReconciliationReport = {
    vault_id: vaultId,
    added_count: comparison.added.length,
    modified_count: comparison.modified.length,
    deleted_count: comparison.deleted.length,
    conflict_count: comparison.conflicts.length,
    added: comparison.added,
    modified: comparison.modified,
    deleted: comparison.deleted,
    conflicts: comparison.conflicts,
    has_changes:
      comparison.added.length > 0 ||
      comparison.modified.length > 0 ||
      comparison.deleted.length > 0,
    has_conflicts: comparison.conflicts.length > 0,
    generated_at: new Date().toISOString(),
  };

  return { success: true, data: report };
}
