import type { StepResult, FlowError } from '@nori/shared';

export interface ApplyUpdateResult {
  new_version: string;
  applied: boolean;
  restart_required: boolean;
}

export async function applyUpdate(
  newVersion: string,
  _downloadUrl?: string
): Promise<StepResult<ApplyUpdateResult> | FlowError> {
  // Tauri auto-updater handles the actual download and install.
  // This action signals the frontend to trigger the Tauri updater API.
  // The core package does not perform the actual update — it only provides
  // the version check result. The frontend/Tauri layer calls
  // @tauri-apps/plugin-updater when this step indicates an update is available.
  return {
    success: true,
    data: {
      new_version: newVersion,
      applied: false, // Tauri handles actual apply
      restart_required: true,
    },
  };
}
