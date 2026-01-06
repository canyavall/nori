#!/usr/bin/env node
/**
 * Unified tracking wrapper for knowledge system metrics
 * Provides CLI interface for tracking knowledge package reads
 */

import { logPackageRead } from '../scripts/metrics-logger.mjs';

const main = () => {
  const args = process.argv.slice(2);

  // Parse CLI arguments
  const getArg = (flag) => {
    const index = args.indexOf(flag);
    return index !== -1 ? args[index + 1] : null;
  };

  const command = getArg('--command');
  const agentId = getArg('--agent-id');
  const packagesArg = getArg('--packages');

  if (command === 'track-read') {
    if (!agentId || !packagesArg) {
      console.error('Error: --agent-id and --packages are required for track-read command');
      process.exit(1);
    }

    const packages = packagesArg.split(',').map(p => p.trim()).filter(Boolean);

    // Log each package read
    packages.forEach(packageName => {
      logPackageRead({
        packageName,
        loadedBy: 'manual',
        sessionId: agentId,
        fileSizeBytes: null,
        alreadyLoaded: false
      });
    });

    console.log(`✓ Tracked ${packages.length} package read(s)`);
  } else {
    console.log('Usage: unified-tracking.mjs --command track-read --agent-id <id> --packages <pkg1,pkg2,...>');
    process.exit(1);
  }
};

main();
