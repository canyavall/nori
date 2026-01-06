#!/usr/bin/env node

/**
 * Simple template renderer for knowledge prompt templates
 *
 * Replaces {{VARIABLE}} placeholders with provided values
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_DIR = join(__dirname, '../templates');

/**
 * Render a template file with provided variables
 *
 * @param {string} templateName - Template filename (e.g., 'first-prompt.template.md')
 * @param {Object} variables - Key-value pairs for replacement
 * @returns {string} Rendered template
 */
export const renderTemplate = (templateName, variables) => {
  const templatePath = join(TEMPLATES_DIR, templateName);

  try {
    let content = readFileSync(templatePath, 'utf-8');

    // Replace all {{VARIABLE}} placeholders
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const replacement = value !== undefined && value !== null ? String(value) : '';
      content = content.replaceAll(placeholder, replacement);
    }

    return content;
  } catch (error) {
    throw new Error(`Failed to render template ${templateName}: ${error.message}`);
  }
};

/**
 * Escape user prompt for safe shell command usage
 *
 * @param {string} prompt - User prompt to escape
 * @returns {string} Escaped prompt
 */
export const escapePrompt = (prompt) => {
  return prompt
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ');
};
