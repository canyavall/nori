import { z } from 'zod';

const vaultNameField = z
  .string()
  .min(1, 'Vault name is required')
  .max(100, 'Vault name must be 100 characters or less')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Vault name can only contain letters, numbers, hyphens, and underscores');

export const vaultRegistrationSchema = z.object({
  vault_type: z.literal('git').default('git'),
  vault_name: vaultNameField,
  git_url: z
    .string()
    .min(1, 'Git URL is required')
    .refine(
      (url) =>
        /^https:\/\/.+\/.+/.test(url) || /^git@.+:.+/.test(url),
      'Must be a valid HTTPS or SSH git URL'
    ),
  branch: z.string().min(1, 'Branch is required').default('main'),
});

export type VaultRegistrationInput = z.infer<typeof vaultRegistrationSchema>;

export const vaultLocalRegistrationSchema = z.object({
  vault_type: z.literal('local'),
  vault_name: vaultNameField,
});

export type VaultLocalRegistrationInput = z.infer<typeof vaultLocalRegistrationSchema>;

export const vaultLinkProjectSchema = z.object({
  vault_id: z.string().min(1, 'Vault ID is required'),
  project_path: z.string().min(1, 'Project path is required'),
});

export type VaultLinkProjectInput = z.infer<typeof vaultLinkProjectSchema>;
