import { knowledgeFrontmatterSchema } from '@nori/shared';
import type { StepResult, FlowError } from '@nori/shared';

export interface FrontmatterSchemaResult {
  valid: boolean;
  errors: string[];
}

export function validateFrontmatterSchema(
  frontmatter: Record<string, unknown>
): StepResult<FrontmatterSchemaResult> | FlowError {
  const result = knowledgeFrontmatterSchema.safeParse(frontmatter);

  if (result.success) {
    return {
      success: true,
      data: { valid: true, errors: [] },
    };
  }

  const errors = result.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`
  );

  return {
    success: true,
    data: { valid: false, errors },
  };
}
