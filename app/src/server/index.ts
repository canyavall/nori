import express, { Express } from 'express';
import cors from 'cors';
import getPort from 'get-port';
import { createServer as createHttpServer, Server } from 'http';
import { WebSocketServer } from 'ws';
import { getDatabase, closeDatabase } from './db/index.js';
import { createChatWebSocket, closeWebSocketServer } from './claude/websocket.js';

export interface ServerInstance {
  app: Express;
  port: number;
  httpServer: Server;
  wss: WebSocketServer;
  close: () => Promise<void>;
}

export async function createServer(): Promise<ServerInstance> {
  const app = express();

  // Initialize database
  try {
    getDatabase();
    console.log('[Server] Database initialized');
  } catch (err) {
    console.error('[Server] Database initialization failed:', err);
    throw err;
  }

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  const authRoutes = await import('./auth/routes.js');
  const rolesRoutes = await import('./roles/routes.js');
  const workspacesRoutes = await import('./workspaces/routes.js');
  const sessionsRoutes = await import('./sessions/routes.js');
  const knowledgeRoutes = await import('./knowledge/routes.js');
  const hooksRoutes = await import('./hooks/routes.js');

  app.use('/auth', authRoutes.default);
  app.use('/roles', rolesRoutes.default);
  app.use('/workspaces', workspacesRoutes.default);
  app.use('/sessions', sessionsRoutes.default);
  app.use('/knowledge', knowledgeRoutes.default);
  app.use('/hooks', hooksRoutes.default);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Find available port in range 3000-3009
  const port = await getPort({
    port: [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009],
    host: '127.0.0.1'
  });

  return new Promise((resolve, reject) => {
    try {
      // Create HTTP server
      const httpServer = createHttpServer(app);

      // Create WebSocket server
      const wss = createChatWebSocket(httpServer);
      console.log('[Server] WebSocket server initialized');

      // Bind to localhost only (security)
      httpServer.listen(port, '127.0.0.1', () => {
        console.log(`[Server] Running on http://127.0.0.1:${port}`);
        console.log(`[Server] WebSocket available at ws://127.0.0.1:${port}/chat`);

        resolve({
          app,
          port,
          httpServer,
          wss,
          close: async () => {
            // Close WebSocket server first
            await closeWebSocketServer(wss);

            // Then close HTTP server
            return new Promise((resolveClose, rejectClose) => {
              httpServer.close((err) => {
                // Close database connection
                closeDatabase();

                if (err) {
                  console.error('[Server] Error during shutdown:', err);
                  rejectClose(err);
                } else {
                  console.log('[Server] Shutdown complete');
                  resolveClose();
                }
              });
            });
          }
        });
      });

      httpServer.on('error', (err) => {
        console.error('[Server] Failed to start:', err);
        reject(err);
      });
    } catch (err) {
      console.error('[Server] Initialization error:', err);
      reject(err);
    }
  });
}
