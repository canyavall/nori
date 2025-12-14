# Knowledge Search Filtering

Advanced domain and language filtering in knowledge-search.mjs.

## Domain Filtering

**Auto-detection from file path:**
```bash
# Frontend file
--file-path src/components/Button.tsx
# Detected: domain=frontend, language=typescript
# Result: Frontend packages only (backend=score 0)

# Backend file
--file-path src/services/UserService.java
# Detected: domain=backend, language=java
# Result: Backend packages only (frontend=score 0)
```

**Manual override:**
```bash
--category backend-node --tags testing
# Forces backend domain
```

## Language Filtering

**Auto-detection from extension:**
- `.ts`, `.tsx` → TypeScript
- `.js`, `.jsx` → JavaScript
- `.java` → Java
- `.py` → Python
- `.go` → Go
- `.tf` → Terraform

**Example:**
```bash
--file-path src/UserService.java --tags testing
# Detected: Java
# Result: Java testing packages (NOT Jest/TypeScript)
```

## Hard Filtering Rules

**Wrong domain = score 0** (hard reject):
- Frontend file + backend package → Rejected
- Backend file + frontend package → Rejected
- Infrastructure file + frontend/backend → Rejected

**Wrong language = score 0** (hard reject):
- Java file + TypeScript standards → Rejected
- TypeScript file + Java standards → Rejected
- Generic standards (testing, mocks) → Allowed all

## Context-Aware Examples

**Frontend TypeScript:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags testing,jest \
  --file-path src/components/Button.test.tsx
# Result: Jest + React Testing Library
```

**Backend Java:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags testing,mocking \
  --file-path src/main/java/UserService.java
# Result: JUnit + Mockito (NOT Jest)
```

**Cross-cutting (no file path):**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs --tags testing
# Result: Standards and cross-cutting patterns (higher priority)
```
