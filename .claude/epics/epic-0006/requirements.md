# Epic 0006: Remove Blocking Workspace Selection

## Status
✅ Complete (2026-01-03)

## Overview
Remove the blocking workspace selection screen and show homepage with workspace options instead.

## Business Context
**Current behavior:**
- App blocks on full-screen ProjectSelector modal
- User must select workspace before accessing any features
- Forces decision upfront, poor UX

**Desired behavior:**
- App opens to homepage immediately
- Workspace selector embedded in homepage layout
- User can browse, select workspace, or link new one
- No blocking modal

## Requirements

### Functional
1. Remove blocking ProjectSelector render from App.tsx
2. Create Homepage component showing:
   - Welcome message
   - List of available workspaces (if any)
   - "Link Workspace" button
   - Empty state if no workspaces
3. Allow app to render without active workspace
4. Clicking workspace from homepage sets it as active
5. Workspace tabs only show when workspace is selected

### Non-Functional
- Maintain existing workspace store logic
- Reuse ProjectList and CreateProjectModal components
- No routing library needed (keep single-page architecture)
- Smooth transition when workspace selected

### Out of Scope
- Adding react-router
- Multi-workspace support (still single active workspace)
- Workspace switching UI in header (future epic)

## Success Criteria
- [x] App opens to homepage without blocking
- [x] User can see workspace list on homepage
- [x] User can link new workspace from homepage
- [x] Selecting workspace shows normal app UI
- [x] No workspace selected = homepage visible
- [x] Existing workspace functionality unchanged

## Verification
User testing confirmed all functionality working:
- Database created: `~/.nori/nori.db` (53KB)
- Directory structure initialized successfully
- Workspace linking flow fully functional
- Quote: "it worked, check files and everything was properly created"

## Technical Approach
Modify `App.tsx` to show homepage layout instead of conditional render:
- Remove `if (!activeWorkspace) return <ProjectSelector />`
- Render homepage component when no workspace
- Show normal app UI when workspace selected
- Reuse existing components (ProjectList, CreateProjectModal)
