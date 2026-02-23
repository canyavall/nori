import type { StepResult, FlowError } from '@nori/shared';

export interface ContentQualityResult {
  valid: boolean;
  findings: string[];
}

const MIN_CONTENT_LENGTH = 50;
const MAX_CONTENT_LENGTH = 10_000;
const HEADING_PATTERN = /^#{1,6}\s+.+$/m;

export function validateContentQuality(content: string): StepResult<ContentQualityResult> | FlowError {
  const findings: string[] = [];
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    findings.push('Content is empty');
  } else if (trimmed.length < MIN_CONTENT_LENGTH) {
    findings.push(`Content is too short (${trimmed.length} chars, minimum ${MIN_CONTENT_LENGTH})`);
  }

  if (trimmed.length > MAX_CONTENT_LENGTH) {
    findings.push(`Content exceeds maximum length (${trimmed.length} chars, maximum ${MAX_CONTENT_LENGTH})`);
  }

  if (trimmed.length > 0 && !HEADING_PATTERN.test(trimmed)) {
    findings.push('Content has no headings (expected at least one markdown heading)');
  }

  return {
    success: true,
    data: {
      valid: findings.length === 0,
      findings,
    },
  };
}
