import type { StepResult } from '@nori/shared';

export interface ParsedQuery {
  text: string;
  category?: string;
  tags?: string[];
  filter_count: number;
}

export function parseQuery(query: string): StepResult<ParsedQuery> {
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      success: true,
      data: { text: '', filter_count: 0 },
    };
  }

  let category: string | undefined;
  const tags: string[] = [];
  const textParts: string[] = [];

  const tokens = trimmed.split(/\s+/);

  for (const token of tokens) {
    const categoryMatch = token.match(/^category:(.+)$/i);
    if (categoryMatch) {
      category = categoryMatch[1];
      continue;
    }

    const tagMatch = token.match(/^tag:(.+)$/i);
    if (tagMatch) {
      tags.push(tagMatch[1]);
      continue;
    }

    textParts.push(token);
  }

  const filterCount = (category ? 1 : 0) + tags.length;

  return {
    success: true,
    data: {
      text: textParts.join(' '),
      category: category || undefined,
      tags: tags.length > 0 ? tags : undefined,
      filter_count: filterCount,
    },
  };
}
