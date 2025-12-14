#!/usr/bin/env node

/**
 * Shared tracking utilities for session management and knowledge tracking
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TRACKER_DIR = join(__dirname, '../tracker');
const SESSION_LOG = join(TRACKER_DIR, 'session-events.jsonl');

/**
 * Generate a unique session ID
 */
export const createSessionId = () => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Ensure tracking directory exists
 */
const ensureTrackingDir = () => {
  if (!existsSync(TRACKER_DIR)) {
    mkdirSync(TRACKER_DIR, { recursive: true });
  }
};

/**
 * Track session lifecycle events
 */
export const trackSessionEvent = ({ sessionId, eventType, reason, metadata = {} }) => {
  try {
    ensureTrackingDir();

    const entry = {
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      event_type: eventType,
      reason,
      ...metadata,
    };

    appendFileSync(SESSION_LOG, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (error) {
    // Silent fail - tracking should never break functionality
    console.error('[tracking] Failed to write session event:', error.message);
  }
};
