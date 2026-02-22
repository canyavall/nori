import type { StepResult } from '@nori/shared';

export interface BuildMetrics {
  entry_count: number;
  category_count: number;
  tag_count: number;
  build_duration_ms: number;
  skipped_count: number;
  fast_path_used: boolean;
}

export function reportMetrics(metrics: BuildMetrics): StepResult<BuildMetrics> {
  return { success: true, data: metrics };
}
