/**
 * Opens a native OS folder picker via the Tauri dialog plugin.
 * Returns the selected absolute path, or null if cancelled / not in Tauri.
 */
export async function pickFolder(): Promise<string | null> {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
    return null;
  }
  const { open } = await import('@tauri-apps/plugin-dialog');
  const result = await open({
    directory: true,
    multiple: false,
    title: 'Select Project Folder',
  });
  return typeof result === 'string' ? result : null;
}
