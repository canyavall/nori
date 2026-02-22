import type { StepResult } from '@nori/shared';

export interface RegenerateMetrics {
  entry_count: number;
  skipped_count: number;
  build_duration_ms: number;
}

export function reportMetrics(metrics: RegenerateMetrics): StepResult<RegenerateMetrics> {
  return { success: true, data: metrics };
}
