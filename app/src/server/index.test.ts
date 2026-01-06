import { describe, it, expect, afterEach } from 'vitest';
import { createServer, ServerInstance } from './index.js';

describe('Express Server', () => {
  let server: ServerInstance | null = null;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
  });

  it('should start server on available port in range 3000-3009', async () => {
    server = await createServer();

    expect(server.port).toBeGreaterThanOrEqual(3000);
    expect(server.port).toBeLessThanOrEqual(3009);
    expect(server.app).toBeDefined();
  });

  it('should respond to health check endpoint', async () => {
    server = await createServer();

    const response = await fetch(`http://127.0.0.1:${server.port}/health`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ status: 'ok' });
  });

  it('should allocate different ports for multiple instances', async () => {
    const server1 = await createServer();
    const server2 = await createServer();

    expect(server1.port).not.toBe(server2.port);

    await server1.close();
    await server2.close();
  });

  it('should gracefully shutdown server', async () => {
    server = await createServer();
    const port = server.port;

    await server.close();

    // Verify server is actually closed by trying to connect
    await expect(
      fetch(`http://127.0.0.1:${port}/health`)
    ).rejects.toThrow();

    server = null; // Prevent double-close in afterEach
  });

  it('should handle CORS requests', async () => {
    server = await createServer();

    const response = await fetch(`http://127.0.0.1:${server.port}/health`, {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });

    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });
});
