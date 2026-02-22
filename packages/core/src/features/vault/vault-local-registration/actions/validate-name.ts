import type { StepResult, FlowError } from '@nori/shared';

const NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const MAX_NAME_LENGTH = 100;

export function validateName(name: string): StepResult<{ vault_name: string }> | FlowError {
  if (!name || name.length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_NAME',
        message: 'Vault name is required',
        step: '01-validate-name',
        severity: 'error',
        recoverable: true,
        details: { vault_name: name },
      },
    };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return {
      success: false,
      error: {
        code: 'INVALID_NAME',
        message: `Vault name must be ${MAX_NAME_LENGTH} characters or less`,
        step: '01-validate-name',
        severity: 'error',
        recoverable: true,
        details: { vault_name: name },
      },
    };
  }

  if (!NAME_REGEX.test(name)) {
    return {
      success: false,
      error: {
        code: 'INVALID_NAME',
        message: 'Vault name can only contain letters, numbers, hyphens, and underscores',
        step: '01-validate-name',
        severity: 'error',
        recoverable: true,
        details: { vault_name: name },
      },
    };
  }

  return { success: true, data: { vault_name: name } };
}
