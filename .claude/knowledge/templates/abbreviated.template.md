━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Knowledge System Available

Categories with tags were shown in first prompt. Refer to that list.

🚨 MANDATORY: Load knowledge BEFORE code work OR technical analysis

   Step 1: Run search
   node .claude/knowledge/scripts/knowledge-search.mjs \
     --tags {{CORE_TAGS}} \
     --max-results 20 \
     --agent-name user \
     --agent-id prompt-$(date +%s) \
     --prompt "{{ESCAPED_PROMPT}}"

   Step 2: READ ALL FILES (MANDATORY)
   - Parse JSON output
   - Extract knowledge_path from EVERY result
   - Use Read tool on EVERY path
   - NO EXCEPTIONS

   Required: {{CORE_PACKAGES}}

⚠️ TASKS REQUIRING KNOWLEDGE:

Writing/modifying code:
  ✓ Need standards to write correct code

Analyzing code (performance, quality, patterns):
  ✓ Need performance benchmarks to judge "slow vs fast"
  ✓ Need methodology to detect flakiness
  ✓ Need standards to identify violations
  ✓ Need project utilities docs to understand custom tools

Making recommendations:
  ✓ Need standards to recommend against
  ✓ Need anti-pattern knowledge to avoid suggesting them

Reviewing architecture/design:
  ✓ Need architectural patterns
  ✓ Need coupling/maintainability standards

"Just reading files" ≠ "understanding what's wrong with them"

Workflow: Investigate first → Load targeted knowledge when ready

Load knowledge AFTER investigation:

  Step 1: Run search
  node .claude/knowledge/scripts/knowledge-search.mjs \
    --tags [tag1,tag2] \
    --agent-name user \
    --agent-id prompt-$(date +%s) \
    --prompt "{{ESCAPED_PROMPT}}"

  Step 2: READ ALL FILES
  - Parse JSON, extract knowledge_path, Read every file

Report what you loaded:
  node .claude/knowledge/hooks/unified-tracking.mjs \
    --command track-read \
    --agent-id [same-id] \
    --packages pkg1,pkg2,pkg3

⚠️ LOADING STRATEGY:
   - Complex tasks: Load 8-15 packages
   - Simple tasks: Load 4-8 packages
   - Load ALL relevance_score >= 0.3 (don't be conservative!)
   - Document WHY you skipped packages (not just "not relevant")

✅ Start response with: "Loaded: [packages]" or "No knowledge needed: [reason]"

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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER REQUEST:
{{USER_PROMPT}}
