#!/usr/bin/env node

import { execSync } from 'child_process';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { logHookError } from './hook-error-logger.mjs';

const TRACKER_DIR = '.claude/knowledge/tracker';
const TRACKING_FILES = [
  'knowledge-reads-auto.jsonl',  // Auto-tracked package reads, cleared each session
];

const main = () => {
  try {
    // Sync auto-tracked reads to session state before cleanup
    try {
      execSync('node .claude/knowledge/scripts/sync-session-state.mjs', {
        stdio: 'pipe',
        cwd: process.cwd()
      });
    } catch (error) {
      // Non-critical - continue even if sync fails
      console.warn('Warning: Failed to sync session state:', error.message);
    }

    // Clean up tracking files from previous session
    for (const file of TRACKING_FILES) {
      const filePath = join(TRACKER_DIR, file);
      if (existsSync(filePath)) {
        try {
          unlinkSync(filePath);
        } catch (error) {
          // Silent fail - file might be locked or missing
        }
      }
    }

    // Note: session-state.json persists across sessions
    // Only tracking files are cleared

    // Build knowledge.json from frontmatter
    console.log('Building knowledge index...');
    try {
      execSync('node .claude/knowledge/scripts/build-knowledge-index.mjs', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
    } catch (error) {
      console.error('❌ Failed to build knowledge index:', error.message);
      console.error('Run manually: node .claude/knowledge/scripts/build-knowledge-index.mjs');
      // Don't fail session start if build fails
    }

    process.exit(0);
  } catch (error) {
    logHookError('session-start-cleanup', error);
    console.error('Session cleanup failed:', error.message);
    process.exit(1);
  }
};

main();
