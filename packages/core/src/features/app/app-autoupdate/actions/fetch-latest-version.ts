import type { StepResult, FlowError } from '@nori/shared';

export interface LatestVersionResult {
  latest_version: string;
  release_date?: string;
  download_url?: string;
}

export async function fetchLatestVersion(): Promise<StepResult<LatestVersionResult> | FlowError> {
  try {
    // TODO: Replace with actual update server URL when available
    const response = await fetch('https://api.github.com/repos/nori-app/nori/releases/latest');

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: 'UPDATE_SERVER_ERROR',
          message: `Update server returned ${response.status}`,
          severity: 'warning' as const,
          recoverable: true,
        },
      };
    }

    const data = await response.json() as { tag_name?: string; published_at?: string; assets?: Array<{ browser_download_url?: string }> };
    const version = (data.tag_name ?? '').replace(/^v/, '');

    return {
      success: true,
      data: {
        latest_version: version || '0.0.0',
        release_date: data.published_at,
        download_url: data.assets?.[0]?.browser_download_url,
      },
    };
  } catch {
    return {
      success: false,
      error: {
        code: 'NETWORK_UNAVAILABLE',
        message: 'Could not reach update server',
        severity: 'warning' as const,
        recoverable: true,
      },
    };
  }
}
