import type { Database } from 'sql.js';
import type { StepResult, FlowError, Session } from '@nori/shared';
import { queryOne } from '../../../shared/utils/database.js';

export function checkActive(
  db: Database,
  sessionId: string
): StepResult<Session> | FlowError {
  try {
    const row = queryOne(db, `SELECT * FROM sessions WHERE id = ?`, [sessionId]);

    if (!row) {
      return {
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Session not found: ${sessionId}`,
          step: '01-check-active',
          severity: 'error',
          recoverable: true,
          details: { session_id: sessionId },
        },
      };
    }

    const session = row as unknown as Session;

    if (session.status === 'archived') {
      return {
        success: false,
        error: {
          code: 'SESSION_ALREADY_ARCHIVED',
          message: `Session is already archived: ${sessionId}`,
          step: '01-check-active',
          severity: 'error',
          recoverable: true,
          details: { session_id: sessionId, status: session.status },
        },
      };
    }

    return { success: true, data: session };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'SESSION_LOOKUP_FAILED',
        message: `Failed to look up session: ${message}`,
        step: '01-check-active',
        severity: 'fatal',
        recoverable: false,
        details: { session_id: sessionId, error: message },
      },
    };
  }
}
