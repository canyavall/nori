import { Router, Request, Response } from 'express';
import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { saveActiveRole, loadActiveRole } from '../db/roles.js';

const router = Router();

/**
 * GET /roles/personality/:role
 * Load personality template for given role
 */
router.get('/personality/:role', (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    const personalityPath = join(homedir(), '.nori', 'personalities', `${role}.txt`);

    if (!existsSync(personalityPath)) {
      res.status(404).json({ error: `Personality file not found for role: ${role}` });
      return;
    }

    const content = readFileSync(personalityPath, 'utf-8');
    res.json({ content });
  } catch (err) {
    console.error('[Roles] Failed to load personality:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load personality' });
  }
});

/**
 * GET /roles/active
 * Get active role
 */
router.get('/active', (_req: Request, res: Response) => {
  try {
    const role = loadActiveRole();
    res.json({ role });
  } catch (err) {
    console.error('[Roles] Failed to get active role:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get active role' });
  }
});

/**
 * POST /roles/active
 * Set active role
 */
router.post('/active', (req: Request, res: Response) => {
  try {
    const { role } = req.body as { role: string };

    if (!role) {
      res.status(400).json({ error: 'Missing role parameter' });
      return;
    }

    saveActiveRole(role);
    res.json({ success: true });
  } catch (err) {
    console.error('[Roles] Failed to save active role:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to save active role' });
  }
});

export default router;
