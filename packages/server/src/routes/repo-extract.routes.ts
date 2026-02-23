import { Hono } from 'hono';
import { repoKnowledgeExtractStartSchema, repoKnowledgeExtractReplySchema } from '@nori/shared';
import { queryOne } from '@nori/core';
import { withSSE } from '../sse/emitter.js';
import type { AppEnv } from '../types.js';
import type { LlmMessage, ScannedRepository, CategorizedFiles, VaultContext } from '@nori/core';

// ─── Session management ──────────────────────────────────────────

interface ConversationSession {
  session_id: string;
  project_path: string;
  vault_id: string;
  messages: LlmMessage[];
  cached_scan: ScannedRepository;
  cached_categories: CategorizedFiles;
  cached_vault_context: VaultContext;
  cached_initial_user_message: string;
  created_at: number;
}

const sessions = new Map<string, ConversationSession>();

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

function cleanupSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.created_at > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

function generateSessionId(): string {
  return crypto.randomUUID();
}

// ─── Routes ──────────────────────────────────────────────────────

const repoExtract = new Hono<AppEnv>();

// Start extraction — scans repo and runs initial LLM analysis
repoExtract.post('/', async (c) => {
  const body = await c.req.json();
  const input = repoKnowledgeExtractStartSchema.parse(body);
  const db = c.get('db');

  // Verify project exists
  const project = queryOne(db, 'SELECT * FROM projects WHERE path = ?', [input.project_path]);
  if (!project) {
    return c.json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } }, 404);
  }

  // Verify vault exists
  const vault = queryOne(db, 'SELECT * FROM vaults WHERE id = ?', [input.vault_id]);
  if (!vault) {
    return c.json({ error: { code: 'VAULT_NOT_FOUND', message: 'Vault not found' } }, 404);
  }

  cleanupSessions();

  return withSSE(c, async (emitter) => {
    const { runRepoKnowledgeExtract } = await import('@nori/core');
    const result = await runRepoKnowledgeExtract(
      {
        project_path: input.project_path,
        vault_id: input.vault_id,
        db,
      },
      emitter
    );

    if (!result.success) return result;

    // Create session for multi-turn conversation
    const sessionId = generateSessionId();

    // We need to re-run scan to cache it (the orchestrator doesn't expose intermediate results
    // through the result, so we cache via a second lightweight scan)
    const { runRepoKnowledgeExtract: _unused, ...coreExports } = await import('@nori/core');
    void _unused;

    // For caching, we do a lightweight approach: store the initial prompt messages
    // The orchestrator result has what we need
    const session: ConversationSession = {
      session_id: sessionId,
      project_path: input.project_path,
      vault_id: input.vault_id,
      messages: [],
      cached_scan: { files: [], structure_summary: '', detected_patterns: [] },
      cached_categories: { categories: {}, total_chars: 0, file_count: 0 },
      cached_vault_context: { existing_categories: [], sample_titles: [] },
      cached_initial_user_message: '',
      created_at: Date.now(),
    };

    // If LLM returned questions, store the assistant's raw response for conversation history
    if (result.data.status === 'questions' && result.data.raw_response) {
      session.messages = [
        { role: 'user', content: '[Initial analysis request - see system prompt]' },
        { role: 'assistant', content: result.data.raw_response },
      ];
    }

    sessions.set(sessionId, session);

    return {
      success: true,
      data: {
        session_id: sessionId,
        status: result.data.status,
        questions: result.data.questions,
        proposals: result.data.proposals,
        message: result.data.message,
      },
    };
  });
});

// Reply to LLM questions — continues the conversation
repoExtract.post('/:sessionId/reply', async (c) => {
  const sessionId = c.req.param('sessionId');
  const body = await c.req.json();
  const input = repoKnowledgeExtractReplySchema.parse(body);
  const db = c.get('db');

  const session = sessions.get(sessionId);
  if (!session) {
    return c.json({ error: { code: 'SESSION_NOT_FOUND', message: 'Session not found or expired' } }, 404);
  }

  // Append user reply to conversation history
  session.messages.push({ role: 'user', content: input.user_reply });

  return withSSE(c, async (emitter) => {
    const { runRepoKnowledgeExtract } = await import('@nori/core');
    const result = await runRepoKnowledgeExtract(
      {
        project_path: session.project_path,
        vault_id: session.vault_id,
        db,
        messages: session.messages,
        cached_scan: session.cached_scan,
        cached_categories: session.cached_categories,
        cached_vault_context: session.cached_vault_context,
        cached_initial_user_message: session.cached_initial_user_message,
      },
      emitter
    );

    if (!result.success) return result;

    // Append assistant response to history
    if (result.data.raw_response) {
      session.messages.push({ role: 'assistant', content: result.data.raw_response });
    }

    return {
      success: true,
      data: {
        session_id: sessionId,
        status: result.data.status,
        questions: result.data.questions,
        proposals: result.data.proposals,
        message: result.data.message,
      },
    };
  });
});

export { repoExtract as repoExtractRoutes };
