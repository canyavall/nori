import type { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { FlowEmitter } from '@nori/shared';

export function withSSE(
  c: Context,
  handler: (emitter: FlowEmitter) => Promise<unknown>
) {
  return streamSSE(c, async (stream) => {
    let id = 0;

    const emitter: FlowEmitter = {
      emit: (event, data) => {
        stream.writeSSE({
          id: String(id++),
          event,
          data: JSON.stringify(data ?? {}),
        });
      },
    };

    try {
      const result = await handler(emitter);
      await stream.writeSSE({
        id: String(id++),
        event: 'result',
        data: JSON.stringify(result),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await stream.writeSSE({
        id: String(id++),
        event: 'error',
        data: JSON.stringify({ error: message }),
      });
    }
  });
}
