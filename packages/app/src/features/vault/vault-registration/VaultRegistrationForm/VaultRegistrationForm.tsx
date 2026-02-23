import { Show } from 'solid-js';
import type { VaultRegistrationFormProps } from './VaultRegistrationForm.type';
import { useVaultRegistrationForm } from './VaultRegistrationForm.hook';

export const VaultRegistrationForm = (props: VaultRegistrationFormProps) => {
  const { vaultName, setVaultName, gitUrl, setGitUrl, branch, setBranch, errors, handleSubmit } = useVaultRegistrationForm(props);

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <div class="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
        <button type="button" onClick={props.onBack} class="hover:text-[var(--color-text)] transition-colors">
          ← Back
        </button>
        <span>/</span>
        <span class="capitalize">{props.vaultType === 'git' ? 'Git Repository' : 'Local Vault'}</span>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1" for="vault_name">
          Vault Name
        </label>
        <input
          id="vault_name"
          type="text"
          value={vaultName()}
          onInput={(e) => setVaultName(e.currentTarget.value)}
          placeholder="my-knowledge-vault"
          class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
        {errors().vault_name && (
          <p class="mt-1 text-xs text-[var(--color-error)]">{errors().vault_name}</p>
        )}
        <Show when={props.vaultType === 'local'}>
          <p class="mt-1 text-xs text-[var(--color-text-muted)]">
            Vault will be created at <code class="font-mono">~/.nori/vaults/{vaultName() || '<name>'}/</code>
          </p>
        </Show>
      </div>

      <Show when={props.vaultType === 'git'}>
        <div>
          <label class="block text-sm font-medium mb-1" for="git_url">
            Git URL
          </label>
          <input
            id="git_url"
            type="text"
            value={gitUrl()}
            onInput={(e) => setGitUrl(e.currentTarget.value)}
            placeholder="https://github.com/owner/repo.git"
            class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
          {errors().git_url && (
            <p class="mt-1 text-xs text-[var(--color-error)]">{errors().git_url}</p>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" for="branch">
            Branch
          </label>
          <input
            id="branch"
            type="text"
            value={branch()}
            onInput={(e) => setBranch(e.currentTarget.value)}
            placeholder="main"
            class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
          {errors().branch && (
            <p class="mt-1 text-xs text-[var(--color-error)]">{errors().branch}</p>
          )}
        </div>
      </Show>

      {props.error && (
        <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
          <p class="text-sm text-[var(--color-error)]">{props.error}</p>
        </div>
      )}

      <div class="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={props.onCancel}
          class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Register
        </button>
      </div>
    </form>
  );
};
