import { createSignal } from 'solid-js';
import type { ProjectPickerProps } from './ProjectPicker.type';

export const useProjectPicker = (props: Pick<ProjectPickerProps, 'onSelect'>) => {
  const [projectPath, setProjectPath] = createSignal('');
  const [error, setError] = createSignal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const path = projectPath().trim();
    if (!path) {
      setError('Project path is required');
      return;
    }
    setError('');
    props.onSelect(path);
  };

  return { projectPath, setProjectPath, error, handleSubmit };
};
