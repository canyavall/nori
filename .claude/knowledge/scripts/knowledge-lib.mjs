#!/usr/bin/env node

/**
 * Shared utilities for knowledge management scripts.
 *
 * This library provides common functionality used by both:
 * - knowledge-search.mjs (runtime - called by AI agents)
 * - validate-knowledge.mjs (dev/CI tool)
 *
 * Keep this minimal to avoid bloating search script startup time.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
export const KNOWLEDGE_BASE_PATH = join(__dirname, '../');
export const KNOWLEDGE_MAPPING_PATH = join(__dirname, '../knowledge.json');

// Token estimation constant
export const AVG_CHARS_PER_TOKEN = 4;

// Cache for knowledge mapping (avoid re-parsing)
let _cachedMapping = null;

/**
 * Load and parse knowledge.json with caching.
 * @returns {Object} Parsed knowledge mapping
 * @throws {Error} If file not found or invalid JSON
 */
export const loadKnowledgeMapping = () => {
  if (_cachedMapping) {
    return _cachedMapping;
  }

  try {
    const content = readFileSync(KNOWLEDGE_MAPPING_PATH, 'utf-8');
    _cachedMapping = JSON.parse(content);
    return _cachedMapping;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Knowledge mapping file not found: ${KNOWLEDGE_MAPPING_PATH}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in knowledge mapping file: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Clear the cached mapping (useful for testing).
 */
export const clearCache = () => {
  _cachedMapping = null;
};

/**
 * Resolve the file path for a knowledge package.
 * Single source of truth for path resolution logic.
 *
 * @param {string} packageName - Name of the knowledge package
 * @param {Object} packageData - Package data from knowledge.json
 * @param {string} category - Category name
 * @param {string} baseDir - Base directory (defaults to KNOWLEDGE_BASE_PATH)
 * @returns {string} Absolute path to the knowledge file
 */
export const resolvePath = (packageName, packageData, category, baseDir = KNOWLEDGE_BASE_PATH) => {
  if (packageData.knowledge_path) {
    // Explicit path provided - join with project root
    return join(dirname(baseDir), '..', packageData.knowledge_path);
  }

  // Default pattern: .ai/knowledge/vault/[category]/[package-name]/[package-name].md
  return join(baseDir, 'vault', category, packageName, `${packageName}.md`);
};

/**
 * Build an index of all packages for O(1) lookups.
 *
 * Supports both composite keys (category/name) and short names.
 * Short names that appear in multiple categories are stored as arrays.
 *
 * @param {Object} mapping - Knowledge mapping object
 * @returns {Map<string, {category: string, data: Object} | Array>} Package index
 */
export const buildPackageIndex = (mapping) => {
  const index = new Map();

  for (const [category, packages] of Object.entries(mapping.knowledge || {})) {
    if (typeof packages !== 'object' || !packages) continue;

    for (const [name, data] of Object.entries(packages)) {
      if (typeof data !== 'object' || !data) continue;

      // Index by composite key for unambiguous lookups
      const compositeKey = `${category}/${name}`;
      index.set(compositeKey, { category, data });

      // Also index by short name for backward compatibility
      // Store as array to handle multiple packages with same name
      const existing = index.get(name);
      if (!existing) {
        index.set(name, [{ category, data }]);
      } else if (Array.isArray(existing)) {
        existing.push({ category, data });
      }
    }
  }

  return index;
};

/**
 * Find a package by name using the package index.
 *
 * Supports both composite keys (category/name) and short names.
 * For ambiguous short names (appear in multiple categories), uses preferredCategory
 * to disambiguate, or returns first match with a warning.
 *
 * @param {Map} packageIndex - Package index from buildPackageIndex()
 * @param {string} packageName - Name of the package to find (or category/name composite)
 * @param {string} [preferredCategory=null] - Optional category to prefer for ambiguous names
 * @returns {{name: string, category: string, data: Object} | null} Package info or null
 */
export const findPackageByName = (packageIndex, packageName, preferredCategory = null) => {
  // Try composite key first if category provided
  if (preferredCategory) {
    const compositeKey = `${preferredCategory}/${packageName}`;
    const result = packageIndex.get(compositeKey);
    if (result) {
      return {
        name: packageName,
        category: result.category,
        data: result.data,
      };
    }
  }

  // Try short name lookup
  const result = packageIndex.get(packageName);
  if (!result) {
    return null;
  }

  // Handle array of matches (ambiguous package names)
  if (Array.isArray(result)) {
    let match;

    if (result.length === 1) {
      match = result[0];
    } else {
      // Multiple matches - prefer by category or use first
      match = preferredCategory
        ? result.find(r => r.category === preferredCategory) || result[0]
        : result[0];

      if (result.length > 1 && !preferredCategory) {
        const categories = result.map(r => r.category).join('", "');
        console.warn(
          `Ambiguous package "${packageName}" found in categories "${categories}". ` +
          `Using ${match.category}. Specify preferredCategory to disambiguate.`
        );
      }
    }

    return {
      name: packageName,
      category: match.category,
      data: match.data,
    };
  }

  // Legacy/composite key result
  return {
    name: packageName,
    category: result.category,
    data: result.data,
  };
};

/**
 * Estimate token count from text length.
 *
 * @param {string} text - Text to estimate tokens for
 * @returns {number} Estimated token count
 */
export const estimateTokens = (text) => {
  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN);
};

// Known file pattern tags
export const EXTENSIONS = ['tsx', 'ts', 'jsx', 'js', 'mjs', 'cjs'];
export const SUFFIXES = ['spec', 'test', 'hook', 'hooks', 'stories', 'story', 'form', 'mock', 'mocks', 'style', 'styles', 'route', 'routes', 'context', 'provider', 'dto', 'types', 'enum'];

/**
 * Build file_patterns configuration from package tags
 *
 * Scans all packages for file pattern tags and builds the mapping
 * that was previously in knowledge.json file_patterns section.
 *
 * @param {Object} mapping - Knowledge mapping object
 * @returns {Object} File patterns config { extensions: {...}, suffixes: {...} }
 */
export const buildFilePatternsFromTags = (mapping) => {
  const filePatterns = {
    extensions: {},
    suffixes: {}
  };

  // Scan all packages for file pattern tags
  for (const [category, packages] of Object.entries(mapping.knowledge || {})) {
    for (const [pkgName, pkgData] of Object.entries(packages)) {
      if (!pkgData.tags) continue;

      for (const tag of pkgData.tags) {
        // Check if tag is an extension
        if (EXTENSIONS.includes(tag)) {
          const pattern = `.${tag}`;
          if (!filePatterns.extensions[pattern]) {
            filePatterns.extensions[pattern] = {
              packages: [],
              description: `${tag.toUpperCase()} files`
            };
          }
          filePatterns.extensions[pattern].packages.push(pkgName);
        }

        // Check if tag is a suffix
        if (SUFFIXES.includes(tag)) {
          const pattern = `.${tag}`;
          if (!filePatterns.suffixes[pattern]) {
            filePatterns.suffixes[pattern] = {
              packages: [],
              description: `${tag} files`
            };
          }
          filePatterns.suffixes[pattern].packages.push(pkgName);
        }
      }
    }
  }

  return filePatterns;
};

/**
 * Parse file path to extract extension, suffix, and combination.
 *
 * @param {string} filePath - File path to parse
 * @returns {{extension: string, suffix: string|null, combination: string|null, basename: string}} Parsed components
 *
 * @example
 * parseFilePath("Button.test.tsx")
 * // Returns: { extension: ".tsx", suffix: ".test", combination: ".test.tsx", basename: "Button.test.tsx" }
 */
export const parseFilePath = (filePath) => {
  if (!filePath) {
    return { extension: null, suffix: null, combination: null, basename: null };
  }

  // Get basename (last part of path)
  const basename = filePath.split('/').pop().split('\\').pop();

  // Extract extension (rightmost dot segment)
  const lastDotIndex = basename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { extension: null, suffix: null, combination: null, basename };
  }

  const extension = basename.substring(lastDotIndex); // e.g., ".tsx"
  const withoutExt = basename.substring(0, lastDotIndex); // e.g., "Button.test"

  // Extract suffix (second-to-last dot segment)
  const secondLastDotIndex = withoutExt.lastIndexOf('.');
  let suffix = null;
  if (secondLastDotIndex !== -1) {
    suffix = withoutExt.substring(secondLastDotIndex); // e.g., ".test"
  }

  // Build combination if suffix exists
  const combination = suffix ? suffix + extension : null; // e.g., ".test.tsx"

  return {
    extension,
    suffix,
    combination,
    basename,
  };
};

