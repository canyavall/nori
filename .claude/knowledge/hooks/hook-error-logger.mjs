#!/usr/bin/env node

/**
 * Hook Error Logger
 *
 * Centralized error logging for all hooks to .claude/knowledge/tracker/hook-errors.jsonl
 *
 * Usage:
 *   import { logHookError } from './hook-error-logger.mjs';
 *
 *   try {
 *     // hook logic
 *   } catch (error) {
 *     logHookError('hook-name', error, { context: 'additional info' });
 *     console.error('Hook error:', error.message);
 *   }
 */

import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ERROR_LOG_PATH = join(__dirname, '../tracker/hook-errors.jsonl');

/**
 * Ensure tracker directory exists
 */
const ensureTrackerDir = () => {
  const trackerDir = dirname(ERROR_LOG_PATH);
  if (!existsSync(trackerDir)) {
    mkdirSync(trackerDir, { recursive: true });
  }
};

/**
 * Log hook error to JSONL file
 *
 * @param {string} hookName - Name of the hook (e.g., 'knowledge-prompt', 'honest-critical')
 * @param {Error} error - The error object
 * @param {object} additionalContext - Optional additional context
 */
export const logHookError = (hookName, error, additionalContext = {}) => {
  try {
    ensureTrackerDir();

    const errorEntry = {
      timestamp: new Date().toISOString(),
      hookName,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context: additionalContext,
    };

    appendFileSync(ERROR_LOG_PATH, JSON.stringify(errorEntry) + '\n', 'utf-8');
  } catch (loggingError) {
    // Silently fail if we can't log - don't cascade errors
    console.error('Failed to log hook error:', loggingError.message);
  }
};
