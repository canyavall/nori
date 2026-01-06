# Implementation Plan: Epic 0006

## Tasks

### TASK-001: Create Homepage Component
**Status:** ✅ Complete
**Description:** Build Homepage component with workspace selector embedded

**Implementation:**
1. Create `app/src/pages/Homepage.tsx`
2. Use ProjectList and CreateProjectModal components
3. Layout: centered, similar to ProjectSelector but as page content
4. Props: none (reads from store directly)
5. Shows empty state if no workspaces

**Files:**
- `app/src/pages/Homepage.tsx` (new)

---

### TASK-002: Modify App.tsx Routing Logic
**Status:** ✅ Complete
**Description:** Change App.tsx to show homepage instead of blocking modal

**Implementation:**
1. Remove `if (!activeWorkspace) return <ProjectSelector />`
2. Add conditional: render Homepage when no workspace
3. Keep existing app UI when workspace selected
4. Ensure header/tabs only show with active workspace

**Files:**
- `app/src/App.tsx` (modify)

**Changes:**
```tsx
// Before:
if (!activeWorkspace) {
  return <ProjectSelector />;
}

// After:
if (!activeWorkspace) {
  return <Homepage />;
}
```

---

### TASK-003: Update ProjectSelector Component
**Status:** ✅ Complete (Deleted)
**Description:** Refactor ProjectSelector for reuse or deprecation

**Decision needed:**
- Option A: Keep ProjectSelector, extract shared logic
- Option B: Deprecate ProjectSelector, move all logic to Homepage
- **Recommendation:** Option B (simpler, no duplication)

**Implementation (Option B):**
1. Move ProjectSelector logic to Homepage
2. Delete `app/src/components/projects/ProjectSelector.tsx`
3. Update any imports

**Files:**
- `app/src/components/projects/ProjectSelector.tsx` (delete)
- `app/src/pages/Homepage.tsx` (absorb logic)

---

### TASK-004: Test Workspace Selection Flow
**Status:** ✅ Complete
**Description:** Verify complete workspace selection UX

**Test scenarios:**
1. **No workspaces:** ✅ Verified
   - Opens to homepage
   - Shows "Link Workspace" button
   - No workspace list
   - Clicking "Link Workspace" opens modal
   - Creating workspace sets it as active
   - App shows normal UI

2. **Existing workspaces:** ✅ Verified
   - Opens to homepage
   - Shows workspace list
   - Clicking workspace sets it active
   - App shows normal UI with tabs

3. **Active workspace:** ✅ Verified
   - App opens directly to workspace UI
   - No homepage shown

**Testing Results:**
- User confirmed: "it worked, check files and everything was properly created"
- Database created: `~/.nori/nori.db` (53KB)
- Directory structure initialized successfully
- Knowledge files copied (268KB)
- Workspace linking flow fully functional

---

## Dependencies
- None (all changes isolated to App.tsx and new Homepage)

## Implementation Order
1. TASK-001 (Create Homepage)
2. TASK-002 (Modify App.tsx)
3. TASK-003 (Cleanup ProjectSelector)
4. TASK-004 (Test flow)

## Estimated Effort
- 30-45 minutes total
- Each task: ~10 minutes

---

## Epic Completion Summary

**Status:** ✅ Complete
**Completed:** 2026-01-03

All tasks successfully implemented and tested:

1. ✅ Created Homepage component with embedded workspace selector
2. ✅ Modified App.tsx to remove blocking workspace modal
3. ✅ Removed deprecated ProjectSelector component
4. ✅ Verified complete workspace selection flow

**Key Changes:**
- Homepage now shows on startup instead of blocking modal
- Users can browse workspaces or link new ones from homepage
- Header remains visible throughout the app
- Workspace creation fully functional with dialog permissions
- Database and directory structure properly initialized

**Files Modified:**
- `app/src/pages/Homepage.tsx` (new)
- `app/src/App.tsx`
- `app/src-tauri/tauri.conf.json`
- `app/src-tauri/src/workspaces/commands.rs`
- `app/src/stores/projectStore.ts`
- `app/src/components/projects/CreateProjectModal.tsx`

**Files Deleted:**
- `app/src/components/projects/ProjectSelector.tsx`
