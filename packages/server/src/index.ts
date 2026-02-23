import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { NORI_SERVER_PORT, NORI_APP_DEV_PORT } from '@nori/shared';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/logger.js';
import { authMiddleware } from './middleware/auth.js';
import { initDatabase, databaseMiddleware, closeDb } from './middleware/database.js';
import { vaultRoutes } from './routes/vault.routes.js';
import { knowledgeRoutes } from './routes/knowledge.routes.js';
import { sessionRoutes } from './routes/session.routes.js';
import { appRoutes } from './routes/app.routes.js';
import { projectRoutes } from './routes/project.routes.js';
import { claudeConfigRoutes } from './routes/claude-config.routes.js';
import { repoExtractRoutes } from './routes/repo-extract.routes.js';
import type { AppEnv } from './types.js';

const app = new Hono<AppEnv>();

// Middleware
app.use('*', cors({
  // tauri://localhost = macOS/Linux production, http://tauri.localhost = Windows production
  origin: [`http://localhost:${NORI_APP_DEV_PORT}`, 'tauri://localhost', 'http://tauri.localhost'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
app.use('*', requestLogger);
app.use('*', errorHandler);

// Health check must be registered before auth so it's always reachable
app.get('/api/health', (c) => c.json({ status: 'ok', version: '0.1.0' }));

app.use('/api/*', authMiddleware);
app.use('/api/*', databaseMiddleware);

// Routes
app.route('/api/app', appRoutes);
app.route('/api/vault', vaultRoutes);
app.route('/api/knowledge', knowledgeRoutes);
app.route('/api/session', sessionRoutes);
app.route('/api/project', projectRoutes);
app.route('/api/project/claude', claudeConfigRoutes);
app.route('/api/knowledge/repo-extract', repoExtractRoutes);

// Initialize database at startup, then start serving
await initDatabase();

Bun.serve({
  port: NORI_SERVER_PORT,
  fetch: app.fetch,
});

console.log(`Nori server listening on port ${NORI_SERVER_PORT}`);

// Graceful shutdown
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});
process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});
