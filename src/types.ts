export type Metrics = Record<string, number>;

export interface PerformanceReport {
  name: string;
  timestamp?: string | number;
  metrics: Metrics;
}

export interface MetricDiff {
  key: string;
  label: string;
  baseline: number | null;
  current: number | null;
  change: number | null; // absolute change (current - baseline)
  pct: number | null; // percent change
  betterWhen: 'lower' | 'higher';
  trend: 'improved' | 'worse' | 'same' | 'unknown';
}

export interface ComparisonResult {
  diffs: MetricDiff[];
  summary: {
    improved: number;
    worse: number;
    same: number;
    unknown: number;
  };
}
