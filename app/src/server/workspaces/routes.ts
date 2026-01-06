import { Router, Request, Response } from 'express';
import {
  getAllWorkspaces,
  createWorkspace,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
} from '../db/workspaces.js';
import { existsSync, statSync } from 'fs';
import { resolve, basename } from 'path';

const router = Router();

/**
 * GET /workspaces
 * List all workspaces
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const workspaces = getAllWorkspaces();
    res.json(workspaces);
  } catch (err) {
    console.error('[Workspaces] Failed to list workspaces:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list workspaces' });
  }
});

/**
 * POST /workspaces
 * Create new workspace
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { path, vault } = req.body as { path: string; vault?: string };

    if (!path) {
      res.status(400).json({ error: 'Missing path parameter' });
      return;
    }

    // Validate path
    if (!existsSync(path)) {
      res.status(400).json({ error: `Folder does not exist: ${path}` });
      return;
    }

    const stats = statSync(path);
    if (!stats.isDirectory()) {
      res.status(400).json({ error: `Path is not a directory: ${path}` });
      return;
    }

    const canonicalPath = resolve(path);
    const name = basename(canonicalPath);

    const workspace = createWorkspace(name, canonicalPath, vault, undefined);
    res.json(workspace);
  } catch (err) {
    console.error('[Workspaces] Failed to create workspace:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to create workspace' });
  }
});

/**
 * GET /workspaces/active
 * Get active workspace
 */
router.get('/active', (_req: Request, res: Response) => {
  try {
    const activeId = getActiveWorkspaceId();

    if (!activeId) {
      res.json(null);
      return;
    }

    const workspace = getWorkspaceById(activeId);
    res.json(workspace || null);
  } catch (err) {
    console.error('[Workspaces] Failed to get active workspace:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get active workspace' });
  }
});

/**
 * POST /workspaces/active
 * Set active workspace
 */
router.post('/active', (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.body as { workspaceId: number };

    if (!workspaceId) {
      res.status(400).json({ error: 'Missing workspaceId parameter' });
      return;
    }

    const workspace = getWorkspaceById(workspaceId);
    if (!workspace) {
      res.status(404).json({ error: `Workspace not found: ${workspaceId}` });
      return;
    }

    const now = Date.now();
    updateWorkspace(workspaceId, { last_opened_at: now });
    setActiveWorkspaceId(workspaceId);

    res.json({ success: true });
  } catch (err) {
    console.error('[Workspaces] Failed to set active workspace:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to set active workspace' });
  }
});

/**
 * DELETE /workspaces/:id
 * Delete workspace
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid workspace ID' });
      return;
    }

    deleteWorkspace(id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Workspaces] Failed to delete workspace:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete workspace' });
  }
});

export default router;
