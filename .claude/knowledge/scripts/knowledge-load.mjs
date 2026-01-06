#!/usr/bin/env node

/**
 * Knowledge Load
 *
 * Complete workflow for loading knowledge packages:
 * 1. Filter already-loaded packages (via session-manager)
 * 2. Resolve paths from knowledge.json
 * 3. Output paths for Claude to read
 * 4. Track loaded packages in session state
 *
 * Usage:
 *   node knowledge-load.mjs --packages pkg1,pkg2,pkg3
 *
 * Output: JSON with paths for Claude to read
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { logScriptUsage } from './lib/usage-tracker.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_JSON = join(__dirname, '../knowledge.json');
const PROJECT_ROOT = join(__dirname, '../../..');
const SESSION_MANAGER = join(__dirname, 'session-manager.mjs');

// Start timing
const startTime = Date.now();

// Parse arguments
const args = process.argv.slice(2);
const getArg = (flag) => {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : null;
};

const packagesArg = getArg('--packages');
const agentId = getArg('--agent-id');

if (!packagesArg) {
  console.error('Error: Must specify --packages');
  console.error('Usage: node knowledge-load.mjs --packages pkg1,pkg2,pkg3');
  process.exit(1);
}

// Parse package list
const requestedPackages = packagesArg.split(',').map(p => p.trim()).filter(Boolean);

if (requestedPackages.length === 0) {
  console.error('Error: No packages specified');
  process.exit(1);
}

// Filter already-loaded packages
let packagesToLoad = requestedPackages;
try {
  const filterResult = execSync(
    `node "${SESSION_MANAGER}" filter ${requestedPackages.join(',')}`,
    { encoding: 'utf-8' }
  );

  const { unloaded, already_loaded } = JSON.parse(filterResult);
  packagesToLoad = unloaded;

  if (already_loaded.length > 0) {
    console.error('ℹ Skipped (already loaded):', already_loaded.join(', '));
  }
} catch (error) {
  // If session-manager fails, load all packages
  console.error('Warning: Could not filter packages, loading all:', error.message);
}

if (packagesToLoad.length === 0) {
  const output = {
    status: 'success',
    loaded: 0,
    already_loaded: requestedPackages.length,
    paths: []
  };

  // Log usage
  logScriptUsage({
    script: 'knowledge-load',
    callerId: agentId,
    args: {
      packages: requestedPackages,
      package_count: requestedPackages.length
    },
    executionTimeMs: Date.now() - startTime,
    result: {
      status: 'success',
      loaded: 0,
      already_loaded: requestedPackages.length
    }
  });

  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

// Load knowledge.json
let knowledge;
try {
  const content = readFileSync(KNOWLEDGE_JSON, 'utf-8');
  knowledge = JSON.parse(content);
} catch (error) {
  // Log error
  logScriptUsage({
    script: 'knowledge-load',
    callerId: agentId,
    args: {
      packages: requestedPackages,
      package_count: requestedPackages.length
    },
    executionTimeMs: Date.now() - startTime,
    result: {
      status: 'error',
      error: `Failed to load knowledge.json: ${error.message}`
    }
  });

  console.error('Error: Failed to load knowledge.json:', error.message);
  process.exit(1);
}

// Resolve package paths
const packagePaths = [];
const missing = [];

for (const pkg of packagesToLoad) {
  let found = false;

  // Search through all categories
  for (const [category, items] of Object.entries(knowledge.knowledge)) {
    if (items[pkg]) {
      packagePaths.push({
        name: pkg,
        path: join(PROJECT_ROOT, items[pkg].knowledge_path),
        category: items[pkg].category
      });
      found = true;
      break;
    }
  }

  if (!found) {
    missing.push(pkg);
  }
}

if (missing.length > 0) {
  // Log error
  logScriptUsage({
    script: 'knowledge-load',
    callerId: agentId,
    args: {
      packages: requestedPackages,
      package_count: requestedPackages.length
    },
    executionTimeMs: Date.now() - startTime,
    result: {
      status: 'error',
      error: `Packages not found: ${missing.join(', ')}`,
      missing_count: missing.length
    }
  });

  console.error('Error: Packages not found in knowledge.json:');
  missing.forEach(p => console.error(`  - ${p}`));
  process.exit(1);
}

// Output paths for Claude to read
const output = {
  status: 'success',
  loaded: packagePaths.length,
  already_loaded: requestedPackages.length - packagesToLoad.length,
  paths: packagePaths
};

// Log usage
logScriptUsage({
  script: 'knowledge-load',
  callerId: agentId,
  args: {
    packages: requestedPackages,
    package_count: requestedPackages.length
  },
  executionTimeMs: Date.now() - startTime,
  result: {
    status: 'success',
    loaded: packagePaths.length,
    already_loaded: output.already_loaded
  }
});

console.log(JSON.stringify(output, null, 2));

// Track loaded packages in session state
if (packagesToLoad.length > 0) {
  try {
    execSync(
      `node "${SESSION_MANAGER}" add ${packagesToLoad.join(',')}`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
  } catch (error) {
    console.error('Warning: Failed to track loaded packages:', error.message);
  }
}
