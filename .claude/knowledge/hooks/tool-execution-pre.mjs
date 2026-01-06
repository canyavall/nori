#!/usr/bin/env node

/**
 * Tool Execution Pre Hook - Knowledge Read Tracking
 *
 * Intercepts Read operations BEFORE execution to automatically track
 * when knowledge files are being read.
 *
 * When a Read targets a knowledge file, extracts the package name and logs it.
 * This provides automatic proof that Claude loaded specific knowledge packages.
 *
 * Output: .claude/knowledge/tracker/knowledge-reads-auto.jsonl
 *
 * JSONL format per line:
 * {
 *   "timestamp": "2025-12-16T18:20:00.000Z",
 *   "package": "code-conventions",
 *   "file_path": ".claude/knowledge/vault/frontend/standards/code-conventions.md",
 *   "session_id": "session-123",
 *   "category": "frontend/standards"
 * }
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join, basename } from 'path';
import { logHookError } from './hook-error-logger.mjs';

/**
 * Read JSON from stdin
 */
const readStdin = () => {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
};

/**
 * Get tracking file path
 */
const getTrackingFilePath = () => {
  const projectRoot = process.cwd();
  return join(projectRoot, '.claude', 'knowledge', 'tracker', 'knowledge-reads-auto.jsonl');
};

/**
 * Check if file path is a knowledge file
 */
const isKnowledgeFile = (filePath) => {
  return filePath && filePath.includes('knowledge/vault/');
};

/**
 * Extract package name and category from knowledge file path
 * Example: .claude/knowledge/vault/frontend/standards/code-conventions.md
 * -> package: "code-conventions", category: "frontend/standards"
 */
const extractKnowledgeInfo = (filePath) => {
  const vaultIndex = filePath.indexOf('knowledge/vault/');
  if (vaultIndex === -1) return null;

  const afterVault = filePath.substring(vaultIndex + 'knowledge/vault/'.length);
  const parts = afterVault.split('/');

  if (parts.length < 2) return null;

  // Last part is filename (without extension)
  const filename = parts[parts.length - 1];
  const packageName = basename(filename, '.md');

  // Everything except filename is category
  const category = parts.slice(0, -1).join('/');

  return { packageName, category };
};

/**
 * Log knowledge read to tracker
 */
const logKnowledgeRead = (packageName, category, filePath, sessionId) => {
  const trackingFile = getTrackingFilePath();
  const trackingDir = dirname(trackingFile);

  try {
    // Ensure directory exists
    if (!existsSync(trackingDir)) {
      mkdirSync(trackingDir, { recursive: true });
    }

    const entry = {
      timestamp: new Date().toISOString(),
      package: packageName,
      file_path: filePath,
      session_id: sessionId,
      category: category
    };

    appendFileSync(trackingFile, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (error) {
    // Silent fail - tracking is not critical
  }
};

(async () => {
  let stdinData = '';
  let hookData = null;

  try {
    stdinData = await readStdin();
    hookData = JSON.parse(stdinData);

    const { tool_name, tool_input, session_id } = hookData;

    // Only track Read operations
    if (tool_name === 'Read' && tool_input?.file_path) {
      const filePath = tool_input.file_path;

      if (isKnowledgeFile(filePath)) {
        const knowledgeInfo = extractKnowledgeInfo(filePath);

        if (knowledgeInfo) {
          logKnowledgeRead(
            knowledgeInfo.packageName,
            knowledgeInfo.category,
            filePath,
            session_id || 'unknown'
          );
        }
      }
    }

    // Pass through - don't block anything
    process.exit(0);
  } catch (error) {
    logHookError('tool-execution-pre', error, {
      stdinLength: stdinData.length,
      tool_name: hookData?.tool_name,
      file_path: hookData?.tool_input?.file_path
    });
    // On error, pass through silently
    process.exit(0);
  }
})();
