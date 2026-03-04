# Plan 03 — Wire the Audit Stub

**Phase**: 2
**Status**: pending

## Problem

`knowledge-create/actions/audit-knowledge.ts` always returns `{ audit_passed: true }`. The real audit flow exists at `knowledge-audit/knowledge-audit.ts`. The step JSON claims auditing happens — it doesn't. `check-ai-originality.ts` is also a stub.

## Tasks

### 3a. Wire `audit-knowledge.ts` to call `runKnowledgeAudit()`

```typescript
export async function auditKnowledge(
  entryId: string,
  filePath: string
): Promise<StepResult<AuditResult> | FlowError> {
  const result = await runKnowledgeAudit({ file_path: filePath });
  if (!result.success) return result;
  return {
    success: true,
    data: {
      audit_passed: result.data.status === 'pass',
      findings_count: result.data.findings.length,
    },
  };
}
```

### 3b. Decide on `check-ai-originality.ts`

Two valid options — pick one:
- **Option A**: Mark as intentionally deferred with `// STUB(v2): LLM-based AI originality check` + note in flow CLAUDE.md
- **Option B**: Implement a heuristic v1 (pattern matching for common AI phrases)

### 3c. Add `## Known Stubs` section to affected CLAUDE.md files

Each flow CLAUDE.md lists functions not yet implemented and the version they're planned for.

## Definition of Done

- `runKnowledgeCreate` triggers a real audit
- Remaining stubs are explicitly documented in the relevant CLAUDE.md
