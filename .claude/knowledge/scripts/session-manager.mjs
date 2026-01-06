#!/usr/bin/env node

/**
 * Session Manager
 *
 * Manages knowledge loading session state to prevent duplicate loading.
 * Tracks which packages have been loaded in the current session.
 *
 * Commands:
 *   init        - Initialize new session (clears state)
 *   add         - Add packages to loaded list
 *   check       - Check if packages are loaded
 *   list        - List all loaded packages
 *   clear       - Clear session state
 *
 * Usage:
 *   node session-manager.mjs init
 *   node session-manager.mjs add pkg1,pkg2,pkg3
 *   node session-manager.mjs check pkg1,pkg2
 *   node session-manager.mjs list
 *   node session-manager.mjs clear
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Session state file
const SESSION_STATE_FILE = join(__dirname, '../tracker/session-state.json');

/**
 * Ensure tracker directory exists
 */
const ensureDir = () => {
  const dir = dirname(SESSION_STATE_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

/**
 * Read current session state
 */
const readState = () => {
  if (!existsSync(SESSION_STATE_FILE)) {
    return null;
  }

  try {
    const content = readFileSync(SESSION_STATE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read session state:', error.message);
    return null;
  }
};

/**
 * Write session state
 */
const writeState = (state) => {
  try {
    ensureDir();
    writeFileSync(SESSION_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed to write session state:', error.message);
    return false;
  }
};

/**
 * Generate session ID
 */
const generateSessionId = () => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `session-${timestamp}`;
};

/**
 * Initialize new session
 */
const initSession = () => {
  const state = {
    session_id: generateSessionId(),
    started_at: new Date().toISOString(),
    loaded_packages: [],
    categories_shown: false,  // Track if full categories shown
  };

  if (writeState(state)) {
    console.log(`✓ Session initialized: ${state.session_id}`);
    return true;
  }

  return false;
};

/**
 * Add packages to loaded list
 */
const addPackages = (packages) => {
  let state = readState();

  // Initialize if no state
  if (!state) {
    initSession();
    state = readState();
  }

  // Add packages (dedupe)
  const currentPackages = new Set(state.loaded_packages || []);
  packages.forEach(pkg => currentPackages.add(pkg));
  state.loaded_packages = Array.from(currentPackages).sort();
  state.updated_at = new Date().toISOString();

  if (writeState(state)) {
    console.log(`✓ Added ${packages.length} packages (${state.loaded_packages.length} total)`);
    return true;
  }

  return false;
};

/**
 * Check if packages are loaded
 * Returns JSON with status for each package
 */
const checkPackages = (packages) => {
  const state = readState();

  if (!state) {
    // No session = nothing loaded
    const result = packages.reduce((acc, pkg) => {
      acc[pkg] = false;
      return acc;
    }, {});
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const loadedSet = new Set(state.loaded_packages || []);
  const result = packages.reduce((acc, pkg) => {
    acc[pkg] = loadedSet.has(pkg);
    return acc;
  }, {});

  console.log(JSON.stringify(result, null, 2));
};

/**
 * List all loaded packages
 */
const listPackages = () => {
  const state = readState();

  if (!state || !state.loaded_packages || state.loaded_packages.length === 0) {
    console.log('No packages loaded in current session');
    return;
  }

  console.log(`Session: ${state.session_id}`);
  console.log(`Started: ${state.started_at}`);
  console.log(`Loaded packages (${state.loaded_packages.length}):`);
  state.loaded_packages.forEach(pkg => console.log(`  - ${pkg}`));
};

/**
 * Clear session state
 */
const clearSession = () => {
  if (writeState({ loaded_packages: [], categories_shown: false, cleared_at: new Date().toISOString() })) {
    console.log('✓ Session cleared');
    return true;
  }

  return false;
};

/**
 * Mark that categories have been shown (first prompt)
 * Returns true on success
 */
const markCategoriesShown = () => {
  let state = readState();

  if (!state) {
    initSession();
    state = readState();
  }

  state.categories_shown = true;
  state.updated_at = new Date().toISOString();

  return writeState(state);
};

/**
 * Check if categories have been shown
 * Returns { isFirstPrompt: boolean }
 */
const checkCategoriesShown = () => {
  const state = readState();

  if (!state) {
    return { isFirstPrompt: true };
  }

  return {
    isFirstPrompt: !state.categories_shown
  };
};

/**
 * Filter out already-loaded packages
 * Used by load scripts to avoid duplicates
 */
const filterUnloaded = (packages) => {
  const state = readState();

  if (!state) {
    // No session = nothing loaded = return all packages
    console.log(JSON.stringify({ unloaded: packages, already_loaded: [] }, null, 2));
    return;
  }

  const loadedSet = new Set(state.loaded_packages || []);
  const unloaded = packages.filter(pkg => !loadedSet.has(pkg));
  const alreadyLoaded = packages.filter(pkg => loadedSet.has(pkg));

  console.log(JSON.stringify({ unloaded, already_loaded: alreadyLoaded }, null, 2));
};

// Export functions for programmatic use
export {
  initSession,
  addPackages,
  checkPackages,
  listPackages,
  clearSession,
  filterUnloaded,
  markCategoriesShown,
  checkCategoriesShown,
  readState,
  writeState,
};

// CLI
const main = () => {
  const [,, command, ...args] = process.argv;

  if (!command) {
    console.error('Usage: session-manager.mjs <command> [args]');
    console.error('Commands: init, add, check, list, clear, filter, mark-categories, check-categories');
    process.exit(1);
  }

  switch (command) {
    case 'init':
      initSession();
      break;

    case 'add': {
      if (!args[0]) {
        console.error('Usage: session-manager.mjs add pkg1,pkg2,pkg3');
        process.exit(1);
      }
      const packages = args[0].split(',').map(p => p.trim()).filter(Boolean);
      addPackages(packages);
      break;
    }

    case 'check': {
      if (!args[0]) {
        console.error('Usage: session-manager.mjs check pkg1,pkg2,pkg3');
        process.exit(1);
      }
      const packages = args[0].split(',').map(p => p.trim()).filter(Boolean);
      checkPackages(packages);
      break;
    }

    case 'list':
      listPackages();
      break;

    case 'clear':
      clearSession();
      break;

    case 'filter': {
      if (!args[0]) {
        console.error('Usage: session-manager.mjs filter pkg1,pkg2,pkg3');
        process.exit(1);
      }
      const packages = args[0].split(',').map(p => p.trim()).filter(Boolean);
      filterUnloaded(packages);
      break;
    }

    case 'mark-categories':
      if (markCategoriesShown()) {
        console.log('✓ Categories marked as shown');
      } else {
        console.error('✗ Failed to mark categories');
        process.exit(1);
      }
      break;

    case 'check-categories': {
      const result = checkCategoriesShown();
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Commands: init, add, check, list, clear, filter, mark-categories, check-categories');
      process.exit(1);
  }
};

// Only run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
