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

// AI-related types
export interface AIInsight {
  type: 'anomaly' | 'suggestion' | 'prediction' | 'root_cause' | 'explanation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  title: string;
  description: string;
  actionable_steps: string[];
  affected_metrics: string[];
  timestamp?: string;
}

export interface SystemContext {
  stack?: string;
  environment?: 'dev' | 'staging' | 'prod';
  scale?: 'small' | 'medium' | 'large';
  version?: string;
  deployment_id?: string;
}

export interface EnhancedComparisonResult extends ComparisonResult {
  aiInsights?: AIInsight[];
  explanation?: string;
  predictions?: AIInsight[];
}