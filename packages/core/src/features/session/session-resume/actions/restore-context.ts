import type { Database } from 'sql.js';
import type { StepResult, FlowError, SessionResumeResponse } from '@nori/shared';

export function restoreContext(
  db: Database,
  sessionId: string,
  title: string
): StepResult<SessionResumeResponse> | FlowError {
  try {
    db.run(
      `UPDATE sessions SET status = 'active', updated_at = datetime('now') WHERE id = ?`,
      [sessionId]
    );

    return {
      success: true,
      data: { id: sessionId, title, status: 'active' },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'SESSION_RESTORE_FAILED',
        message: `Failed to restore session context: ${message}`,
        step: '02-restore-context',
        severity: 'fatal',
        recoverable: false,
        details: { session_id: sessionId, error: message },
      },
    };
  }
}
