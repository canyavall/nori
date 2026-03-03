import type { StepResult, FlowError, KnowledgeFrontmatter } from '@nori/shared';
import { knowledgeFrontmatterSchema } from '@nori/shared';

export interface ValidatedChanges {
  frontmatter: KnowledgeFrontmatter;
  content: string;
  content_length: number;
}

export function validateChanges(
  title: string,
  category: string,
  tags: string[],
  description: string,
  required_knowledge: string[],
  rules: string[],
  content: string
): StepResult<ValidatedChanges> | FlowError {
  // Validate frontmatter
  const result = knowledgeFrontmatterSchema.safeParse({
    title,
    category,
    tags,
    description,
    required_knowledge,
    rules,
  });

  if (!result.success) {
    const issues = result.error.issues;

    return {
      success: false,
      error: {
        code: 'INVALID_FRONTMATTER',
        message: `Modified frontmatter is invalid: ${issues.map((i) => i.message).join(', ')}`,
        step: '02-validate-changes',
        severity: 'error',
        recoverable: true,
        details: {
          validation_errors: issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
          invalid_fields: issues.map((i) => i.path.join('.')),
        },
      },
    };
  }

  // Validate content is non-empty
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return {
      success: false,
      error: {
        code: 'EMPTY_CONTENT',
        message: 'Knowledge content cannot be empty after edit',
        step: '02-validate-changes',
        severity: 'error',
        recoverable: true,
        details: { content_length: 0 },
      },
    };
  }

  return {
    success: true,
    data: {
      frontmatter: result.data as KnowledgeFrontmatter,
      content: trimmed,
      content_length: trimmed.length,
    },
  };
}
