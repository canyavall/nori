import { Router, Request, Response } from 'express';
import { startOAuthFlow, completeOAuthFlow, OAuthSession } from './oauth.js';
import { saveAuthTokens, loadAuthTokens, isTokenExpired, deleteAuthTokens } from './storage.js';

const router = Router();

// In-memory storage for OAuth sessions (cleared on server restart)
const sessions = new Map<string, OAuthSession>();

/**
 * POST /auth/start
 * Start OAuth flow and return authorization URL
 */
router.post('/start', (_req: Request, res: Response) => {
  try {
    const { url, session } = startOAuthFlow();

    // Generate session ID and store session
    const sessionId = Math.random().toString(36).substring(2, 15);
    sessions.set(sessionId, session);

    res.json({
      url,
      sessionId,
    });
  } catch (err) {
    console.error('[Auth] Failed to start OAuth flow:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to start OAuth flow',
    });
  }
});

/**
 * POST /auth/complete
 * Complete OAuth flow with authorization code
 */
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { code, sessionId } = req.body as { code: string; sessionId: string };

    if (!code) {
      res.status(400).json({ error: 'Missing authorization code' });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ error: 'Missing session ID' });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(400).json({ error: 'Invalid or expired session' });
      return;
    }

    // Exchange code for tokens
    const tokens = await completeOAuthFlow(code, session);

    // Save tokens to auth.json
    saveAuthTokens(tokens);

    // Clear session
    sessions.delete(sessionId);

    res.json({
      success: true,
      message: 'Authentication successful',
      expiresIn: tokens.expires_in,
    });
  } catch (err) {
    console.error('[Auth] Failed to complete OAuth flow:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to complete OAuth flow',
    });
  }
});

/**
 * GET /auth/status
 * Check authentication status
 */
router.get('/status', (_req: Request, res: Response) => {
  try {
    const auth = loadAuthTokens();

    if (!auth) {
      res.json({
        authenticated: false,
      });
      return;
    }

    const expired = isTokenExpired(auth);

    res.json({
      authenticated: !expired,
      provider: auth.provider,
      expiresAt: auth.expires_at,
      expired,
    });
  } catch (err) {
    console.error('[Auth] Failed to check status:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to check auth status',
    });
  }
});

/**
 * DELETE /auth/logout
 * Delete authentication tokens
 */
router.delete('/logout', (_req: Request, res: Response) => {
  try {
    deleteAuthTokens();
    res.json({ success: true });
  } catch (err) {
    console.error('[Auth] Failed to logout:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to logout',
    });
  }
});

export default router;
