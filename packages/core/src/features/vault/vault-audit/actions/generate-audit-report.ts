import type { StepResult } from '@nori/shared';
import type { FrontmatterValidationResult } from './validate-frontmatter.js';
import type { ContentValidationResult } from './validate-content.js';
import type { ConsistencyResult } from './check-db-consistency.js';

export interface VaultAuditReport {
  vault_id: string;
  total_entries: number;
  frontmatter_valid: number;
  frontmatter_invalid: number;
  content_valid: number;
  content_empty: number;
  orphaned_db_entries: number;
  orphaned_files: number;
  invalid_frontmatter_files: string[];
  empty_content_files: string[];
  orphaned_db_paths: string[];
  orphaned_file_paths: string[];
  status: 'pass' | 'warn' | 'fail';
  generated_at: string;
}

export function generateAuditReport(
  vaultId: string,
  totalEntries: number,
  frontmatter: FrontmatterValidationResult,
  content: ContentValidationResult,
  consistency: ConsistencyResult
): StepResult<VaultAuditReport> {
  const hasInvalid = frontmatter.invalid.length > 0;
  const hasEmpty = content.empty.length > 0;
  const hasOrphans = consistency.orphaned_db.length > 0 || consistency.orphaned_files.length > 0;

  let status: 'pass' | 'warn' | 'fail' = 'pass';
  if (hasInvalid || hasOrphans) {
    status = 'fail';
  } else if (hasEmpty) {
    status = 'warn';
  }

  const report: VaultAuditReport = {
    vault_id: vaultId,
    total_entries: totalEntries,
    frontmatter_valid: frontmatter.valid.length,
    frontmatter_invalid: frontmatter.invalid.length,
    content_valid: content.valid.length,
    content_empty: content.empty.length,
    orphaned_db_entries: consistency.orphaned_db.length,
    orphaned_files: consistency.orphaned_files.length,
    invalid_frontmatter_files: frontmatter.invalid,
    empty_content_files: content.empty,
    orphaned_db_paths: consistency.orphaned_db,
    orphaned_file_paths: consistency.orphaned_files,
    status,
    generated_at: new Date().toISOString(),
  };

  return { success: true, data: report };
}
