import type { StepResult, FlowError } from '@nori/shared';

const MIN_CONTENT_LENGTH = 10;
const MAX_CONTENT_LENGTH = 10_000;

export interface ContentValidation {
  content_length: number;
  has_headings: boolean;
  has_code_blocks: boolean;
}

export function validateContent(content: string): StepResult<ContentValidation> | FlowError {
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return {
      success: false,
      error: {
        code: 'EMPTY_CONTENT',
        message: 'Knowledge content is empty',
        step: '02-validate-content',
        severity: 'error',
        recoverable: true,
        details: { content_length: 0 },
      },
    };
  }

  if (trimmed.length < MIN_CONTENT_LENGTH) {
    return {
      success: false,
      error: {
        code: 'CONTENT_TOO_SHORT',
        message: `Content may be too short to be useful: ${trimmed.length} characters (minimum ${MIN_CONTENT_LENGTH})`,
        step: '02-validate-content',
        severity: 'error',
        recoverable: true,
        details: {
          content_length: trimmed.length,
          minimum_length: MIN_CONTENT_LENGTH,
        },
      },
    };
  }

  if (trimmed.length > MAX_CONTENT_LENGTH) {
    return {
      success: false,
      error: {
        code: 'CONTENT_TOO_LONG',
        message: `Content exceeds maximum length: ${trimmed.length} characters (maximum ${MAX_CONTENT_LENGTH})`,
        step: '02-validate-content',
        severity: 'error',
        recoverable: true,
        details: {
          content_length: trimmed.length,
          maximum_length: MAX_CONTENT_LENGTH,
        },
      },
    };
  }

  const hasHeadings = /^#{1,6}\s+/m.test(trimmed);
  const hasCodeBlocks = /```[\s\S]*?```/.test(trimmed);

  return {
    success: true,
    data: {
      content_length: trimmed.length,
      has_headings: hasHeadings,
      has_code_blocks: hasCodeBlocks,
    },
  };
}
