import { createSignal } from 'solid-js';
import { knowledgeFrontmatterSchema } from '@nori/shared';
import type { EditFormProps } from './EditForm.type';

const parseTags = (input: string): string[] =>
  input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

export const useEditForm = (props: Pick<EditFormProps, 'initialTitle' | 'initialCategory' | 'initialTags' | 'initialContent' | 'onSave'>) => {
  const [title, setTitle] = createSignal(props.initialTitle);
  const [category, setCategory] = createSignal(props.initialCategory);
  const [tagsInput, setTagsInput] = createSignal(props.initialTags.join(', '));
  const [content, setContent] = createSignal(props.initialContent);
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const tags = () => parseTags(tagsInput());

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const result = knowledgeFrontmatterSchema.safeParse({
      title: title(),
      category: category(),
      tags: tags(),
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
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
      content: content(),
    });
  };

  return { title, setTitle, category, setCategory, tagsInput, setTagsInput, content, setContent, errors, tags, handleSubmit };
};
