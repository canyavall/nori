# Plan 05 — Split Large Hooks (sideHooks Pattern)

**Phase**: 3
**Status**: pending
**Convention violated**: hook-patterns skill — complexity levels and sideHooks extraction pattern

## Problem

- `useKnowledgeDetailSection` — 285 lines handling loading, viewing, editing (SSE), auditing, deleting (SSE), navigation
- `useRepoExtractDialog` — 285 lines handling state machine, SSE conversation, proposals, sequential saves
- Both violate the hook-patterns skill's 200-line limit and complexity level rules

## Tasks

### 5a. Split `useKnowledgeDetailSection` into three sideHooks

```
useKnowledgeDetailSection.hook.ts          # orchestrator, ~60 lines
  ├── useKnowledgeDetailLoad.hook.ts       # onMount fetch, entry state, JSON normalization
  ├── useKnowledgeDetailEdit.hook.ts       # edit mode, SSE save, audit step
  └── useKnowledgeDetailDelete.hook.ts     # delete confirmation, SSE delete, navigation
```

The orchestrator imports all three and composes their return values.

### 5b. Split `useRepoExtractDialog` into two sideHooks

```
useRepoExtractDialog.hook.ts               # orchestrator, ~60 lines
  ├── useRepoExtractConversation.hook.ts   # scanning, SSE, conversation state
  └── useRepoExtractProposals.hook.ts      # proposals editing, save loop
```

### 5c. Fix the `handleSkipQuestions` bug

Current code calls `handleReply()` with empty string (returns early), then sets `userReply()` and calls `handleReply()` again via setTimeout. The first call is dead code.

```typescript
// Fix
function handleSkipQuestions() {
  setUserReply('Please skip the questions and generate proposals with your best judgment.');
  handleReply();
}
```

## Definition of Done

- No hook file exceeds 200 lines
- `handleSkipQuestions` bug is fixed
