import type { Component } from 'solid-js';
import { Show, For } from 'solid-js';
import { useMcpsSection } from './McpsSection.hook';
import { McpServerCard } from './components/McpServerCard/McpServerCard';
import { McpEditor } from './McpEditor';

export const McpsSection: Component = () => {
  const {
    servers,
    loading,
    error,
    editing,
    editorContent,
    setEditorContent,
    saving,
    saveError,
    handleEdit,
    handleCancel,
    handleSave,
  } = useMcpsSection();

  return (
    <div class="p-6">
      <Show
        when={!editing()}
        fallback={
          <McpEditor
            content={editorContent()}
            onChange={setEditorContent}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving()}
            error={saveError()}
          />
        }
      >
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold">MCP Servers</h2>
            <p class="text-sm text-[var(--color-text-muted)] mt-0.5">
              MCP server configuration from <code class="font-mono">.mcp.json</code>
            </p>
          </div>
          <button
            type="button"
            onClick={handleEdit}
            class="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Edit JSON
          </button>
        </div>

        <Show when={!loading()} fallback={<p class="text-sm text-[var(--color-text-muted)]">Loading MCPs...</p>}>
          <Show when={!error()} fallback={<p class="text-sm text-[var(--color-text-error)]">{error()}</p>}>
            <Show
              when={servers().length > 0}
              fallback={
                <p class="text-sm text-[var(--color-text-muted)] italic">
                  No MCP servers configured. Add servers by creating a <code class="font-mono">.mcp.json</code> file or clicking "Edit JSON".
                </p>
              }
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <For each={servers()}>
                  {(server) => <McpServerCard server={server} onEdit={handleEdit} />}
                </For>
              </div>
            </Show>
          </Show>
        </Show>
      </Show>
    </div>
  );
};
