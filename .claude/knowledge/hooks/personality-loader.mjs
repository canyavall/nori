#!/usr/bin/env node

/**
 * Unified Role-Personality Hook
 *
 * Loads personality from template files based on .claude/knowledge/settings.json role config.
 * Unified: settings.role determines both knowledge packages AND personality.
 * No restart needed - just change settings.json and next prompt uses new role.
 *
 * Backward compatible with:
 * - settings.personality (legacy)
 * - settings.role_preload.role (legacy)
 *
 * Hook type: UserPromptSubmit
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { logHookError } from './hook-error-logger.mjs';

const SETTINGS_PATH = join(process.cwd(), '.claude/knowledge/settings.json');
const PERSONALITIES_DIR = join(process.cwd(), '.claude/knowledge/templates/personalities');

/**
 * Load personality text from template file
 */
const loadPersonality = () => {
  try {
    // Read settings - unified role field (backward compatible)
    let personality = 'staff_engineer'; // default

    if (existsSync(SETTINGS_PATH)) {
      const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
      // New unified approach: settings.role
      // Backward compat: settings.personality or settings.role_preload.role
      personality = settings.role
                 || settings.personality
                 || settings.role_preload?.role
                 || 'staff_engineer';
    }

    // Read personality template
    const templatePath = join(PERSONALITIES_DIR, `${personality}.txt`);

    if (!existsSync(templatePath)) {
      console.error(`[personality] Template not found: ${templatePath}, using default`);
      const defaultPath = join(PERSONALITIES_DIR, 'staff_engineer.txt');
      return readFileSync(defaultPath, 'utf-8').trim();
    }

    return readFileSync(templatePath, 'utf-8').trim();
  } catch (error) {
    // Fallback to hardcoded default if everything fails
    console.error(`[personality] Error loading personality: ${error.message}`);
    return 'Act as a Staff Engineer reviewing engineering work. Assume competence. Be skeptical, precise, and pragmatic.';
  }
};

/**
 * List available personalities
 */
const listPersonalities = () => {
  try {
    if (!existsSync(PERSONALITIES_DIR)) {
      return [];
    }
    return readdirSync(PERSONALITIES_DIR)
      .filter(f => f.endsWith('.txt'))
      .map(f => f.replace('.txt', ''));
  } catch (error) {
    return [];
  }
};

/**
 * Read JSON from stdin
 */
const readStdin = () => {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => { resolve(data); });
  });
};

(async () => {
  let stdinData = '';
  try {
    stdinData = await readStdin();
    let userPrompt = '';

    try {
      const hookData = JSON.parse(stdinData);
      userPrompt = hookData.prompt || '';
    } catch (error) {
      // Fallback: treat as plain text
      userPrompt = stdinData.trim();
    }

    // Skip empty prompts
    if (!userPrompt || userPrompt.trim().length === 0) {
      console.log(userPrompt || '');
      process.exit(0);
    }

    const personalityText = loadPersonality();

    // Skip if personality already injected (check first 50 chars to avoid false positives)
    const personalitySignature = personalityText.substring(0, 50);
    if (userPrompt.includes(personalitySignature)) {
      console.log(userPrompt);
      process.exit(0);
    }

    // Append personality instruction
    const transformedPrompt = `${userPrompt}\n\n${personalityText}`;

    console.log(transformedPrompt);
    process.exit(0);
  } catch (error) {
    logHookError('personality-loader', error, {
      stdinLength: stdinData.length,
      promptLength: userPrompt?.length || 0
    });
    // On any error, pass through original prompt
    console.error(`[personality] Hook error: ${error.message}`);
    console.log(stdinData);
    process.exit(0);
  }
})();
