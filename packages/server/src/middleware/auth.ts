import type { Context, Next } from 'hono';

const NORI_API_TOKEN = process.env.NORI_API_TOKEN;

/**
 * Authentication middleware.
 * If NORI_API_TOKEN is set, requires a matching Authorization header.
 * If not set (development mode), all requests are allowed.
 */
export async function authMiddleware(c: Context, next: Next) {
  if (!NORI_API_TOKEN) {
    // No token configured — development mode, allow all
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json(
      { error: { code: 'UNAUTHORIZED', message: 'Missing Authorization header' } },
      401
    );
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (token !== NORI_API_TOKEN) {
    return c.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid API token' } },
      401
    );
  }

  await next();
}
