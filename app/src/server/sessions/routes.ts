import { Router, Request, Response } from 'express';
import { saveSession, loadSession, getAllSessions, deleteSession } from '../db/sessions.js';
import { Message } from '../db/types.js';

const router = Router();

/**
 * GET /sessions
 * Get all sessions (optionally filtered by role)
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { role } = req.query as { role?: string };
    const sessions = getAllSessions(role);
    res.json(sessions);
  } catch (err) {
    console.error('[Sessions] Failed to get sessions:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get sessions' });
  }
});

/**
 * GET /sessions/:id
 * Load session with messages
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = loadSession(id);

    if (!result) {
      res.status(404).json({ error: `Session not found: ${id}` });
      return;
    }

    res.json(result);
  } catch (err) {
    console.error('[Sessions] Failed to load session:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load session' });
  }
});

/**
 * POST /sessions
 * Save session with messages
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { sessionId, role, title, messages } = req.body as {
      sessionId: string;
      role: string;
      title: string;
      messages: Omit<Message, 'session_id'>[];
    };

    if (!sessionId || !role || !title || !messages) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    saveSession(sessionId, role, title, messages);
    res.json({ success: true });
  } catch (err) {
    console.error('[Sessions] Failed to save session:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to save session' });
  }
});

/**
 * DELETE /sessions/:id
 * Delete session
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    deleteSession(id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Sessions] Failed to delete session:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete session' });
  }
});

export default router;
