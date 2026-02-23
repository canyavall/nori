import { Hono } from 'hono';
import { withSSE } from '../sse/emitter.js';
import { getNoriDataDir, getVaultsDir } from '@nori/core';

const app = new Hono();

// App info (data directory paths — used by frontend to show where local vaults are stored)
app.get('/info', (c) => {
  return c.json({ data_dir: getNoriDataDir(), vaults_dir: getVaultsDir() });
});

// Integrity check
app.post('/integrity-check', async (c) => {
  try {
    const { runAppIntegrityCheck } = await import('@nori/core');
    const result = await runAppIntegrityCheck();
    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }
    return c.json({ data: result.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: { code: 'INTEGRITY_CHECK_FAILED', message } }, 500);
  }
});

// Authentication check (SSE)
app.post('/authentication-check', async (c) => {
  return withSSE(c, async (emitter) => {
    const { runAppAuthenticationCheck } = await import('@nori/core');
    const result = await runAppAuthenticationCheck(emitter);
    return result;
  });
});

// Auto-update
app.post('/autoupdate', async (c) => {
  return withSSE(c, async (emitter) => {
    const { runAppAutoupdate } = await import('@nori/core');
    const result = await runAppAutoupdate(emitter);
    return result;
  });
});

export { app as appRoutes };
