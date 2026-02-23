import type { StepResult, KnowledgeProposal } from '@nori/shared';

export interface ValidatedProposals {
  proposals: KnowledgeProposal[];
  warnings: string[];
}

const KEBAB_CASE_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function toKebabCase(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureHeading(content: string): string {
  if (/^#\s/.test(content)) return content;
  // Insert a heading based on the first line
  const firstLine = content.split('\n')[0].trim();
  if (firstLine) {
    return `# ${firstLine}\n\n${content}`;
  }
  return `# Overview\n\n${content}`;
}

export function validateProposals(
  proposals: KnowledgeProposal[],
  existingTitles: string[] = []
): StepResult<ValidatedProposals> {
  const warnings: string[] = [];
  const proposalTitles = proposals.map((p) => p.title);
  const allKnownTitles = new Set([...existingTitles, ...proposalTitles]);

  const validated = proposals.map((proposal, i) => {
    const fixed = { ...proposal };
    const label = `Proposal ${i + 1} ("${proposal.title}")`;

    // Fix description: truncate to 300 chars
    if (fixed.description.length > 300) {
      fixed.description = fixed.description.slice(0, 297) + '...';
      warnings.push(`${label}: description truncated to 300 chars`);
    }

    // Fix tags: ensure kebab-case
    fixed.tags = fixed.tags.map((tag) => {
      if (KEBAB_CASE_RE.test(tag)) return tag;
      const kebab = toKebabCase(tag);
      if (kebab) {
        warnings.push(`${label}: tag "${tag}" converted to "${kebab}"`);
        return kebab;
      }
      return tag;
    }).filter((tag) => tag.length > 0);

    // Ensure minimum 3 tags
    if (fixed.tags.length < 3) {
      const category = fixed.category || 'general';
      const defaults = [category, 'convention', 'project'].filter(
        (t) => !fixed.tags.includes(t)
      );
      while (fixed.tags.length < 3 && defaults.length > 0) {
        fixed.tags.push(defaults.shift()!);
      }
      warnings.push(`${label}: added default tags to reach minimum of 3`);
    }

    // Ensure max 12 tags
    if (fixed.tags.length > 12) {
      fixed.tags = fixed.tags.slice(0, 12);
      warnings.push(`${label}: trimmed tags to maximum of 12`);
    }

    // Ensure content has heading
    if (fixed.content && !/^#\s/.test(fixed.content)) {
      fixed.content = ensureHeading(fixed.content);
      warnings.push(`${label}: added heading to content`);
    }

    // Validate content length
    if (fixed.content && fixed.content.length > 10_000) {
      fixed.content = fixed.content.slice(0, 9_997) + '...';
      warnings.push(`${label}: content truncated to 10,000 chars`);
    }

    // Validate required_knowledge references
    fixed.required_knowledge = fixed.required_knowledge.filter((ref) => {
      if (allKnownTitles.has(ref)) return true;
      warnings.push(`${label}: removed invalid required_knowledge reference "${ref}"`);
      return false;
    });

    // Validate optional_knowledge references
    if (fixed.optional_knowledge) {
      fixed.optional_knowledge = fixed.optional_knowledge.filter((ref) => {
        if (allKnownTitles.has(ref)) return true;
        warnings.push(`${label}: removed invalid optional_knowledge reference "${ref}"`);
        return false;
      });
      if (fixed.optional_knowledge.length === 0) {
        fixed.optional_knowledge = undefined;
      }
    }

    // Ensure category is lowercase slug
    fixed.category = fixed.category.toLowerCase().replace(/\s+/g, '-');

    // Ensure title is not empty
    if (!fixed.title.trim()) {
      fixed.title = `Knowledge Entry ${i + 1}`;
      warnings.push(`${label}: empty title replaced with default`);
    }

    return fixed;
  });

  return {
    success: true,
    data: { proposals: validated, warnings },
  };
}
