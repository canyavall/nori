/**
 * Minimal YAML frontmatter parser - zero dependencies
 * Handles patterns used in knowledge vault:
 * - Dash arrays (tags: \n  - item)
 * - Folded strings (description: >- \n  text)
 * - Bracket arrays (required_knowledge: [])
 * - Simple values (category: apps)
 */

function parseYAML(yamlString) {
  const data = {};
  const lines = yamlString.split('\n');
  const multiLineKeys = new Set(); // Track keys with multi-line string syntax
  let currentKey = null;
  let currentArray = null;
  let currentString = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Check if this is an indented line (part of multi-line content)
    const isIndented = line.length > 0 && line[0] === ' ';

    // Check for dash array item (  - item)
    if (line.match(/^\s{2,}-\s+(.+)/) && currentKey) {
      const match = line.match(/^\s{2,}-\s+(.+)/);
      if (!currentArray) {
        currentArray = [];
        data[currentKey] = currentArray;
      }
      currentArray.push(match[1].trim());
      continue;
    }

    // Continuation of multi-line string (any indented line)
    if (currentString !== null && isIndented) {
      currentString.push(trimmed);
      continue;
    }

    // Must be a new key (starts at column 0)
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      continue; // Malformed line, skip
    }

    const key = trimmed.substring(0, colonIndex).trim();
    let value = trimmed.substring(colonIndex + 1).trim();

    // Reset state for new key
    currentKey = key;
    currentArray = null;
    currentString = null;

    // Handle bracket arrays [item1, item2]
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .substring(1, value.length - 1)
        .split(',')
        .map(v => v.trim().replace(/^["']|["']$/g, ''))
        .filter(v => v);
      continue;
    }

    // Handle folded/literal strings (> or >-)
    if (value === '>' || value === '>-' || value === '|-' || value === '|') {
      currentString = [];
      data[key] = currentString;
      multiLineKeys.add(key); // Mark as multi-line string
      continue;
    }

    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }

    // Simple value
    data[key] = value;
  }

  // Join only multi-line strings (not dash arrays like tags)
  for (const key of multiLineKeys) {
    const value = data[key];
    if (Array.isArray(value)) {
      data[key] = value.join(' ').trim();
    }
  }

  return data;
}

/**
 * Parse markdown content with YAML frontmatter
 * @param {string} content - Markdown content with frontmatter
 * @returns {{ data: object, content: string }} - Parsed frontmatter and content
 */
export function parseFrontmatter(content) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content };
  }

  const [, yamlContent, markdownContent] = match;
  const data = parseYAML(yamlContent);

  return {
    data,
    content: markdownContent.trim()
  };
}

// Export with same interface as gray-matter for drop-in replacement
export default parseFrontmatter;
