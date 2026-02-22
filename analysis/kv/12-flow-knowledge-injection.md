# Flow: Knowledge Injection on Prompts

> How KV analyzes user prompts and injects relevant knowledge from the vault.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User sends    │────►│  Increment   │────►│  Trivial     │────►│  Smart Agent │
│ prompt        │     │  prompt count│     │  check       │     │  matching    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                │ trivial            │
                                                ▼                    ▼
                                          ┌──────────┐     ┌──────────────┐
                                          │ Skip      │     │  Load        │
                                          │ (pass-    │     │  knowledge   │
                                          │  through) │     │  content     │
                                          └──────────┘     └──────┬───────┘
                                                                   │
                                                                   ▼
                                                           ┌──────────────┐
                                                           │  Role +      │
                                                           │  transform   │
                                                           │  prompt      │
                                                           └──────────────┘
```

---

## Step 1: Hook Receives Prompt

**Event**: Claude Code emits `UserPromptSubmit`.

`kv-onPrompt.ts` reads stdin JSON containing the user's prompt, checks KV is initialized.

---

## Step 2: Increment Prompt Count

```
Read session state → prompt_count: 7
Increment → prompt_count: 8
Write back to state
```

The count determines role injection behavior and is used for session analytics.

---

## Step 3: Trivial Prompt Check

**Purpose**: Skip the expensive smart agent call for throwaway prompts.

**Decision tree**:
```
"yes"              → trivial (skip)
"go ahead"         → trivial (skip)
"looks good"       → trivial (skip)
""                 → trivial (skip)
"ok"               → trivial (skip)
"fix the auth bug" → NOT trivial (> 20 chars, fast path)
"refactor"         → NOT trivial (single word but > check)
```

**If trivial**: Jump to Step 6 (role-only check, no knowledge injection).

---

## Step 4: Smart Agent Semantic Matching

**What happens**:
1. Load `knowledge.json` index
2. Build category tree string:
   ```
   frontend/
     react-patterns (tags: react, components, hooks)
     css-conventions (tags: css, styling, tailwind)
   backend/
     api-design (tags: rest, graphql, endpoints)
   ```
3. Spawn `smart-agent.mjs` subprocess:
   - Invokes `claude --print --model sonnet`
   - Sends: user prompt + category tree
   - Claude analyzes prompt intent and matches against available packages
4. Parse JSON response:
   ```json
   {
     "packages": ["react-patterns", "api-design"],
     "files": []
   }
   ```

**Timeout**: 15 seconds for Claude API call, 30 seconds total for invocation.

**Max packages**: 10 per smart agent response.

---

## Step 5: Load Knowledge Content

**What happens**:
1. Take matched packages from smart agent: `["react-patterns", "api-design"]`
2. Filter against session `loaded_packages`:
   - `react-patterns` already loaded? → skip
   - `api-design` not loaded? → include
3. For each unloaded package:
   - Read `.md` file from vault
   - Strip YAML frontmatter (everything between `---` markers)
   - Format as:
     ```markdown
     ## Knowledge: api-design (backend)
     {content without frontmatter}
     ```
4. Update session `loaded_packages`: `["...", "api-design"]`

---

## Step 6: Role Injection Check

**Decision based on prompt count**:

```
Count = 0:  Full role     → <role>{full template}</role>
Count = 5:  Brief reminder → <reminder>{first line}</reminder>
Count = 10: Brief reminder → <reminder>{first line}</reminder>
Count = 8:  Nothing       → ""
Count = 13: Nothing       → ""
```

**Every 5th prompt** (0, 5, 10, 15, 20...): injection fires.
**All other prompts**: silent (80% savings on context tokens).

---

## Step 7: Build Transformed Prompt

**Assembly**:
```
{knowledge content}              ← from Step 5
{role reminder}                  ← from Step 6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{original user prompt}           ← untouched
```

**Output**: The transformed prompt replaces the original in Claude's processing pipeline. Claude sees the knowledge and role context as part of the prompt, then responds to the user's actual request below the separator.

---

## Example: Complete Prompt Flow

**User types**: "add pagination to the products API endpoint"

**Step 2**: prompt_count: 7 → 8

**Step 3**: Length > 20 → not trivial

**Step 4**: Smart agent matches → `["api-design", "database-patterns"]`

**Step 5**:
- `api-design` already loaded (from earlier prompt) → skip
- `database-patterns` not loaded → load content

**Step 6**: Count 8, not divisible by 5 → no role injection

**Step 7**: Output to Claude:
```
## Knowledge: database-patterns (backend)
Query optimization patterns for the project database...
[content from vault/backend/database-patterns.md]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

add pagination to the products API endpoint
```

---

## Edge Cases

### Trivial prompt at reminder interval
User types "yes" at prompt count 10:
- Trivial → smart agent skipped
- Count 10 % 5 == 0 → role reminder injected
- Output: role reminder only, no knowledge

### Smart agent timeout
If Claude API takes > 15s:
- Smart agent returns empty result
- Fall through to role-only injection
- Event logged with timeout status

### All packages already loaded
If smart agent matches packages that are all already loaded:
- No knowledge content injected
- Role injection still fires if at interval
- Minimal token overhead
