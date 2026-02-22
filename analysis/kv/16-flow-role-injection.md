# Flow: Role Injection

> How KV shapes Claude's behavior through role templates and periodic reminders.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Read config   │────►│  Determine   │────►│  Load        │────►│  Format by   │
│ (kv.json)     │     │  active role │     │  template    │     │  prompt count │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Step 1: Read Role Configuration

**From `kv.json`**:
```json
{
  "role": {
    "customRole": null,
    "defaultRole": "staff_engineer"
  }
}
```

---

## Step 2: Determine Active Role

**Precedence chain**:
```
customRole (if set and not null)
  → defaultRole (if set and not null)
    → "staff_engineer" (hardcoded fallback)
```

**Special value**: `"none"` → no role injection at all (returns null).

**Examples**:
```
{ customRole: "tech_lead", defaultRole: "staff_engineer" }  → tech_lead
{ customRole: null, defaultRole: "senior_developer" }        → senior_developer
{ customRole: null, defaultRole: null }                      → staff_engineer
{ customRole: "none" }                                       → null (disabled)
```

---

## Step 3: Load Template

**Location**: `features/role/inject/templates/{roleName}.txt`

**Template content** (example `staff_engineer.txt`):
```
You are a staff-level software engineer with deep expertise in...
[Full role description with behavioral guidelines, quality standards,
code review approach, communication style, etc.]
```

**Discovery**: `listRoles()` scans the templates directory for all available `.txt` files.

If template file not found → return null, skip injection silently.

---

## Step 4: Format Based on Prompt Count

**Decision**:

| Prompt Count | Output | Context Cost |
|-------------|--------|-------------|
| 0 | Full role in `<role>` tags | High (one-time) |
| 1, 2, 3, 4 | Nothing (empty string) | Zero |
| 5 | Brief reminder in `<reminder>` tags | Low |
| 6, 7, 8, 9 | Nothing | Zero |
| 10 | Brief reminder | Low |
| 11, 12, 13, 14 | Nothing | Zero |
| 15 | Brief reminder | Low |
| ... | Pattern continues every 5th | ... |

### Full Role (Prompt 0)
```xml
<role>
You are a staff-level software engineer with deep expertise in...
[Full template content - potentially hundreds of tokens]
</role>
```

### Brief Reminder (Every 5th Prompt)
```xml
<reminder>
You are a staff-level software engineer with deep expertise in...
</reminder>
```

**Brief extraction**: Takes the first line or first sentence of the template. Truncated to ~100 characters with "..." if needed.

### Silent (All Other Prompts)
Empty string. No tokens consumed. This is 80% of all prompts.

---

## Injection Points

### On Session Start
Role injection is called as part of the session start orchestration:
```
runSessionStart()
  └── Step 7: callInjectRole()
        ├── Prompt count = 0 (new session)
        └── Output: <role>full template</role>
```

This is included in the aggregated session context output.

### On User Prompts
Role injection is called as part of prompt transformation:
```
kv-onPrompt.ts
  └── formatRoleOutput(template, promptCount)
        ├── If count % 5 == 0 → <reminder>brief</reminder>
        └── Else → "" (nothing)
```

This is prepended to the user's prompt along with any knowledge content.

---

## Example: Session with Role Drift Prevention

```
Prompt 0:  <role>You are a staff-level software engineer...</role>
           Claude establishes the persona.

Prompt 1:  (no role)  "fix the login bug"
Prompt 2:  (no role)  "yes, looks good"
Prompt 3:  (no role)  "now update the tests"
Prompt 4:  (no role)  "add error handling"

Prompt 5:  <reminder>You are a staff-level software engineer...</reminder>
           Claude gets a nudge back to the role.

Prompt 6:  (no role)  "refactor the auth module"
Prompt 7:  (no role)  "looks good, ship it"
Prompt 8:  (no role)  "what about the database migration"
Prompt 9:  (no role)  "go ahead"

Prompt 10: <reminder>You are a staff-level software engineer...</reminder>
           Another nudge.
```

**Token budget**: If the full template is 500 tokens and a reminder is 50 tokens:
- Per 10 prompts: 500 + 50 = 550 tokens for role
- Without optimization: 5000 tokens (every prompt)
- **Savings: ~89%**

---

## Custom Roles

**To use a custom role**:

1. Create template file: `features/role/inject/templates/my_role.txt`
2. Update config:
   ```json
   { "role": { "customRole": "my_role" } }
   ```
3. Next session start will use the custom role

**To disable roles entirely**:
```json
{ "role": { "customRole": "none" } }
```
