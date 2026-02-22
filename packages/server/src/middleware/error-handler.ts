import type { Context, Next } from 'hono';
import { ZodError } from 'zod';

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    if (err instanceof ZodError) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: err.flatten().fieldErrors,
          },
        },
        400
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    console.error('[server] Unhandled error:', message);

    return c.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
        },
      },
      500
    );
  }
}
