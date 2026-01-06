#!/usr/bin/env node

/**
 * Sync Session State
 *
 * Syncs knowledge-reads-auto.jsonl to session-state.json loaded_packages.
 * Bridges the gap between automatic Read tracking and session state.
 *
 * Usage:
 *   node sync-session-state.mjs
 *   node sync-session-state.mjs --dry-run
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const READS_FILE = join(__dirname, '../tracker/knowledge-reads-auto.jsonl');
const SESSION_MANAGER = join(__dirname, 'session-manager.mjs');

// Parse arguments
const isDryRun = process.argv.includes('--dry-run');

/**
 * Parse JSONL file and extract unique packages
 */
const extractPackages = () => {
  if (!existsSync(READS_FILE)) {
    return [];
  }

  try {
    const content = readFileSync(READS_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    // Parse each line and extract package names
    const packages = new Set();
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.package) {
          packages.add(entry.package);
        }
      } catch (error) {
        console.error(`Warning: Failed to parse line: ${line.substring(0, 50)}...`);
      }
    }

    return Array.from(packages).sort();
  } catch (error) {
    console.error('Error reading knowledge-reads-auto.jsonl:', error.message);
    return [];
  }
};

/**
 * Sync packages to session state
 */
const syncPackages = (packages) => {
  if (packages.length === 0) {
    console.log('No packages to sync');
    return;
  }

  try {
    const packageList = packages.join(',');
    const command = `node "${SESSION_MANAGER}" add ${packageList}`;

    if (isDryRun) {
      console.log('Dry run - would execute:');
      console.log(command);
      console.log('\nPackages to add:');
      packages.forEach(pkg => console.log(`  - ${pkg}`));
      return;
    }

    execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`✓ Synced ${packages.length} packages to session state`);
  } catch (error) {
    console.error('Error syncing packages:', error.message);
    process.exit(1);
  }
};

// Main
const main = () => {
  console.log('Syncing knowledge-reads-auto.jsonl → session-state.json...\n');

  const packages = extractPackages();

  if (packages.length === 0) {
    console.log('No packages found in knowledge-reads-auto.jsonl');
    return;
  }

  console.log(`Found ${packages.length} unique packages`);

  syncPackages(packages);
};

main();
