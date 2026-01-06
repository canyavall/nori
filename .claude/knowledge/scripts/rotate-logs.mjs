#!/usr/bin/env node
import { readdirSync, renameSync, unlinkSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const METRICS_DIR = '.claude/knowledge/metrics';
const ARCHIVE_DIR = join(METRICS_DIR, 'archive');
const RETENTION_DAYS = 30;

// Rotate current logs
const rotateLogs = () => {
  if (!existsSync(METRICS_DIR)) {
    console.log('⚠️  Metrics directory not found');
    return;
  }

  const date = new Date().toISOString().split('T')[0];
  const logFiles = ['role-commands.jsonl', 'knowledge-searches.jsonl', 'package-reads.jsonl', 'errors.jsonl'];

  let rotated = 0;
  logFiles.forEach(file => {
    const current = join(METRICS_DIR, file);
    const rotatedPath = join(METRICS_DIR, file.replace('.jsonl', `-${date}.jsonl`));

    try {
      if (existsSync(current)) {
        const stats = statSync(current);
        if (stats.size > 0) {
          renameSync(current, rotatedPath);
          console.log(`✓ Rotated ${file}`);
          rotated++;
        }
      }
    } catch (err) {
      console.error(`✗ Failed to rotate ${file}:`, err.message);
    }
  });

  console.log(`\nRotated ${rotated} log files`);
};

// Archive old logs (>7 days)
const archiveOldLogs = () => {
  if (!existsSync(METRICS_DIR)) return;

  const files = readdirSync(METRICS_DIR);
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let archived = 0;
  files.forEach(file => {
    if (!file.match(/\d{4}-\d{2}-\d{2}\.jsonl$/)) return;

    const filePath = join(METRICS_DIR, file);
    try {
      const stat = statSync(filePath);

      if (stat.mtime < cutoff) {
        const archivedPath = join(ARCHIVE_DIR, file);
        renameSync(filePath, archivedPath);
        console.log(`✓ Archived ${file}`);
        archived++;
      }
    } catch (err) {
      console.error(`✗ Failed to archive ${file}:`, err.message);
    }
  });

  if (archived > 0) {
    console.log(`\nArchived ${archived} old log files`);
  }
};

// Delete very old logs (>30 days)
const deleteOldLogs = () => {
  if (!existsSync(ARCHIVE_DIR)) return;

  const files = readdirSync(ARCHIVE_DIR);
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  let deleted = 0;
  files.forEach(file => {
    const filePath = join(ARCHIVE_DIR, file);
    try {
      const stat = statSync(filePath);

      if (stat.mtime < cutoff) {
        unlinkSync(filePath);
        console.log(`✓ Deleted ${file} (>30 days old)`);
        deleted++;
      }
    } catch (err) {
      console.error(`✗ Failed to delete ${file}:`, err.message);
    }
  });

  if (deleted > 0) {
    console.log(`\nDeleted ${deleted} archived log files`);
  }
};

// Main
console.log('Knowledge Metrics Log Rotation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

rotateLogs();
archiveOldLogs();
deleteOldLogs();

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Log rotation complete');
