import type { StepResult, FlowError, KnowledgeFrontmatter } from '@nori/shared';
import { knowledgeFrontmatterSchema } from '@nori/shared';

export function validateFrontmatter(
  title: string,
  category: string,
  tags: string[]
): StepResult<KnowledgeFrontmatter> | FlowError {
  const result = knowledgeFrontmatterSchema.safeParse({ title, category, tags });

  if (!result.success) {
    const issues = result.error.issues;
    const missingFields = issues
      .filter((i) => i.code === 'too_small' || i.code === 'invalid_type')
      .map((i) => i.path.join('.'));

    return {
      success: false,
      error: {
        code: 'INVALID_FRONTMATTER',
        message: `Frontmatter validation failed: ${issues.map((i) => i.message).join(', ')}`,
        step: '01-validate-frontmatter',
        severity: 'error',
        recoverable: true,
        details: {
          missing_fields: missingFields,
          provided_fields: { title, category, tags },
          validation_errors: issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
      },
    };
  }

  return {
    success: true,
    data: result.data as KnowledgeFrontmatter,
  };
}
