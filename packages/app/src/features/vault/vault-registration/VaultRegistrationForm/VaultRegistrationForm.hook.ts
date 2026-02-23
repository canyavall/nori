import { createSignal } from 'solid-js';
import { vaultRegistrationSchema, vaultLocalRegistrationSchema } from '@nori/shared';
import type { VaultRegistrationFormProps } from './VaultRegistrationForm.type';

export const useVaultRegistrationForm = (props: Pick<VaultRegistrationFormProps, 'vaultType' | 'onSubmit'>) => {
  const [vaultName, setVaultName] = createSignal('');
  const [gitUrl, setGitUrl] = createSignal('');
  const [branch, setBranch] = createSignal('main');
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (props.vaultType === 'local') {
      const result = vaultLocalRegistrationSchema.safeParse({
        vault_type: 'local',
        vault_name: vaultName(),
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
      props.onSubmit(result.data);
      return;
    }

    const result = vaultRegistrationSchema.safeParse({
      vault_type: 'git',
      vault_name: vaultName(),
      git_url: gitUrl(),
      branch: branch(),
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
    props.onSubmit(result.data);
  };

  return { vaultName, setVaultName, gitUrl, setGitUrl, branch, setBranch, errors, handleSubmit };
};
