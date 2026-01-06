/**
 * Tauri API Helper
 *
 * Provides type-safe access to Tauri commands and utilities.
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Invoke Tauri backend command
 * @param command - Command name
 * @param args - Command arguments
 */
export async function invokeCommand<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  return invoke<T>(command, args);
}

/**
 * Check if running in Tauri context (not browser)
 */
export function isTauri(): boolean {
  return '__TAURI__' in window;
}
