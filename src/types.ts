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
  selectedModel?: string;
  deployment_id?: string;
  
  // ✅ CUSTOM CONTEXT FIELDS FOR BETTER AI RESULTS
  business_criticality?: 'low' | 'medium' | 'high' | 'critical';
  recent_changes?: string;
  performance_goals?: string;
  known_issues?: string;
  custom_focus?: string;
  team?: 'frontend' | 'backend' | 'devops' | 'fullstack';
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
  
  // ✅ NEW: Advanced Context For AI (Optional)
  advanced_context?: string;
}

export interface EnhancedComparisonResult extends ComparisonResult {
  aiInsights?: AIInsight[];
  explanation?: string;
  predictions?: AIInsight[];
}

// 📈 Derived impact metrics for emphasizing numeric value
export interface ImpactSummary {
  improvedMetrics: number;
  worseMetrics: number;
  sameMetrics: number;
  avgPctImprovement: number | null; // average percent improvement across improved metrics
  netImprovementScore: number; // improved - worse
  latencyImprovementMs: number | null; // (baseline - current) for primary latency metric if improved
  latencyImprovementPct: number | null; // percent change for primary latency metric
  estTimeSavedPer1kRequestsMs: number | null; // latencyImprovementMs * 1000 when available
  suggestionEffectivenessPct: number | null; // heuristic: improved / (improved + worse)
}