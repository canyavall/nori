import { createSignal } from 'solid-js';
import type { ContentEditorProps } from './ContentEditor.type';

export const useContentEditor = (props: Pick<ContentEditorProps, 'initialContent' | 'onSave'>) => {
  const [content, setContent] = createSignal(props.initialContent);

  const handleSave = () => {
    props.onSave(content());
  };

  const isContentEmpty = () => !content().trim();

  return { content, setContent, handleSave, isContentEmpty };
};
