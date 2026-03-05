import type { StepResult, KnowledgeLlmAuditResult } from '@nori/shared';
import type { FrontmatterSchemaResult } from './validate-frontmatter-schema.js';
import type { ContentQualityResult } from './validate-content-quality.js';
import type { AiOriginalityResult } from './check-ai-originality.js';

export interface KnowledgeAuditResult {
  file_path: string;
  status: 'pass' | 'warn' | 'fail';
  findings: string[];
  llm_result?: KnowledgeLlmAuditResult;
}

export function generateAuditResult(
  filePath: string,
  frontmatter: FrontmatterSchemaResult,
  contentQuality: ContentQualityResult,
  aiOriginality: AiOriginalityResult,
  llmResult?: KnowledgeLlmAuditResult
): StepResult<KnowledgeAuditResult> {
  const findings: string[] = [];

  if (!frontmatter.valid) {
    findings.push(...frontmatter.errors.map((e) => `Frontmatter: ${e}`));
  }

  if (!contentQuality.valid) {
    findings.push(...contentQuality.findings.map((f) => `Content: ${f}`));
  }

  if (!aiOriginality.passed) {
    findings.push(...aiOriginality.findings.map((f) => `Originality: ${f}`));
  }

  let status: 'pass' | 'warn' | 'fail' = 'pass';
  if (!frontmatter.valid) {
    status = 'fail';
  } else if (!contentQuality.valid || !aiOriginality.passed) {
    status = 'warn';
  }

  // If LLM result is more severe than structural result, escalate
  if (llmResult) {
    if (llmResult.overall_status === 'fail' && status !== 'fail') {
      status = 'fail';
    } else if (llmResult.overall_status === 'warn' && status === 'pass') {
      status = 'warn';
    }
  }

  return {
    success: true,
    data: {
      file_path: filePath,
      status,
      findings,
      llm_result: llmResult,
    },
  };
}
