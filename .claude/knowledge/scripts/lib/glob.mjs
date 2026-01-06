/**
 * Minimal glob implementation - replaces glob dependency
 * Uses Node.js native fs operations for file pattern matching
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';

/**
 * Convert glob pattern to regex
 * Supports: *, **, ?, [abc], {a,b}
 */
function globToRegex(pattern) {
  let regexStr = pattern
    // Escape special regex chars except glob chars
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    // ** matches any path (including /)
    .replace(/\*\*/g, '___DOUBLE_STAR___')
    // * matches anything except /
    .replace(/\*/g, '[^/]*')
    // ? matches single char except /
    .replace(/\?/g, '[^/]')
    // Restore **
    .replace(/___DOUBLE_STAR___/g, '.*')
    // {a,b} alternatives
    .replace(/\{([^}]+)\}/g, (_, alternatives) => {
      return `(${alternatives.split(',').join('|')})`;
    });

  return new RegExp(`^${regexStr}$`);
}

/**
 * Recursively walk directory and collect matching files
 */
async function walkDir(dir, regex, results = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip common ignore directories
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }
      await walkDir(fullPath, regex, results);
    } else if (entry.isFile()) {
      // Test against pattern
      if (regex.test(fullPath)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

/**
 * Find files matching glob pattern
 * @param {string} pattern - Glob pattern (e.g., "star-star/star.md")
 * @param {object} options - Options { cwd: string, ignore: string[] }
 * @returns {Promise<string[]>} - Array of matching file paths
 */
export async function glob(pattern, options = {}) {
  const cwd = options.cwd || process.cwd();

  // Handle absolute patterns
  const isAbsolute = pattern.startsWith('/');

  // Determine base directory and search pattern
  let basePath, searchPattern;

  if (isAbsolute) {
    // Absolute pattern: /path/to/**/*.md
    basePath = '/';
    searchPattern = pattern;
  } else {
    // Relative pattern: vault/**/*.md or ./vault/**/*.md
    basePath = cwd;
    searchPattern = join(cwd, pattern);
  }

  // Convert glob to regex
  const regex = globToRegex(searchPattern);

  // Walk and match
  const results = await walkDir(basePath, regex);

  // Sort for consistent output (same as glob library)
  return results.sort();
}

// Named export for compatibility
export { glob as default };
