#!/usr/bin/env node

/**
 * Usage Tracker
 *
 * Tracks execution metrics for knowledge system scripts.
 * Logs to scripts-usage.jsonl for performance monitoring and debugging.
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USAGE_LOG = join(__dirname, '../../tracker/scripts-usage.jsonl');

/**
 * Ensure tracker directory exists
 */
const ensureTrackerDir = () => {
  const dir = dirname(USAGE_LOG);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

/**
 * Log script execution
 *
 * @param {Object} params
 * @param {string} params.script - Script name (e.g., 'knowledge-search')
 * @param {string} params.callerId - Agent/session ID or 'unknown'
 * @param {Object} params.args - Key arguments (tags, packages, flags)
 * @param {number} params.executionTimeMs - Execution duration in milliseconds
 * @param {Object} params.result - Execution result summary
 */
export const logScriptUsage = ({ script, callerId, args, executionTimeMs, result }) => {
  try {
    ensureTrackerDir();

    const entry = {
      timestamp: new Date().toISOString(),
      script,
      caller_id: callerId || 'unknown',
      args: args || {},
      execution_time_ms: executionTimeMs,
      result: result || { status: 'unknown' }
    };

    appendFileSync(USAGE_LOG, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (error) {
    // Silent fail - tracking should never break execution
  }
};

/**
 * Wrapper for tracking script execution
 *
 * @param {string} scriptName - Script name
 * @param {Object} args - Parsed arguments
 * @param {Function} fn - Function to execute
 * @returns {Promise<any>} - Function result
 */
export const trackExecution = async (scriptName, args, fn) => {
  const startTime = Date.now();
  let result = { status: 'unknown' };

  try {
    const output = await fn();
    const executionTime = Date.now() - startTime;

    // Extract result summary
    if (typeof output === 'object' && output !== null) {
      result = {
        status: output.status || 'success',
        count: output.count || output.loaded || output.results?.length || 0,
        ...(output.token_estimate && { token_estimate: output.token_estimate })
      };
    } else {
      result = { status: 'success' };
    }

    logScriptUsage({
      script: scriptName,
      callerId: args.agentId || args.agent_id,
      args: extractKeyArgs(scriptName, args),
      executionTimeMs: executionTime,
      result
    });

    return output;
  } catch (error) {
    const executionTime = Date.now() - startTime;

    result = {
      status: 'error',
      error: error.message
    };

    logScriptUsage({
      script: scriptName,
      callerId: args.agentId || args.agent_id,
      args: extractKeyArgs(scriptName, args),
      executionTimeMs: executionTime,
      result
    });

    throw error;
  }
};

/**
 * Extract key arguments for logging (privacy-safe)
 */
const extractKeyArgs = (scriptName, args) => {
  const keyArgs = {};

  // Common args
  if (args.tags) keyArgs.tags = args.tags;
  if (args.packages) keyArgs.packages = args.packages;
  if (args.category) keyArgs.category = args.category;
  if (args.maxResults !== undefined) keyArgs.max_results = args.maxResults;
  if (args.limit !== undefined) keyArgs.limit = args.limit;

  // Script-specific args
  if (scriptName === 'knowledge-search') {
    if (args.filePath) keyArgs.has_file_path = true; // Boolean, not actual path
  }

  if (scriptName === 'knowledge-load') {
    // packages already captured above
  }

  return keyArgs;
};
