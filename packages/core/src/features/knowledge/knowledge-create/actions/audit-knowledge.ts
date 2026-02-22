import type { StepResult, FlowError } from '@nori/shared';

export interface AuditResult {
  audit_passed: boolean;
  findings_count: number;
}

/**
 * Stub: delegates to knowledge-audit flow later.
 * For now, returns success unconditionally.
 */
export function auditKnowledge(_entryId: string, _filePath: string): StepResult<AuditResult> | FlowError {
  return {
    success: true,
    data: {
      audit_passed: true,
      findings_count: 0,
    },
  };
}
