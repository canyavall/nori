import { vaultRegistrationSchema, vaultLocalRegistrationSchema } from '@nori/shared';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateInput(data: unknown): ValidationResult {
  const raw = data as Record<string, unknown> | null;
  const vaultType = raw?.vault_type;

  const schema = vaultType === 'local' ? vaultLocalRegistrationSchema : vaultRegistrationSchema;
  const result = schema.safeParse(data);

  if (result.success) {
    return { valid: true, errors: {} };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as string;
    errors[field] = issue.message;
  }

  return { valid: false, errors };
}
