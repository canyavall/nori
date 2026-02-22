import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult, SessionResumeResponse } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { validateSessionExists } from './actions/validate-session-exists.js';
import { restoreContext } from './actions/restore-context.js';

export interface SessionResumeInput {
  session_id: string;
  db: Database;
}

export async function runSessionResume(
  input: SessionResumeInput,
  emitter?: FlowEmitter
): Promise<FlowResult<SessionResumeResponse>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('session:resume:started', { session_id: input.session_id });

  // Step 01: Validate session exists
  emit.emit('session:resume:validating', { session_id: input.session_id });
  const sessionResult = validateSessionExists(input.db, input.session_id);
  if (!sessionResult.success) return sessionResult;

  // Step 02: Restore context (update status to active)
  emit.emit('session:resume:restoring', { session_id: input.session_id });
  const restoreResult = restoreContext(input.db, input.session_id, sessionResult.data.title);
  if (!restoreResult.success) return restoreResult;

  emit.emit('session:resume:completed', {
    session_id: restoreResult.data.id,
    title: restoreResult.data.title,
  });

  return restoreResult;
}
