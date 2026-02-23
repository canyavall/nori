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

export const useEditForm = (props: Pick<EditFormProps, 'initialTitle' | 'initialCategory' | 'initialTags' | 'initialDescription' | 'initialRequiredKnowledge' | 'initialRules' | 'initialOptionalKnowledge' | 'initialContent' | 'onSave'>) => {
  const [title, setTitle] = createSignal(props.initialTitle);
  const [category, setCategory] = createSignal(props.initialCategory);
  const [tagsInput, setTagsInput] = createSignal(props.initialTags.join(', '));
  const [description, setDescription] = createSignal(props.initialDescription);
  const [requiredKnowledgeInput, setRequiredKnowledgeInput] = createSignal(props.initialRequiredKnowledge.join(', '));
  const [rulesInput, setRulesInput] = createSignal(props.initialRules.join('\n'));
  const [optionalKnowledgeInput, setOptionalKnowledgeInput] = createSignal((props.initialOptionalKnowledge ?? []).join(', '));
  const [content, setContent] = createSignal(props.initialContent);
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const tags = () => parseTags(tagsInput());

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const requiredKnowledge = parseTags(requiredKnowledgeInput());
    const rules = parseLines(rulesInput());
    const optionalKnowledge = parseTags(optionalKnowledgeInput());

    const result = knowledgeFrontmatterSchema.safeParse({
      title: title(),
      category: category(),
      tags: tags(),
      description: description(),
      required_knowledge: requiredKnowledge,
      rules,
      optional_knowledge: optionalKnowledge.length > 0 ? optionalKnowledge : undefined,
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
      optional_knowledge: result.data.optional_knowledge,
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
    optionalKnowledgeInput, setOptionalKnowledgeInput,
    content, setContent,
    errors, tags, handleSubmit,
  };
};
