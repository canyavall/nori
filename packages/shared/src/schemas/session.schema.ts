import { z } from 'zod';

export const sessionCreateSchema = z.object({
  vault_id: z.string().min(1, 'Vault ID is required'),
  title: z.string().optional().default(''),
});

export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;

export const sessionResumeSchema = z.object({
  session_id: z.string().min(1, 'Session ID is required'),
});

export type SessionResumeInput = z.infer<typeof sessionResumeSchema>;

export const sessionArchiveSchema = z.object({
  session_id: z.string().min(1, 'Session ID is required'),
});

export type SessionArchiveInput = z.infer<typeof sessionArchiveSchema>;
