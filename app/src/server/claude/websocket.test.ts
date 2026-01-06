import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../index.js';
import { ServerInstance } from '../index.js';
import WebSocket from 'ws';
import { saveAuthTokens } from '../auth/storage.js';
import { existsSync, unlinkSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const authPath = join(homedir(), '.nori', 'auth.json');

describe('WebSocket Chat Integration', () => {
  let server: ServerInstance | null = null;

  beforeEach(async () => {
    // Create test auth token
    saveAuthTokens({
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      expires_in: 3600,
    });

    // Start server
    server = await createServer();
  });

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }

    // Clean up auth file
    if (existsSync(authPath)) {
      unlinkSync(authPath);
    }
  });

  it('should accept WebSocket connections on /chat', async () => {
    expect(server).not.toBeNull();

    const ws = new WebSocket(`ws://127.0.0.1:${server!.port}/chat`);

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        resolve();
      });

      ws.on('error', (err) => {
        reject(err);
      });

      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
  });

  it('should reject connections to non-/chat paths', async () => {
    expect(server).not.toBeNull();

    const ws = new WebSocket(`ws://127.0.0.1:${server!.port}/invalid`);

    await new Promise<void>((resolve, reject) => {
      ws.on('error', () => {
        // Expected error
        resolve();
      });

      ws.on('open', () => {
        ws.close();
        reject(new Error('Should not have connected'));
      });

      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
  });

  it('should handle connection close gracefully', async () => {
    expect(server).not.toBeNull();

    const ws = new WebSocket(`ws://127.0.0.1:${server!.port}/chat`);

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        ws.close();
      });

      ws.on('close', () => {
        expect(ws.readyState).toBe(WebSocket.CLOSED);
        resolve();
      });

      ws.on('error', (err) => {
        reject(err);
      });

      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
  });

  it('should send error when not authenticated', async () => {
    // Remove auth file
    if (existsSync(authPath)) {
      unlinkSync(authPath);
    }

    expect(server).not.toBeNull();

    const ws = new WebSocket(`ws://127.0.0.1:${server!.port}/chat`);

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        // Send chat request
        ws.send(JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }));
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('error');
        expect(message.error).toContain('Not authenticated');
        ws.close();
        resolve();
      });

      ws.on('error', (err) => {
        reject(err);
      });

      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
  });

  it('should handle malformed JSON gracefully', async () => {
    expect(server).not.toBeNull();

    const ws = new WebSocket(`ws://127.0.0.1:${server!.port}/chat`);

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        ws.send('invalid json');
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('error');
        ws.close();
        resolve();
      });

      ws.on('error', (err) => {
        reject(err);
      });

      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
  });
});
