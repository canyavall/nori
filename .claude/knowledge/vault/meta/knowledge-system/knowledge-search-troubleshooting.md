---
tags:
  - knowledge-system
  - search
  - troubleshooting
description: Common issues and examples for knowledge search
category: meta/knowledge-system
required_knowledge: []
---
# Knowledge Search Troubleshooting

Common issues and solutions when using knowledge-search.mjs.

## 0 Results Returned

**Investigation protocol:**
1. Remove restrictive filters (--text, --category)
2. Try single tag instead of multiple
3. List available tags: `--list-tags`
4. Check tag spelling

**Common causes:**
- Too many filters (AND logic too restrictive)
- Typo in tag name
- Wrong category

## Wrong Packages Returned

**Diagnosis:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags testing \
  --file-path src/UserService.java

# Check: "detected_domain" and "detected_language" in output
```

**Solutions:**
- Verify file path is correct
- Check packages have correct domain/language tags
- Use `--category` to override auto-detection

## Token Estimate Seems Wrong

**Cause:** Estimation is rough (chars ÷ 4), not precise.

**Solution:** Use as guideline only. Actual tokens from Claude's tokenizer.

## Examples

**Frontend routing task:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags routing,react-router,permissions \
  --file-path src/pages/Dashboard.tsx \
  --agent-name user \
  --agent-id "prompt-1733742000"
# Result: React Router + permission packages (frontend)
```

**Backend testing:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags testing,nestjs,mocking \
  --category backend-node/testing \
  --agent-name user \
  --agent-id "prompt-1733742060"
# Result: NestJS testing packages (backend)
```

**Generic standards:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags api-contracts,openapi \
  --agent-name research \
  --agent-id "research-123"
# Result: OpenAPI/API contract standards (cross-cutting)
```

**Discovery:**
```bash
# What routing knowledge exists?
node .claude/knowledge/scripts/knowledge-search.mjs --list-tags | grep routing
# Tags: routing, routing-structure, react-router, app-routes

# Search all routing
node .claude/knowledge/scripts/knowledge-search.mjs --tags routing
# Result: All routing packages across categories
```
