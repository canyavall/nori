/**
 * HTTP/WebSocket API adapter to replace Tauri IPC
 */

/**
 * Get base API URL from Electron preload
 */
function getBaseURL(): string {
  const port = window.nori?.serverPort || 3000;
  return `http://localhost:${port}`;
}

/**
 * Get WebSocket URL
 */
function getWebSocketURL(): string {
  const port = window.nori?.serverPort || 3000;
  return `ws://localhost:${port}`;
}

/**
 * Invoke backend command via HTTP
 * Replaces Tauri's invoke()
 */
export async function invokeCommand<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseURL()}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Create WebSocket connection
 * Replaces Tauri's event listening
 */
export function createWebSocket(path: string): WebSocket {
  const url = `${getWebSocketURL()}${path}`;
  return new WebSocket(url);
}

/**
 * Check if running in Electron context
 */
export function isElectron(): boolean {
  return 'nori' in window;
}

/**
 * REST API wrapper
 */
export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    return invokeCommand<T>(endpoint, { method: 'GET' });
  },

  post: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    return invokeCommand<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    return invokeCommand<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    return invokeCommand<T>(endpoint, { method: 'DELETE' });
  },
};
