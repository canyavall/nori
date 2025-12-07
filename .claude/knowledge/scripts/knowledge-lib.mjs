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
 * @param {Object} mapping - Knowledge mapping object
 * @returns {Map<string, {category: string, data: Object}>} Package index
 */
export const buildPackageIndex = (mapping) => {
  const index = new Map();

  for (const [category, packages] of Object.entries(mapping.knowledge || {})) {
    if (typeof packages !== 'object' || !packages) continue;

    for (const [name, data] of Object.entries(packages)) {
      if (typeof data !== 'object' || !data) continue;

      if (index.has(name)) {
        // Duplicate package name detected
        const existing = index.get(name);
        console.warn(
          `Warning: Duplicate package name "${name}" found in categories "${existing.category}" and "${category}". ` +
          `First occurrence will be used.`
        );
        continue;
      }

      index.set(name, { category, data });
    }
  }

  return index;
};

/**
 * Find a package by name using the package index.
 *
 * @param {Map} packageIndex - Package index from buildPackageIndex()
 * @param {string} packageName - Name of the package to find
 * @returns {{name: string, category: string, data: Object} | null} Package info or null
 */
export const findPackageByName = (packageIndex, packageName) => {
  const result = packageIndex.get(packageName);
  if (!result) {
    return null;
  }

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
