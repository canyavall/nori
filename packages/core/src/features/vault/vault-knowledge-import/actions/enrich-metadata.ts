import { basename, extname } from 'node:path';
import type { StepResult, FlowError } from '@nori/shared';
import type { ParsedEntry } from './parse-files.js';
import { resolveAuth, callAnthropicApi } from '../../../shared/utils/llm-client.js';

function filenameToTitle(filePath: string): string {
  const base = basename(filePath, extname(filePath));
  return base.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function needsEnrichment(entry: ParsedEntry): boolean {
  return !entry.title || !entry.category || entry.tags.length === 0 || !entry.description;
}

function extractJsonObject(text: string): Record<string, unknown> {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in LLM response');
  }
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}

function applyFallback(entry: ParsedEntry): ParsedEntry {
  return {
    ...entry,
    title: entry.title ?? filenameToTitle(entry.file_path),
    category: entry.category ?? entry.parent_folder ?? 'general',
    tags: entry.tags,
    description: entry.description ?? '',
  };
}

export interface EnrichResult {
  enriched: ParsedEntry[];
}

export async function enrichMetadata(
  entries: ParsedEntry[],
  onProgress: (file_path: string, index: number, total: number) => void
): Promise<StepResult<EnrichResult> | FlowError> {
  const auth = resolveAuth();
  const toEnrich = entries.filter(needsEnrichment);
  let enrichIndex = 0;
  const enriched: ParsedEntry[] = [];

  for (const entry of entries) {
    if (!needsEnrichment(entry)) {
      enriched.push(entry);
      continue;
    }

    const currentIndex = ++enrichIndex;
    onProgress(entry.file_path, currentIndex, toEnrich.length);

    if (auth.type === 'none') {
      enriched.push(applyFallback(entry));
      continue;
    }

    try {
      const systemPrompt = `You are a metadata generator for a knowledge vault. Given a file's partial metadata and content, generate the missing fields.
Return a single JSON object with: title (string), category (string, lowercase kebab-case), tags (array of 3-8 lowercase kebab-case strings), description (string, max 200 chars), rules (array of strings, can be empty), required_knowledge (array of prerequisite topic names, can be empty).
Respond with raw JSON only — no markdown, no explanation.`;

      const lines = [
        `File: ${basename(entry.file_path)}`,
        `Parent folder (category hint): ${entry.parent_folder}`,
        entry.title ? `Existing title: ${entry.title}` : '',
        entry.category ? `Existing category: ${entry.category}` : '',
        entry.tags.length ? `Existing tags: ${entry.tags.join(', ')}` : '',
        entry.description ? `Existing description: ${entry.description}` : '',
        '',
        'Content preview (first 2000 chars):',
        entry.content.slice(0, 2000),
        '',
        'Generate the missing metadata fields.',
      ].filter(Boolean);

      const text = await callAnthropicApi(auth, {
        model: 'claude-haiku-4-5-20251001',
        maxOutputTokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: lines.join('\n') }],
      });

      const parsed = extractJsonObject(text);

      enriched.push({
        ...entry,
        title: entry.title ?? (typeof parsed.title === 'string' ? parsed.title : filenameToTitle(entry.file_path)),
        category: entry.category ?? (typeof parsed.category === 'string' ? parsed.category.toLowerCase().replace(/\s+/g, '-') : entry.parent_folder ?? 'general'),
        tags: entry.tags.length ? entry.tags : (Array.isArray(parsed.tags) ? (parsed.tags as unknown[]).map(String) : []),
        description: entry.description ?? (typeof parsed.description === 'string' ? parsed.description : ''),
        rules: entry.rules.length ? entry.rules : (Array.isArray(parsed.rules) ? (parsed.rules as unknown[]).map(String) : []),
        required_knowledge: entry.required_knowledge.length ? entry.required_knowledge : (Array.isArray(parsed.required_knowledge) ? (parsed.required_knowledge as unknown[]).map(String) : []),
      });
    } catch {
      enriched.push(applyFallback(entry));
    }
  }

  return { success: true, data: { enriched } };
}
