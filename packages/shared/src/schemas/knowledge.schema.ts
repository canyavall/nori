import { z } from 'zod';

export const knowledgeFrontmatterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  created: z.string().optional(),
  updated: z.string().optional(),
});

export type KnowledgeFrontmatterInput = z.infer<typeof knowledgeFrontmatterSchema>;

export const knowledgeCreateSchema = z.object({
  vault_id: z.string().min(1, 'Vault ID is required'),
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  content: z.string().min(1, 'Content is required'),
});

export type KnowledgeCreateInput = z.infer<typeof knowledgeCreateSchema>;

export const knowledgeEditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  content: z.string().min(1, 'Content is required'),
});

export type KnowledgeEditInput = z.infer<typeof knowledgeEditSchema>;

export const knowledgeSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  vault_id: z.string().optional(),
});

export type KnowledgeSearchInput = z.infer<typeof knowledgeSearchSchema>;
