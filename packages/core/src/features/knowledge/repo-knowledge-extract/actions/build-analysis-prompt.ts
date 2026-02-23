import type { StepResult } from '@nori/shared';
import type { CategorizedFiles } from './categorize-files.js';
import type { LlmMessage } from '../../../shared/utils/llm-client.js';

export interface VaultContext {
  existing_categories: string[];
  sample_titles: string[];
}

export interface AnalysisPrompt {
  system_prompt: string;
  messages: LlmMessage[];
}

export function buildAnalysisPrompt(
  categorized: CategorizedFiles,
  structureSummary: string,
  detectedPatterns: string[],
  vaultContext: VaultContext,
  conversationHistory?: LlmMessage[]
): StepResult<AnalysisPrompt> {
  const categoryHint = vaultContext.existing_categories.length > 0
    ? `Existing knowledge categories in the vault: ${vaultContext.existing_categories.join(', ')}.`
    : 'No existing categories yet — suggest appropriate ones.';

  const titlesHint = vaultContext.sample_titles.length > 0
    ? `Some existing entry titles for consistency: ${vaultContext.sample_titles.join('; ')}.`
    : '';

  const system_prompt = `You are a knowledge extraction assistant for a software development project.
Your job is to analyze a repository and generate structured knowledge entries documenting its conventions, patterns, architecture, and decisions.

${categoryHint}
${titlesHint}

## Instructions

1. Analyze the repository structure and file contents provided.
2. Identify knowledge-worthy content: coding guidelines, architecture patterns, naming conventions, design decisions, folder structure rules, dependency choices, CI/CD setup, etc.
3. If you need clarification about something ambiguous (e.g., "I found multiple patterns — which should I document?"), respond with questions.
4. When ready, generate knowledge proposals.

## Response format

Always respond with valid JSON (no markdown fences, no explanation outside the JSON).

If you have questions:
\`\`\`
{
  "status": "questions",
  "message": "A brief explanation of what you found so far",
  "questions": ["Question 1?", "Question 2?"]
}
\`\`\`

If you have proposals ready:
\`\`\`
{
  "status": "proposals",
  "message": "Summary of what was extracted",
  "proposals": [
    {
      "title": "Descriptive Title",
      "category": "lowercase-slug",
      "tags": ["3-to-12", "kebab-case", "tags"],
      "description": "Max 300 char description of the knowledge entry.",
      "required_knowledge": ["titles of other entries this depends on"],
      "rules": ["glob patterns like src/components/**/*.tsx for path-based loading"],
      "optional_knowledge": ["titles of related but not required entries"],
      "content": "# Heading\\n\\nMarkdown content with code examples, explanations, etc."
    }
  ]
}
\`\`\`

## Rules for proposals

- Each proposal must have 3-12 kebab-case tags
- Description must be max 300 characters
- Content must start with a heading and be 100-10000 characters
- rules should be glob patterns that match files this knowledge applies to
- required_knowledge should reference other proposal titles if there's a dependency
- Category should be a lowercase slug: guide, reference, convention, decision, pattern, architecture, infrastructure
- Generate 3-10 focused entries. Quality over quantity.`;

  // Build the file content section for the user message
  const fileContentParts: string[] = [];
  for (const [category, group] of Object.entries(categorized.categories)) {
    fileContentParts.push(`\n## ${category.toUpperCase()} FILES (${group.files.length} files)\n`);
    for (const file of group.files) {
      fileContentParts.push(`### ${file.relative_path} (${file.size} bytes)\n\`\`\`\n${file.content}\n\`\`\`\n`);
    }
  }

  const userMessage = `Analyze this repository and extract knowledge entries.

## Repository Summary
${structureSummary}

## Detected Patterns
${detectedPatterns.length > 0 ? detectedPatterns.join(', ') : 'None detected'}

## File Contents
${fileContentParts.join('\n')}

Generate knowledge entries documenting the important conventions, patterns, and decisions found in this repository. If anything is ambiguous, ask questions first.`;

  // Build messages array: if there's conversation history, use it; otherwise just the initial user message
  const messages: LlmMessage[] = conversationHistory && conversationHistory.length > 0
    ? [...conversationHistory]
    : [{ role: 'user', content: userMessage }];

  return {
    success: true,
    data: { system_prompt, messages },
  };
}
