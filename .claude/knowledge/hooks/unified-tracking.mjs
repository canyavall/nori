#!/usr/bin/env node

/**
 * Unified Knowledge Tracking
 *
 * Tracks knowledge loading decisions in knowledge-tracking.jsonl:
 * - considered: packages returned by search
 * - skipped: packages not loaded (calculated from considered - read)
 * - read: packages actually read
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

const TRACKING_FILE = join(process.cwd(), '.claude', 'knowledge', 'tracker', 'knowledge-tracking.jsonl');

/**
 * Ensure tracking directory exists
 */
const ensureTrackingDir = () => {
  const dir = dirname(TRACKING_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

/**
 * Read all entries from tracking file
 * Returns array of entries
 */
const readAllEntries = () => {
  if (!existsSync(TRACKING_FILE)) {
    return [];
  }

  try {
    const data = readFileSync(TRACKING_FILE, 'utf-8').trim();
    if (!data) {
      return [];
    }

    const lines = data.split('\n').filter(Boolean);
    return lines.map(line => JSON.parse(line));
  } catch (error) {
    console.error('[tracking] Failed to read knowledge-tracking.jsonl:', error.message);
    return [];
  }
};

/**
 * Find entry by agent_id
 * Returns the MOST RECENT entry (last in file) with matching agent_id
 * This handles cases where multiple searches happen with same agent_id
 */
const findEntryByAgentId = (agentId) => {
  const entries = readAllEntries();
  // Find all matching entries
  const matches = entries.filter(entry => entry.agent_id === agentId);
  // Return the last (most recent) match
  return matches.length > 0 ? matches[matches.length - 1] : null;
};

/**
 * Update entry by agent_id
 * Reads all entries, updates the MOST RECENT matching one, writes back
 */
const updateEntry = (agentId, updates) => {
  try {
    ensureTrackingDir();
    const entries = readAllEntries();

    // Find the LAST (most recent) matching entry
    let entryIndex = -1;
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].agent_id === agentId) {
        entryIndex = i;
        break;
      }
    }

    if (entryIndex === -1) {
      console.error(`[tracking] Entry not found for agent_id: ${agentId}`);
      return false;
    }

    // Merge updates
    entries[entryIndex] = {
      ...entries[entryIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Write back entire file
    const content = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
    writeFileSync(TRACKING_FILE, content, 'utf-8');

    return true;
  } catch (error) {
    console.error('[tracking] Failed to update entry:', error.message);
    return false;
  }
};

/**
 * Initialize tracking from knowledge search results
 * Called by knowledge-search.mjs when search completes
 */
export const initializeFromSearch = ({
  agentId,
  agentName,
  sessionId,
  prompt,
  tags,
  categories,
  consideredPackages,
}) => {
  try {
    ensureTrackingDir();

    const entry = {
      timestamp: new Date().toISOString(),
      session_id: sessionId || null,
      prompt: prompt || null,
      agent_id: agentId,
      agent_name: agentName,
      tags: tags || [],
      categories: categories || [],
      knowledge: {
        considered: consideredPackages || [],
        skipped: [],   // Future: track packages not loaded
        read: [],      // Future: track packages actually read
      },
    };

    appendFileSync(TRACKING_FILE, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (error) {
    // Silent fail - tracking should never break functionality
    console.error('[tracking] Failed to write knowledge-tracking.jsonl:', error.message);
  }
};

/**
 * Update selection reasoning for an entry
 * Called after parsing Claude's selection JSON block
 */
export const updateSelection = ({ agentId, selected, skipped, reasoning }) => {
  const entry = findEntryByAgentId(agentId);
  if (!entry) {
    console.error(`[tracking] Cannot update selection - entry not found: ${agentId}`);
    return false;
  }

  return updateEntry(agentId, {
    selection: {
      selected: selected || [],
      skipped: skipped || [],
      reasoning: reasoning || {},
    },
  });
};

/**
 * Update read packages for an entry
 * Called when Claude actually reads knowledge packages
 */
export const updateRead = ({ agentId, readPackages }) => {
  const entry = findEntryByAgentId(agentId);
  if (!entry) {
    console.error(`[tracking] Cannot update read - entry not found: ${agentId}`);
    return false;
  }

  // Calculate skipped: considered - read
  const considered = entry.knowledge?.considered || [];
  const read = readPackages || [];
  const skipped = considered.filter(pkg => !read.includes(pkg));

  return updateEntry(agentId, {
    knowledge: {
      ...entry.knowledge,
      read,
      skipped,
    },
  });
};

/**
 * Update usage analysis for an entry
 * Called after analyzing which packages influenced the response
 */
export const updateUsage = ({ agentId, used, unused }) => {
  const entry = findEntryByAgentId(agentId);
  if (!entry) {
    console.error(`[tracking] Cannot update usage - entry not found: ${agentId}`);
    return false;
  }

  const usedPackages = used || [];
  const unusedPackages = unused || [];
  const read = entry.knowledge?.read || [];

  // Calculate precision: used / read
  const precision = read.length > 0 ? usedPackages.length / read.length : 0;

  return updateEntry(agentId, {
    usage: {
      used: usedPackages,
      unused: unusedPackages,
      precision: Math.round(precision * 100) / 100, // Round to 2 decimals
    },
  });
};
