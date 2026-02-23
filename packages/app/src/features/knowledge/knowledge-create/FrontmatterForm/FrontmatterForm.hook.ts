import { createSignal } from 'solid-js';
import { knowledgeFrontmatterSchema } from '@nori/shared';
import type { FrontmatterFormProps } from './FrontmatterForm.type';

const parseTags = (input: string): string[] =>
  input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

export const useFrontmatterForm = (props: Pick<FrontmatterFormProps, 'initialTitle' | 'initialCategory' | 'initialTags' | 'onNext'>) => {
  const [title, setTitle] = createSignal(props.initialTitle);
  const [category, setCategory] = createSignal(props.initialCategory);
  const [tagsInput, setTagsInput] = createSignal(props.initialTags.join(', '));
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

    setErrors({});
    props.onNext({ title: result.data.title, category: result.data.category, tags: result.data.tags });
  };

  return { title, setTitle, category, setCategory, tagsInput, setTagsInput, errors, tags, handleSubmit };
};
