import { getDatabase } from './index.js';
import { Session, Message } from './types.js';

/**
 * Save session with messages
 */
export function saveSession(
  sessionId: string,
  role: string,
  title: string,
  messages: Omit<Message, 'session_id'>[]
): void {
  const db = getDatabase();
  const now = Date.now();
  const totalTokens = messages.reduce((sum, m) => sum + m.tokens, 0);
  const messageCount = messages.length;

  // Check if session exists
  const exists = db.prepare('SELECT EXISTS(SELECT 1 FROM sessions WHERE id = ?) as exists').get(sessionId) as {
    exists: number;
  };

  if (exists.exists) {
    // Update existing session
    db.prepare(
      'UPDATE sessions SET role = ?, title = ?, updated_at = ?, total_tokens = ?, message_count = ? WHERE id = ?'
    ).run(role, title, now, totalTokens, messageCount, sessionId);

    // Delete old messages
    db.prepare('DELETE FROM messages WHERE session_id = ?').run(sessionId);
  } else {
    // Insert new session
    db.prepare(
      'INSERT INTO sessions (id, role, title, created_at, updated_at, total_tokens, message_count) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(sessionId, role, title, now, now, totalTokens, messageCount);
  }

  // Insert messages
  const insertMessage = db.prepare(
    'INSERT INTO messages (id, session_id, role, content, timestamp, tokens) VALUES (?, ?, ?, ?, ?, ?)'
  );

  for (const msg of messages) {
    insertMessage.run(msg.id, sessionId, msg.role, msg.content, msg.timestamp, msg.tokens);
  }
}

/**
 * Load session with messages
 */
export function loadSession(sessionId: string): { session: Session; messages: Message[] } | null {
  const db = getDatabase();

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as Session | undefined;
  if (!session) {
    return null;
  }

  const messages = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC').all(sessionId) as Message[];

  return { session, messages };
}

/**
 * Get all sessions (metadata only)
 */
export function getAllSessions(role?: string): Session[] {
  const db = getDatabase();

  if (role) {
    return db.prepare('SELECT * FROM sessions WHERE role = ? ORDER BY updated_at DESC').all(role) as Session[];
  }

  return db.prepare('SELECT * FROM sessions ORDER BY updated_at DESC').all() as Session[];
}

/**
 * Delete session
 */
export function deleteSession(sessionId: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  // Messages are cascade deleted via foreign key
}
