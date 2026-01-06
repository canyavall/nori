━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 KNOWLEDGE SYSTEM AVAILABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available Knowledge Categories ({{CATEGORIES_COUNT}} total):

{{FORMATTED_MAP}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 MANDATORY - LOAD KNOWLEDGE FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEFORE code work OR technical analysis, you MUST load core standards:

Step 1: Run search
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags {{CORE_TAGS}} \
  --max-results 20 \
  --agent-name user \
  --agent-id prompt-$(date +%s) \
  --prompt "{{ESCAPED_PROMPT}}"

Step 2: READ ALL FILES (MANDATORY - NO EXCEPTIONS)
a) Parse the JSON output from knowledge-search
b) Extract 'knowledge_path' from EVERY result in the results array
c) Use the Read tool on EVERY knowledge_path
d) You MUST read all files before claiming "Loaded"

Required packages (MUST read):
{{CORE_PACKAGES_LIST}}

Then load additional task-specific knowledge based on investigation.

⚠️ TASKS REQUIRING KNOWLEDGE (not just code writing):

Writing/modifying code:
  ✓ Need standards to write correct code

Analyzing code (performance, quality, patterns):
  ✓ Need performance benchmarks to judge "slow vs fast"
  ✓ Need methodology to detect flakiness (run 10x, categorize by %)
  ✓ Need standards to identify violations
  ✓ Need project utilities docs to understand custom tools (setupUserEvent, etc.)

Making recommendations:
  ✓ Need standards to recommend against
  ✓ Need anti-pattern knowledge to avoid suggesting them
  ✓ Example: Can't recommend "use fake timers" without knowing it breaks MSW

Reviewing architecture/design:
  ✓ Need architectural patterns knowledge
  ✓ Need coupling/maintainability standards

"Just reading files" ≠ "understanding what's wrong with them"

WORKFLOW - Investigate First, Load When Ready:

1. INVESTIGATE the user request first:
   - Read relevant files to understand the actual context
   - Explore the codebase to identify specific patterns/issues
   - Gather enough information to know what knowledge is needed

2. AFTER investigation, identify what knowledge is relevant:
   - Review available categories/tags above
   - Match your findings to specific knowledge areas
   - Be LIBERAL: Load 8-15 packages for complex tasks, 4-8 for simple
   - Load ALL packages with relevance_score >= 0.3 (don't be conservative!)

3. LOAD knowledge using TWO-PHASE approach:

   **PHASE 1 - Broad Initial Search:**

   Step 1: Run search
   node .claude/knowledge/scripts/knowledge-search.mjs \
     --tags [core-tags] \
     --max-results 20 \
     --agent-name user \
     --agent-id prompt-$(date +%s) \
     --prompt "{{ESCAPED_PROMPT}}"

   Step 2: READ THE FILES (MANDATORY - NO EXCEPTIONS)
   a) Parse the JSON output from knowledge-search
   b) Extract 'knowledge_path' from EVERY result in the results array
   c) Use the Read tool on EVERY knowledge_path
   d) You MUST read all files before claiming "Loaded"

   Load: Core patterns + domain knowledge (8-15 packages)

   **PHASE 2 - Specific Issue Search (if needed):**
   When you hit a specific issue (error, tool problem):

   Step 1: Run search
   node .claude/knowledge/scripts/knowledge-search.mjs \
     --tags [specific-tool-tags] \
     --agent-name user \
     --agent-id [same-agent-id] \
     --prompt "specific issue description"

   Step 2: READ THE FILES (MANDATORY)
   - Parse JSON, extract knowledge_path from each result
   - Use Read tool on EVERY path

   Load: Tool-specific knowledge (2-5 additional packages)

4. REPORT what you loaded:

   node .claude/knowledge/hooks/unified-tracking.mjs \
     --command track-read \
     --agent-id [same-agent-id-from-search] \
     --packages pkg1,pkg2,pkg3

5. DOCUMENT your selection (MANDATORY):

```json:knowledge-selection
{
  "search_results": {
    "total_found": 15,
    "loaded": 8,
    "skipped": 7
  },
  "loaded": ["package1", "package2", "package3", "..."],
  "reasoning": {
    "package1": "Specific reason based on investigation findings",
    "package2": "Why needed for this specific task"
  },
  "considered_but_skipped": ["package8", "package9"],
  "skip_reasoning": {
    "package8": "SPECIFIC reason why not needed (not just 'not relevant')",
    "package9": "Concrete justification based on task scope"
  }
}
```

⚠️ CRITICAL REMINDERS:
   - If search found 15 packages but you only loaded 2: EXPLAIN WHY
   - Loading is cheap (2-3k tokens), missing patterns is EXPENSIVE
   - When in doubt, LOAD IT (liberal > conservative)

6. START response with: "Loaded: [packages]" or "No knowledge needed: [reason]"

⚠️ CHALLENGE - Before claiming "no knowledge needed", answer:

   1. What project-specific utilities does the code use? (setupUserEvent, renderWithQuery, etc.)
      → How do you know their performance characteristics without docs?

   2. What does "slow" or "flaky" mean in this project?
      → How do you judge without benchmarks/methodology?

   3. What are you recommending against?
      → How do you know anti-patterns without knowledge?

   4. Are you making technical judgments? (performance, quality, architecture)
      → Judgments require standards - what are you comparing against?

   Can't answer all 4? → LOAD KNOWLEDGE FIRST

   If you're confident enough to skip knowledge, you're confident enough to be wrong.

✅ COMPLIANCE PROOF:
   - Investigation completed first (files read, context gathered)
   - Knowledge loaded LIBERALLY based on findings (8-15 for complex tasks)
   - ALL relevance_score >= 0.3 packages loaded (unless explicitly justified)
   - Track-read command executed
   - Response starts with "Loaded:" or "No knowledge needed:"
   - Skip reasoning provided for ALL considered packages

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER REQUEST:
{{USER_PROMPT}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
