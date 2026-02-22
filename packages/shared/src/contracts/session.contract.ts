export { sessionCreateSchema, type SessionCreateInput, sessionResumeSchema, type SessionResumeInput, sessionArchiveSchema, type SessionArchiveInput } from '../schemas/session.schema.js';

// ─── Response types ───────────────────────────────────────────────

export interface SessionCreateResponse {
  id: string;
  title: string;
}

export interface SessionResumeResponse {
  id: string;
  title: string;
  status: string;
}

export interface SessionArchiveResponse {
  id: string;
  status: 'archived';
}

// ─── SSE event interfaces ─────────────────────────────────────────

export interface SessionCreateEvents {
  'session:create:started': { vault_id: string };
  'session:create:checking-active': { vault_id: string };
  'session:create:archiving-previous': { previous_session_id: string };
  'session:create:creating-state': { session_id: string };
  'session:create:completed': { session_id: string; title: string };
}

export interface SessionResumeEvents {
  'session:resume:started': { session_id: string };
  'session:resume:validating': { session_id: string };
  'session:resume:restoring': { session_id: string };
  'session:resume:completed': { session_id: string; title: string };
}

export interface SessionArchiveEvents {
  'session:archive:started': { session_id: string };
  'session:archive:checking-active': { session_id: string };
  'session:archive:archiving': { session_id: string };
  'session:archive:completed': { session_id: string };
}

// ─── API route constants ──────────────────────────────────────────

export const SESSION_CREATE_API = {
  method: 'POST' as const,
  path: '/api/session',
} as const;

export const SESSION_LIST_API = {
  method: 'GET' as const,
  path: '/api/session',
} as const;

export const SESSION_GET_API = {
  method: 'GET' as const,
  path: '/api/session/:id',
} as const;

export const SESSION_RESUME_API = {
  method: 'POST' as const,
  path: '/api/session/:id/resume',
} as const;

export const SESSION_ARCHIVE_API = {
  method: 'POST' as const,
  path: '/api/session/:id/archive',
} as const;
