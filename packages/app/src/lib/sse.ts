import { NORI_SERVER_PORT } from '@nori/shared';

const BASE_URL = `http://localhost:${NORI_SERVER_PORT}`;

export interface SSECallbacks {
  onEvent: (event: string, data: Record<string, unknown>) => void;
  onResult: (data: unknown) => void;
  onError: (error: string) => void;
}

export function connectSSE(
  path: string,
  body: unknown,
  callbacks: SSECallbacks,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST'
): AbortController {
  const controller = new AbortController();

  fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        callbacks.onError(data?.error?.message ?? `Request failed: ${res.status}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        callbacks.onError('No response body');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'result') {
                // Unwrap FlowResult envelope: { success, data } → data
                if (data && typeof data === 'object' && 'success' in data) {
                  if (data.success === false) {
                    callbacks.onError(data.error?.message ?? 'Flow failed');
                  } else {
                    callbacks.onResult(data.data);
                  }
                } else {
                  callbacks.onResult(data);
                }
              } else if (currentEvent === 'error') {
                callbacks.onError(data.error ?? 'Unknown error');
              } else if (currentEvent) {
                callbacks.onEvent(currentEvent, data);
              }
            } catch {
              // Ignore parse errors for incomplete data
            }
            currentEvent = '';
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        callbacks.onError(err.message ?? 'Connection failed');
      }
    });

  return controller;
}
