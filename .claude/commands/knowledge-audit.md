# Knowledge Audit Command

Audit knowledge by folder to identify reshaping opportunities.

## Audit by Folder (Recommended)

Analyze ALL packages in a folder together to find reshaping opportunities:

1. **List all files in folder** (with line counts)
2. **Read all packages** in the folder
3. **Cross-file analysis:**
   - Overlapping content across files
   - Natural groupings by topic
   - Split opportunities (>120 lines)
   - Merge opportunities (<30 lines + related)
   - Duplicate patterns
4. **Folder-level recommendations:**
   - Propose specific file restructuring
   - Show before/after structure
   - Ensure all files ≤120 lines after changes

## Assessment Criteria

**Per package:**
- **Generic vs Specific**: Project rules or standard knowledge?
- **Code Impact**: Would code differ without this?
- **Duplication**: Covered elsewhere?
- **Actionability**: Specific and actionable?
- **Line count**: Respects ≤120 limit?

**Grading:**
- **CRITICAL** (9-10): Project-specific, definitely changes code
- **VALUABLE** (7-8): Important patterns, likely changes code
- **USEFUL** (5-6): Helpful reminders, might change code
- **GENERIC** (3-4): Standard knowledge, rarely changes code
- **REDUNDANT** (1-2): Duplicate or already covered

**Actions:**
- **KEEP**: High value, no changes
- **IMPROVE**: Needs editing (show specifics)
- **MERGE**: Combine related files (verify ≤120 lines total)
- **SIMPLIFY**: Remove generic, keep project-specific
- **SPLIT**: >120 lines - break into focused files
- **DELETE**: No value, safe to remove

## Folder Output

```markdown
# Folder Audit: {folder-path}

| File | Lines | Grade | Issue |
|------|-------|-------|-------|
| file1.md | 85 | VALUABLE | None |
| file2.md | 145 | USEFUL | SPLIT (>120) |
| file3.md | 25 | GENERIC | MERGE candidate |

**Overlaps:** Topics X,Y in multiple files
**Groupings:** Files A+B related, Files C+D same stack

**Restructuring:**
- MERGE file3+file4 → combined.md (95 lines)
- SPLIT file2 → part1.md (70), part2.md (75)
- DELETE file5 (redundant)
- KEEP file1 (high value)

**Impact:** X files → Y files, all ≤120 lines
```

## Single Package Output

```markdown
# Audit: {package-name}
**File:** {path} ({lines} lines) | Grade: {score}/10 | {ACTION}
**Assessment:** [generic vs specific, code impact, duplication]
**Action:** [specific steps]
```

## Usage

```bash
# Audit folder (RECOMMENDED)
/knowledge-audit --folder .claude/knowledge/vault/frontend/core/react

# Audit category (all packages)
/knowledge-audit --category frontend/core/react

# Audit single package
/knowledge-audit react-hooks

# Audit multiple packages
/knowledge-audit react-hooks typescript-types nx-commands
```

## After Assessment

For DELETE recommendations:
1. Show dependencies (if any)
2. Ask user confirmation
3. If confirmed: delete file + update knowledge.json

For MERGE/SPLIT:
1. Show proposed new structure
2. Ask user confirmation
3. Execute reshaping

## Quality Rules

- Project-specific conventions = high value
- Generic advice = low value (already known)
- **All files MUST be ≤120 lines**
- Files <30 lines should merge if related
- Be brutally honest in assessment
