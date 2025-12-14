#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { trackSessionEvent, createSessionId } from './tracking-lib.mjs';
import { logHookError } from './hook-error-logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TRACKER_DIR = join(__dirname, '../tracker');

const filesToCleanup = [
  join(TRACKER_DIR, 'knowledge-tracking.jsonl'), // Unified tracking per prompt
  join(TRACKER_DIR, 'knowledge-session-state.jsonl'), // Session state for first/subsequent prompt
  join(TRACKER_DIR, 'knowledge-hook-metrics.jsonl'), // Hook execution and token savings per session
];

const main = () => {
  try {
    // Generate new session ID
    const sessionId = createSessionId();

    // Track session start BEFORE cleaning up
    trackSessionEvent({
      sessionId,
      eventType: 'session_start',
      reason: 'New Claude Code session initialized',
    });

    for (const file of filesToCleanup) {
      try {
        writeFileSync(file, '', 'utf-8');
      } catch (error) {
        // Silent fail - file might not exist yet
      }
    }

    // Track successful cleanup
    trackSessionEvent({
      sessionId,
      eventType: 'session_reset',
      reason: 'Knowledge state and tracking files cleared',
    });

    process.exit(0);
  } catch (error) {
    logHookError('session-start-cleanup', error, { filesAttempted: filesToCleanup.length });
    console.error('Session cleanup failed:', error.message);
    process.exit(1);
  }
};

main();
