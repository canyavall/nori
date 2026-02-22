import { z } from 'zod';

export const projectRegisterSchema = z.object({
  path: z.string().min(1, 'Project path is required'),
  name: z.string().optional(),
});

export type ProjectRegisterInput = z.infer<typeof projectRegisterSchema>;
