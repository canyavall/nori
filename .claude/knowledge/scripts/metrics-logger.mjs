#!/usr/bin/env node
import { appendFileSync, existsSync, mkdirSync, statSync, renameSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

const METRICS_DIR = '.claude/knowledge/metrics';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure metrics directory exists
const ensureMetricsDir = () => {
  if (!existsSync(METRICS_DIR)) {
    mkdirSync(METRICS_DIR, { recursive: true });
  }
  const archiveDir = join(METRICS_DIR, 'archive');
  if (!existsSync(archiveDir)) {
    mkdirSync(archiveDir, { recursive: true });
  }
};

// Hash session ID for privacy
const hashSessionId = (sessionId) => {
  if (!sessionId) return 'unknown';
  return createHash('sha256').update(sessionId).digest('hex').slice(0, 16);
};

// Sanitize file path (remove absolute prefix, keep relative to vault)
const sanitizePath = (filePath) => {
  if (!filePath) return null;
  const match = filePath.match(/vault\/(.+)/);
  return match ? `vault/${match[1]}` : filePath;
};

// Rotate log file if needed
const rotateIfNeeded = (logFile) => {
  if (!existsSync(logFile)) return;

  const stats = statSync(logFile);
  if (stats.size >= MAX_FILE_SIZE) {
    const timestamp = new Date().toISOString().split('T')[0];
    const rotated = logFile.replace('.jsonl', `-${timestamp}.jsonl`);
    renameSync(logFile, rotated);
    console.log(`[metrics] Rotated ${logFile} -> ${rotated}`);
  }
};

// Log role command invocation
export const logRoleCommand = ({
  command,
  role,
  packagesRequested,
  packagesLoaded,
  packagesSkipped,
  sessionId,
  durationMs,
  status,
  error
}) => {
  try {
    ensureMetricsDir();
    const logFile = join(METRICS_DIR, 'role-commands.jsonl');
    rotateIfNeeded(logFile);

    const entry = {
      timestamp: new Date().toISOString(),
      command,
      role,
      packages_requested: packagesRequested,
      packages_loaded: packagesLoaded,
      packages_skipped: packagesSkipped,
      session_id: hashSessionId(sessionId),
      duration_ms: durationMs,
      status,
      ...(error && { error: String(error) })
    };

    appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (err) {
    // Silent fail - metrics should never break functionality
    console.error('[metrics] Failed to log role command:', err.message);
  }
};

// Log knowledge search request
export const logKnowledgeSearch = ({
  tags,
  categories,
  prompt,
  resultsCount,
  topResult,
  sessionId,
  agentId,
  durationMs,
  status,
  error
}) => {
  try {
    ensureMetricsDir();
    const logFile = join(METRICS_DIR, 'knowledge-searches.jsonl');
    rotateIfNeeded(logFile);

    const entry = {
      timestamp: new Date().toISOString(),
      tags: tags || [],
      categories: categories || null,
      prompt: prompt ? prompt.slice(0, 200) : null, // Truncate long prompts
      results_count: resultsCount,
      top_result: topResult,
      session_id: hashSessionId(sessionId),
      agent_id: agentId,
      duration_ms: durationMs,
      status,
      ...(error && { error: String(error) })
    };

    appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (err) {
    console.error('[metrics] Failed to log knowledge search:', err.message);
  }
};

// Log package read event
export const logPackageRead = ({
  packageName,
  loadedBy,
  sessionId,
  fileSizeBytes,
  alreadyLoaded
}) => {
  try {
    ensureMetricsDir();
    const logFile = join(METRICS_DIR, 'package-reads.jsonl');
    rotateIfNeeded(logFile);

    const entry = {
      timestamp: new Date().toISOString(),
      package: packageName,
      loaded_by: loadedBy,
      session_id: hashSessionId(sessionId),
      file_size_bytes: fileSizeBytes,
      already_loaded: alreadyLoaded
    };

    appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (err) {
    console.error('[metrics] Failed to log package read:', err.message);
  }
};

// Log error
export const logError = ({
  operation,
  error,
  context
}) => {
  try {
    ensureMetricsDir();
    const logFile = join(METRICS_DIR, 'errors.jsonl');
    rotateIfNeeded(logFile);

    const entry = {
      timestamp: new Date().toISOString(),
      operation,
      error: String(error),
      error_stack: error.stack ? error.stack.split('\n').slice(0, 5).join('\n') : null,
      context: context || {}
    };

    appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (err) {
    console.error('[metrics] Failed to log error:', err.message);
  }
};

// CLI mode - allows manual logging for testing
const main = () => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'test-role-command') {
    logRoleCommand({
      command: 'fe_knowledge_load',
      role: 'fe',
      packagesRequested: 18,
      packagesLoaded: 12,
      packagesSkipped: 6,
      sessionId: 'test-session-123',
      durationMs: 450,
      status: 'success'
    });
    console.log('✓ Logged test role command');
  } else if (command === 'test-search') {
    logKnowledgeSearch({
      tags: ['testing', 'react'],
      prompt: 'how to test async components',
      resultsCount: 5,
      topResult: 'testing-async-debugging',
      sessionId: 'test-session-123',
      agentId: 'test-agent-456',
      durationMs: 25,
      status: 'success'
    });
    console.log('✓ Logged test search');
  } else if (command === 'test-package-read') {
    logPackageRead({
      packageName: 'testing-core',
      loadedBy: 'fe_knowledge_load',
      sessionId: 'test-session-123',
      fileSizeBytes: 12500,
      alreadyLoaded: false
    });
    console.log('✓ Logged test package read');
  } else if (command === 'test-error') {
    logError({
      operation: 'knowledge-search',
      error: new Error('Test error'),
      context: { tags: ['testing'] }
    });
    console.log('✓ Logged test error');
  } else {
    console.log('Usage: metrics-logger.mjs <test-role-command|test-search|test-package-read|test-error>');
  }
};

// Only run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
