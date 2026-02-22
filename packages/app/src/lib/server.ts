import { NORI_SERVER_PORT } from '@nori/shared';

const HEALTH_URL = `http://localhost:${NORI_SERVER_PORT}/api/health`;
const HEALTH_CHECK_INTERVAL_MS = 500;
const HEALTH_CHECK_MAX_RETRIES = 30; // 15 seconds total

/**
 * Wait until the server responds to a health check.
 * Resolves when healthy, rejects after max retries.
 */
export async function waitForServer(): Promise<void> {
  for (let i = 0; i < HEALTH_CHECK_MAX_RETRIES; i++) {
    try {
      const res = await fetch(HEALTH_URL);
      if (res.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, HEALTH_CHECK_INTERVAL_MS));
  }
  throw new Error(`Server did not become healthy after ${HEALTH_CHECK_MAX_RETRIES} retries`);
}

/**
 * Check if we're running inside a Tauri desktop shell.
 */
export function isTauri(): boolean {
  return '__TAURI_INTERNALS__' in window;
}

/**
 * In dev mode the server is started externally (bun run dev in @nori/server).
 * In production Tauri mode, the Rust side spawns the sidecar (see lib.rs).
 * This function just waits for it to be ready.
 */
export async function ensureServer(): Promise<void> {
  await waitForServer();
}
