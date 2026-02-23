import { z } from 'zod';

const kebabTag = z.string().min(1).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Tags must be lowercase kebab-case (e.g. "my-tag")');

export const knowledgeFrontmatterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(kebabTag).min(3, 'At least 3 tags required').max(12, 'At most 12 tags allowed'),
  description: z.string().min(1, 'Description is required').max(300, 'Description must be at most 300 characters'),
  required_knowledge: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  optional_knowledge: z.array(z.string()).optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
});

export type KnowledgeFrontmatterInput = z.infer<typeof knowledgeFrontmatterSchema>;

export const knowledgeCreateSchema = z.object({
  vault_id: z.string().min(1, 'Vault ID is required'),
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(kebabTag).min(3, 'At least 3 tags required').max(12, 'At most 12 tags allowed'),
  description: z.string().min(1, 'Description is required').max(300, 'Description must be at most 300 characters'),
  required_knowledge: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  optional_knowledge: z.array(z.string()).optional(),
  content: z.string().min(1, 'Content is required'),
});

export type KnowledgeCreateInput = z.infer<typeof knowledgeCreateSchema>;

export const knowledgeEditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(kebabTag).min(3, 'At least 3 tags required').max(12, 'At most 12 tags allowed'),
  description: z.string().min(1, 'Description is required').max(300, 'Description must be at most 300 characters'),
  required_knowledge: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  optional_knowledge: z.array(z.string()).optional(),
  content: z.string().min(1, 'Content is required'),
});

export type KnowledgeEditInput = z.infer<typeof knowledgeEditSchema>;

export const knowledgeSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  vault_id: z.string().optional(),
});

export type KnowledgeSearchInput = z.infer<typeof knowledgeSearchSchema>;
