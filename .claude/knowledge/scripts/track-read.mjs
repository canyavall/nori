#!/usr/bin/env node

/**
 * Track Read Packages
 *
 * Updates tracking entry with packages that were actually read.
 * Called by Claude after loading knowledge packages.
 *
 * Usage:
 *   node track-read.mjs --agent-id prompt-123 --packages pkg1,pkg2,pkg3
 */

import { updateRead } from '../hooks/unified-tracking.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1];
      parsed[key] = value;
      i++;
    }
  }

  return parsed;
};

const main = () => {
  const args = parseArgs();

  if (!args['agent-id']) {
    console.error('Error: --agent-id is required');
    process.exit(1);
  }

  if (!args['packages']) {
    console.error('Error: --packages is required');
    process.exit(1);
  }

  const agentId = args['agent-id'];
  const packages = args['packages'].split(',').map(p => p.trim()).filter(Boolean);

  const success = updateRead({
    agentId,
    readPackages: packages,
  });

  if (success) {
    console.log(`✓ Tracked ${packages.length} read packages for ${agentId}`);
  } else {
    console.error(`✗ Failed to track read packages for ${agentId}`);
    process.exit(1);
  }
};

main();
