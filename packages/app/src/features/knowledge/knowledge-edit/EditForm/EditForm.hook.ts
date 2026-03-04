import { createSignal } from 'solid-js';
import { knowledgeFrontmatterSchema } from '@nori/shared';
import type { EditFormProps } from './EditForm.type';

const parseTags = (input: string): string[] =>
  input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

const parseLines = (input: string): string[] =>
  input
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

const toArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
  return [];
};

export const useEditForm = (props: Pick<EditFormProps, 'initialTitle' | 'initialCategory' | 'initialTags' | 'initialDescription' | 'initialRequiredKnowledge' | 'initialRules' | 'initialContent' | 'onSave'>) => {
  const [title, setTitle] = createSignal(props.initialTitle);
  const [category, setCategory] = createSignal(props.initialCategory);
  const [tagsInput, setTagsInput] = createSignal(toArray(props.initialTags).join(', '));
  const [description, setDescription] = createSignal(props.initialDescription);
  const [requiredKnowledgeInput, setRequiredKnowledgeInput] = createSignal(toArray(props.initialRequiredKnowledge).join(', '));
  const [rulesInput, setRulesInput] = createSignal(toArray(props.initialRules).join('\n'));
  const [content, setContent] = createSignal(props.initialContent);
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const tags = () => parseTags(tagsInput());

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const requiredKnowledge = parseTags(requiredKnowledgeInput());
    const rules = parseLines(rulesInput());

    const result = knowledgeFrontmatterSchema.safeParse({
      title: title(),
      category: category(),
      tags: tags(),
      description: description(),
      required_knowledge: requiredKnowledge,
      rules,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    if (!content().trim()) {
      setErrors({ content: 'Content is required' });
      return;
    }

    setErrors({});
    props.onSave({
      title: result.data.title,
      category: result.data.category,
      tags: result.data.tags,
      description: result.data.description,
      required_knowledge: result.data.required_knowledge,
      rules: result.data.rules,
      content: content(),
    });
  };

  return {
    title, setTitle,
    category, setCategory,
    tagsInput, setTagsInput,
    description, setDescription,
    requiredKnowledgeInput, setRequiredKnowledgeInput,
    rulesInput, setRulesInput,
    content, setContent,
    errors, tags, handleSubmit,
  };
};
