#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TRACKER_DIR = join(__dirname, '../tracker');

const filesToCleanup = [
  join(TRACKER_DIR, 'metrics.jsonl'),
  join(TRACKER_DIR, 'tracker.jsonl'),
];

const main = () => {
  try {
    for (const file of filesToCleanup) {
      try {
        writeFileSync(file, '', 'utf-8');
      } catch (error) {
        // Silent fail - file might not exist yet
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Session cleanup failed:', error.message);
    process.exit(1);
  }
};

main();
