# Knowledge Validation Troubleshooting

Common validation issues and how to fix them.

## Common Issues

### Orphaned Files

**Error:**
```
⚠️  WARNING: Orphaned file (not in knowledge.json): .claude/knowledge/vault/frontend/testing/legacy-test.md
```

**Solutions:**
1. Add to knowledge.json if it's valid knowledge
2. Delete if it's obsolete/temporary
3. Rename if it's a work-in-progress (_TODO.md suffix)

### Missing Files

**Error:**
```
❌ ERROR: File not found: .claude/knowledge/vault/frontend/routing/react-router-basics.md
```

**Solutions:**
1. Create missing file
2. Fix knowledge_path in knowledge.json
3. Remove package from knowledge.json if obsolete

### Category Mismatch

**Error:**
```
❌ ERROR: Package 'react-router-basics' category='frontend/routing' but file is in 'frontend/navigation'
```

**Fix:**
- Update `category` in knowledge.json to match actual directory, OR
- Move file to correct directory

### Missing Required Fields

**Error:**
```
❌ ERROR: Package 'testing-core' missing required field: tags
```

**Fix:** Add all required fields to knowledge.json:
```json
{
  "name": "testing-core",
  "category": "frontend/testing",
  "tags": ["testing", "jest", "core"],
  "description": "Core testing patterns",
  "knowledge_path": ".claude/knowledge/vault/frontend/testing/testing-core.md"
}
```

### Duplicate Package Names

**Error:**
```
❌ ERROR: Duplicate package name: 'api-patterns' in categories 'frontend/api' and 'backend-node/api'
```

**Fix:** Rename one package to be more specific:
- `frontend-api-patterns` vs `backend-api-patterns`
- `api-client-patterns` vs `api-server-patterns`

## Best Practices

```bash
# Before committing
node .claude/knowledge/scripts/validate-knowledge.mjs

# After reorganization
node .claude/knowledge/scripts/validate-knowledge.mjs --quick

# Weekly check for orphans
node .claude/knowledge/scripts/validate-knowledge.mjs | grep "Orphaned"
```

**CI/CD:** Add validation to pre-commit hooks or GitHub Actions workflow.
