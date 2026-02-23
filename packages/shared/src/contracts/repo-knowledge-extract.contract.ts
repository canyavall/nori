import { z } from 'zod';
import type { KnowledgeProposal } from '../types/knowledge.js';

// ─── Request schemas ─────────────────────────────────────────────

export const repoKnowledgeExtractStartSchema = z.object({
  project_path: z.string().min(1),
  vault_id: z.string().min(1),
});

export type RepoKnowledgeExtractStartInput = z.infer<typeof repoKnowledgeExtractStartSchema>;

export const repoKnowledgeExtractReplySchema = z.object({
  session_id: z.string().min(1),
  user_reply: z.string().min(1),
});

export type RepoKnowledgeExtractReplyInput = z.infer<typeof repoKnowledgeExtractReplySchema>;

// ─── Response types ──────────────────────────────────────────────

export interface RepoKnowledgeExtractStartResponse {
  session_id: string;
  status: 'questions' | 'proposals';
  questions?: string[];
  proposals?: KnowledgeProposal[];
  message?: string;
}

export interface RepoKnowledgeExtractReplyResponse {
  session_id: string;
  status: 'questions' | 'proposals';
  questions?: string[];
  proposals?: KnowledgeProposal[];
  message?: string;
}

// ─── SSE event interfaces ────────────────────────────────────────

export interface RepoKnowledgeExtractEvents {
  'repo-extract:started': { project_path: string };
  'repo-extract:scanning': { project_path: string };
  'repo-extract:scan-complete': { file_count: number; categories_found: string[] };
  'repo-extract:analyzing': { batch: number; total_batches: number };
  'repo-extract:llm-thinking': { message: string };
  'repo-extract:questions': { questions: string[]; message: string };
  'repo-extract:proposals-ready': { proposal_count: number };
  'repo-extract:completed': { session_id: string; status: string };
}

// ─── API route constants ─────────────────────────────────────────

export const REPO_KNOWLEDGE_EXTRACT_START_API = {
  method: 'POST' as const,
  path: '/api/knowledge/repo-extract',
} as const;

export const REPO_KNOWLEDGE_EXTRACT_REPLY_API = {
  method: 'POST' as const,
  path: '/api/knowledge/repo-extract/:sessionId/reply',
} as const;
