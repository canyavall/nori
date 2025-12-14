#!/usr/bin/env node

/**
 * Post-Implementation Documentation Check Hook
 *
 * Detects when AI just implemented game mechanics and reminds to check documentation sync.
 * Triggers on UserPromptSubmit after implementation tasks.
 */

import fs from 'fs';
import path from 'path';
import { logHookError } from './hook-error-logger.mjs';

const GAME_MECHANICS_KEYWORDS = [
  'damage', 'formula', 'critical', 'stat', 'combat', 'skill',
  'hero', 'monster', 'equipment', 'progression', 'balance'
];

const IMPLEMENTATION_KEYWORDS = [
  'implement', 'create', 'add', 'build', 'write code', 'function', 'class'
];

function main() {
  try {
    // Read stdin (hook input)
    let input = '';
    if (process.stdin.isTTY) {
      console.log(JSON.stringify({ transformedPrompt: '' }));
      return;
    }

    const chunks = [];
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', () => {
      input = Buffer.concat(chunks).toString('utf8');
      processHook(input);
    });
  } catch (error) {
    logHookError('post-implementation-check', error, { isTTY: process.stdin.isTTY });
    console.error('Hook error:', error);
    console.log(JSON.stringify({ transformedPrompt: '' }));
  }
}

function processHook(input) {
  let hookData;
  try {
    hookData = JSON.parse(input);
  } catch {
    console.log(JSON.stringify({ transformedPrompt: '' }));
    return;
  }

  const prompt = hookData.prompt || '';
  const conversationHistory = hookData.conversationHistory || [];

  // Check if this looks like post-implementation
  const isGameMechanics = GAME_MECHANICS_KEYWORDS.some(kw =>
    prompt.toLowerCase().includes(kw)
  );

  const isImplementation = IMPLEMENTATION_KEYWORDS.some(kw =>
    prompt.toLowerCase().includes(kw)
  );

  // Check recent conversation for implementation activity
  const recentImplementation = conversationHistory
    .slice(-3)
    .some(msg => {
      const text = (msg.content || '').toLowerCase();
      return IMPLEMENTATION_KEYWORDS.some(kw => text.includes(kw)) &&
             GAME_MECHANICS_KEYWORDS.some(kw => text.includes(kw));
    });

  // If game mechanics implementation detected, add documentation reminder
  if ((isGameMechanics && isImplementation) || recentImplementation) {
    const reminder = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 POST-IMPLEMENTATION: Documentation Sync Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Game mechanics implementation detected.

BEFORE marking task complete, verify documentation sync:

1. Did formulas/constants change?
   → Update: documentation/formulas/ or documentation/game-data/

2. Did implementation reveal design issues?
   → Document in: documentation/.meta/ impact analysis

3. Do examples still match?
   → Recalculate: All examples in affected documentation

4. Check dependencies:
   → Run: jq '.systems["SYSTEM_NAME"]' documentation/.meta/dependencies.json

Load knowledge for guidance:
- game-documentation-workflow.md (sync process)
- game-doc-maintenance.md (impact analysis)

Skip this check ONLY if:
- No game mechanics involved (pure UI/infrastructure)
- Documentation already updated
- No formulas/constants changed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER REQUEST:
${prompt}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    console.log(JSON.stringify({
      transformedPrompt: reminder
    }));
  } else {
    // No game mechanics detected, pass through
    console.log(JSON.stringify({ transformedPrompt: '' }));
  }
}

main();