/**
 * Match file path against package tags and return packages to load.
 *
 * Builds file_patterns from tags, then matches.
 *
 * @param {string} filePath - File path to match
 * @param {Object} mapping - Knowledge mapping object
 * @returns {Array<string>} Array of package names to load
 *
 * @example
 * matchFilePatterns("Button.test.tsx", mapping)
 * // Returns: ["testing-core", "component-file-structure", "typescript-project-conventions", "react-project-conventions"]
 * // (.test suffix + .tsx extension packages merged)
 */
export const matchFilePatterns = (filePath, mapping) => {
  if (!filePath || !mapping) {
    return [];
  }

  // Build file patterns from tags
  const filePatterns = buildFilePatternsFromTags(mapping);

  const parsed = parseFilePath(filePath);
  const packages = new Set();

  // Check suffix (e.g., .test, .spec, .hook)
  if (parsed.suffix && filePatterns.suffixes?.[parsed.suffix]) {
    filePatterns.suffixes[parsed.suffix].packages.forEach(pkg => packages.add(pkg));
  }

  // Check extension (e.g., .tsx, .ts, .jsx)
  if (parsed.extension && filePatterns.extensions?.[parsed.extension]) {
    filePatterns.extensions[parsed.extension].packages.forEach(pkg => packages.add(pkg));
  }

  return Array.from(packages);
};

