import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult, SessionArchiveResponse } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { checkActive } from './actions/check-active.js';
import { archiveSession } from './actions/archive-session.js';

export interface SessionArchiveInput {
  session_id: string;
  db: Database;
}

export async function runSessionArchive(
  input: SessionArchiveInput,
  emitter?: FlowEmitter
): Promise<FlowResult<SessionArchiveResponse>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('session:archive:started', { session_id: input.session_id });

  // Step 01: Check session exists and is active
  emit.emit('session:archive:checking-active', { session_id: input.session_id });
  const checkResult = checkActive(input.db, input.session_id);
  if (!checkResult.success) return checkResult;

  // Step 02: Archive session
  emit.emit('session:archive:archiving', { session_id: input.session_id });
  const archiveResult = archiveSession(input.db, input.session_id);
  if (!archiveResult.success) return archiveResult;

  emit.emit('session:archive:completed', { session_id: input.session_id });

  return archiveResult;
}
