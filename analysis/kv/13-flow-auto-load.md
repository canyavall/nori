# Flow: Knowledge Auto-Load on File Operations

> How KV automatically injects knowledge when developers read, edit, or write files.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Tool fires    │────►│  Check tool  │────►│  Extract     │────►│  Pattern     │
│ (Read/Edit/   │     │  type        │     │  file path   │     │  match       │
│  Write)       │     └──────────────┘     └──────────────┘     └──────┬───────┘
└──────────────┘            │ not file op                              │
                            ▼                                         ▼
                      ┌──────────┐                            ┌──────────────┐
                      │ Pass     │                            │  Load &      │
                      │ through  │                            │  inject      │
                      └──────────┘                            └──────────────┘
```

---

## Step 1: PostToolUse Hook Fires

**Event**: Claude Code completes a tool use (Read, Edit, Write, Bash, Glob, Grep, etc.).

**stdin JSON**:
```json
{
  "tool_name": "Read",
  "tool_input": { "file_path": "/Users/me/project/src/components/ProductCard.tsx" },
  "tool_result": "..."
}
```

---

## Step 2: Check Tool Type

**Allowed tools**: `Read`, `Edit`, `Write` only.

All other tools (Bash, Glob, Grep, Task, etc.) → pass through immediately with no action.

```
Read   → proceed
Edit   → proceed
Write  → proceed
Bash   → pass through
Glob   → pass through
Grep   → pass through
```

---

## Step 3: Extract File Path

**From tool input**: `tool_input.file_path` → `/Users/me/project/src/components/ProductCard.tsx`

If no file path can be extracted → pass through.

---

## Step 4: Detect Direct Vault Reads

**Check**: Is the file inside `.claude/kv/vault/` or `.claude/kv/vault-local/`?

If yes:
- Extract package name from filename (without `.md`)
- Extract category from directory path
- Register in session `loaded_packages` to prevent future duplicate injection
- **Do NOT auto-load** (the developer is already reading the vault file directly)

```
/project/.claude/kv/vault/frontend/react-patterns.md
  → package: "react-patterns"
  → category: "frontend"
  → vault type: "shared"
  → registered in loaded_packages
```

---

## Step 5: Check Autoload Exceptions

**From config**: `kv.json` → `vault.autoloadExceptions`

```json
{
  "vault": {
    "autoloadExceptions": [
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/node_modules/**",
      "**/__mocks__/**"
    ]
  }
}
```

If the file path matches any exception pattern → skip auto-load.

---

## Step 6: Pattern Matching

**Load knowledge index** → iterate all packages with `auto_load` patterns.

**Example vault package** (`vault/frontend/react-patterns.md` frontmatter):
```yaml
auto_load:
  - "src/components/**/*.tsx"
  - "src/hooks/**/*.ts"
  - "!**/*.test.tsx"
```

**Matching** (using minimatch):
```
File: src/components/ProductCard.tsx

Pattern "src/components/**/*.tsx" → MATCH
Negation "!**/*.test.tsx"         → not negated (file doesn't end in .test.tsx)

Result: match with package "react-patterns"
```

**Priority scoring**:
```
"src/components/**/*.tsx"   → priority: -20 + 15 + 10 = 5  (2 wildcards, 3 depth, has extension)
"src/**/*.tsx"              → priority: -20 + 10 + 10 = 0  (2 wildcards, 2 depth, has extension)
"**/*.tsx"                  → priority: -20 +  5 + 10 = -5 (2 wildcards, 1 depth, has extension)
```

More specific patterns win.

---

## Step 7: Filter & Limit

**Filter loaded**: Remove packages already in session `loaded_packages`.

**Limit**: Maximum 15 packages per auto-load event, sorted by priority descending.

```
Matched: [react-patterns (5), typescript-basics (3), project-overview (0)]
Already loaded: [project-overview]
After filter: [react-patterns (5), typescript-basics (3)]
After limit (max 15): [react-patterns (5), typescript-basics (3)]
```

---

## Step 8: Load Knowledge Content

**For each matched package**:
1. Read `.md` file from vault
2. Strip YAML frontmatter
3. Format:
   ```markdown
   ## Knowledge: react-patterns (frontend)
   {content without frontmatter}
   ```
4. Update session `loaded_packages`

---

## Step 9: Inject as Additional Context

**Output format**: `hookSpecificOutput.additionalContext`

```json
{
  "hookSpecificOutput": {
    "additionalContext": "## Knowledge: react-patterns (frontend)\n{content}\n\n## Knowledge: typescript-basics (tooling)\n{content}"
  }
}
```

Claude Code appends this to the context. The developer doesn't see it directly, but Claude now has the knowledge for its next response.

---

## Example: Reading a Component File

**Developer asks**: "read ProductCard.tsx"

**Claude uses Read tool** on `src/components/ProductCard.tsx`

**PostToolUse fires**:
1. Tool = Read → allowed
2. File = `src/components/ProductCard.tsx`
3. Not a vault file
4. Not in autoload exceptions
5. Pattern match:
   - `react-patterns`: pattern `src/components/**/*.tsx` → MATCH (priority 5)
   - `css-conventions`: pattern `src/styles/**/*.css` → NO MATCH
   - `typescript-basics`: pattern `src/**/*.ts{,x}` → MATCH (priority 0)
6. Filter: none loaded yet → both pass
7. Limit: 2 < 15 → all pass
8. Load content for both packages
9. Inject as additionalContext

**Result**: Claude now knows React patterns and TypeScript conventions when responding about the ProductCard component.

---

## Example: Editing a Test File (Exception)

**Developer asks**: "update the ProductCard test"

**Claude uses Edit tool** on `src/components/__tests__/ProductCard.test.tsx`

**PostToolUse fires**:
1. Tool = Edit → allowed
2. File = `src/components/__tests__/ProductCard.test.tsx`
3. Not a vault file
4. Autoload exception `**/*.test.tsx` → MATCH
5. **Skip auto-load** → pass through

**Result**: No knowledge injected for test files (configured as exception).

---

## Performance Characteristics

```
Pattern matching:        < 5ms (minimatch against ~50 packages)
Content loading:         < 20ms (file reads + frontmatter stripping)
Session state update:    < 5ms (atomic JSON write)
Total overhead per tool: < 30ms
```

The auto-load happens inline with the PostToolUse hook. Claude Code waits for the hook to complete before rendering the next response.
