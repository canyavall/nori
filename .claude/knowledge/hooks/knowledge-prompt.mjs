#!/usr/bin/env node

/**
 * Knowledge Prompt Hook (Universal Knowledge Loading)
 *
 * Adds a CLEAR instruction requiring the agent to:
 * 1. Read instructions file
 * 2. Analyze prompt → search for relevant knowledge → load if found
 * 3. PROVE compliance by starting response with "Loaded: [list]" or "No knowledge needed: [reason]"
 *
 * CRITICAL: Applies to ALL task types:
 * - Implementation (writing code)
 * - Research/Investigation (exploring codebase)
 * - Documentation creation (writing knowledge/docs)
 * - Analysis/Evaluation (reviewing code/patterns)
 *
 * Design:
 * - Visual formatting (stands out with ━━━ borders)
 * - Explicit task type examples (prevents false negatives)
 * - Requires proof (forces acknowledgment)
 * - Shows exact commands (reduces cognitive load)
 * - Forbids "task type" as sole justification for skipping
 */

/**
 * Read JSON from stdin
 */
const readStdin = () => {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
};

(async () => {
  try {
    const stdinData = await readStdin();
    let userPrompt = '';

    try {
      const hookData = JSON.parse(stdinData);
      userPrompt = hookData.prompt || '';
    } catch (error) {
      // Fallback: treat as plain text
      userPrompt = stdinData.trim();
    }

    // Skip empty or very short prompts
    if (!userPrompt || userPrompt.trim().length < 10) {
      console.log(userPrompt || '');
      process.exit(0);
    }

    // Don't transform if prompt already contains knowledge loading instructions
    if (userPrompt.includes('BEFORE responding') || userPrompt.includes('knowledge-search.mjs')) {
      console.log(userPrompt);
      process.exit(0);
    }

    // Add simple instruction - agent does all the analysis
    const transformedPrompt = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  MANDATORY KNOWLEDGE LOADING (for ANY task with existing patterns/knowledge)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read: .claude/knowledge/instructions/knowledge-loading-guide.md

CRITICAL: Knowledge is needed for ALL task types including:
- Implementation (writing code)
- Research/Investigation (exploring codebase)
- Documentation creation (writing knowledge/docs)
- Analysis/Evaluation (reviewing code/patterns)

Analyze user request → Search for relevant knowledge → If found, LOAD IT:

Run: node .claude/knowledge/scripts/knowledge-search.mjs \\
       --tags [relevant-tags] \\
       --text "[search-text]" \\
       --agent-name user \\
       --agent-id prompt-$(date +%s)

OR use command profile if appropriate:

Run: node .claude/knowledge/scripts/knowledge-search.mjs \\
       --command-profile [profile] \\
       --task-type [type] \\
       --with-deps \\
       --agent-name user \\
       --agent-id prompt-$(date +%s)

Load top 2-4 packages from output.

✅ PROOF REQUIRED: Your response MUST start with:
   "Loaded: [package1], [package2], ..."
   OR "No knowledge needed: [specific reason why no relevant knowledge exists]"

❌ INVALID: "No knowledge needed: Task is [type]" - Task type alone doesn't justify skipping

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER REQUEST:
${userPrompt}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    console.log(transformedPrompt);
    process.exit(0);
  } catch (error) {
    // On any error, pass through the original prompt
    const stdinData = await readStdin();
    console.log(stdinData);
    process.exit(0);
  }
})();
