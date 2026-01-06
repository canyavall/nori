#!/usr/bin/env node

/**
 * Session Start Role Loader Hook
 *
 * Loads knowledge packages for configured role from settings.json.
 * This hook actually reads and injects the knowledge content (not just metadata).
 *
 * Flow:
 * 1. Call load-role.mjs --from-settings to get package paths
 * 2. Read each knowledge file
 * 3. Format and output to be injected into context
 *
 * Hook type: SessionStart
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { logHookError } from './hook-error-logger.mjs';

const LOAD_ROLE_SCRIPT = '.claude/knowledge/scripts/load-role.mjs';

/**
 * Load role configuration and get knowledge paths
 */
const getRoleKnowledgePaths = () => {
  try {
    const output = execSync(`node ${LOAD_ROLE_SCRIPT} --from-settings`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    const result = JSON.parse(output);
    return result;
  } catch (error) {
    // If load-role fails (no role configured, etc), return empty
    return null;
  }
};

/**
 * Read knowledge file content
 */
const readKnowledgeFile = (path) => {
  try {
    return readFileSync(path, 'utf-8');
  } catch (error) {
    console.error(`⚠️  Failed to read knowledge file: ${path}`);
    return null;
  }
};

/**
 * Format knowledge content for injection
 */
const formatKnowledgeContent = (roleData) => {
  const { role_name, packages, knowledge_paths, already_loaded_packages } = roleData;

  if (!packages || packages.length === 0) {
    if (already_loaded_packages && already_loaded_packages.length > 0) {
      return `📦 Role: ${role_name}\n✓ All ${already_loaded_packages.length} packages already loaded in this session`;
    }
    return `📦 Role: ${role_name}\n⚠️  No packages to load`;
  }

  const sections = [];

  // Header
  sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  sections.push(`📦 ROLE KNOWLEDGE LOADED: ${role_name.toUpperCase()}`);
  sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  sections.push(``);
  sections.push(`Loaded ${packages.length} package(s): ${packages.join(', ')}`);

  if (already_loaded_packages && already_loaded_packages.length > 0) {
    sections.push(`Already loaded: ${already_loaded_packages.join(', ')}`);
  }

  sections.push(``);
  sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  sections.push(``);

  // Load and append each knowledge file
  for (let i = 0; i < knowledge_paths.length; i++) {
    const path = knowledge_paths[i];
    const packageName = packages[i];

    const content = readKnowledgeFile(path);
    if (content) {
      sections.push(`## 📄 ${packageName}`);
      sections.push(``);
      sections.push(content);
      sections.push(``);
      sections.push(`---`);
      sections.push(``);
    }
  }

  sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  sections.push(`END ROLE KNOWLEDGE: ${role_name.toUpperCase()}`);
  sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  return sections.join('\n');
};

const main = () => {
  try {
    // Get role configuration
    const roleData = getRoleKnowledgePaths();

    if (!roleData) {
      // No role configured - output nothing (no error)
      process.exit(0);
    }

    // Format and output knowledge content
    const output = formatKnowledgeContent(roleData);
    console.log(output);

    process.exit(0);
  } catch (error) {
    logHookError('session-start-role-loader', error, {
      script: LOAD_ROLE_SCRIPT
    });
    console.error(`⚠️  Role loader failed: ${error.message}`);
    process.exit(0); // Don't fail the session start
  }
};

main();
