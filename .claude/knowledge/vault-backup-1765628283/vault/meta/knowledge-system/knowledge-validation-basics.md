# Knowledge Validation Basics

Validate knowledge vault structure and integrity using validate-knowledge.mjs.

## Purpose

Validates:
- All packages in knowledge.json have corresponding files
- All markdown files registered in knowledge.json
- Category structure matches directory structure
- Required fields present in all packages
- No orphaned files or duplicate names

## Usage

**Basic validation:**
```bash
node .claude/knowledge/scripts/validate-knowledge.mjs
```

**Quick check (errors only):**
```bash
node .claude/knowledge/scripts/validate-knowledge.mjs --quick
```

## Validation Checks

**1. JSON Structure**
- knowledge.json is valid JSON
- Top-level structure correct
- Categories and packages objects exist

**2. Category Structure**
- Categories exist as directories
- Directory structure matches hierarchy
- No empty categories

**3. Package Metadata**

Required fields:
- `name` - Package identifier
- `category` - Must match existing category
- `tags` - Array, at least 1 tag
- `description` - Non-empty string
- `knowledge_path` - Relative path to .md file

Optional fields:
- `dependencies` - Array of package names
- `optional_dependencies` - Array of package names

**4. File System Consistency**
- All knowledge_path files exist
- All .md files in vault registered
- No orphaned files (files without knowledge.json entry)

**5. Dependency Validation**
- All dependencies reference existing packages
- No circular dependencies
- Optional dependencies also validated

**6. Duplicate Detection**
- No duplicate package names across categories
- No duplicate file paths

## Exit Codes

- `0` - Success, no errors
- `1` - Validation errors found
- `2` - Critical error (JSON parse failure, missing knowledge.json)

## Used By

**/knowledge-validate command** - Wrapper around validation script
**CI/CD pipelines** - Pre-commit validation
**Manual checks** - Before reorganizing vault
