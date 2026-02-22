import type { Database } from 'sql.js';
import type { StepResult, FlowError, SessionArchiveResponse } from '@nori/shared';

export function archiveSession(
  db: Database,
  sessionId: string
): StepResult<SessionArchiveResponse> | FlowError {
  try {
    db.run(
      `UPDATE sessions SET status = 'archived', updated_at = datetime('now') WHERE id = ?`,
      [sessionId]
    );

    return {
      success: true,
      data: { id: sessionId, status: 'archived' },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'SESSION_ARCHIVE_FAILED',
        message: `Failed to archive session: ${message}`,
        step: '02-archive',
        severity: 'fatal',
        recoverable: false,
        details: { session_id: sessionId, error: message },
      },
    };
  }
}
