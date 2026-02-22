import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult, SessionCreateResponse } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { checkActiveSession } from './actions/check-active-session.js';
import { createState } from './actions/create-state.js';

export interface SessionCreateInput {
  vault_id: string;
  title: string;
  db: Database;
}

export async function runSessionCreate(
  input: SessionCreateInput,
  emitter?: FlowEmitter
): Promise<FlowResult<SessionCreateResponse>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('session:create:started', { vault_id: input.vault_id });

  // Step 01: Check for active session and archive if exists
  emit.emit('session:create:checking-active', { vault_id: input.vault_id });
  const activeResult = checkActiveSession(input.db);
  if (!activeResult.success) return activeResult;

  if (activeResult.data.had_active && activeResult.data.previous_session) {
    emit.emit('session:create:archiving-previous', {
      previous_session_id: activeResult.data.previous_session.id,
    });
  }

  // Step 02: Create new session
  const sessionId = crypto.randomUUID();
  emit.emit('session:create:creating-state', { session_id: sessionId });
  const createResult = createState(input.db, input.vault_id, input.title);
  if (!createResult.success) return createResult;

  emit.emit('session:create:completed', {
    session_id: createResult.data.id,
    title: createResult.data.title,
  });

  return createResult;
}
