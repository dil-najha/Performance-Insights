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

// Code-level recommendation types
export interface CodeRecommendation {
  file: string;
  current_code: string;
  optimized_code: string;
  explanation: string;
  expected_improvement?: string;
}

export interface AffectedFile {
  path: string;
  functions: string[];
  lines: number[];
  issue: string;
}

// AI-related types
export interface AIInsight {
  type: 'critical_issue' | 'root_cause' | 'optimization' | 'monitoring' | 'anomaly' | 'suggestion' | 'prediction' | 'explanation' | 'code_optimization';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  title: string;
  description: string;
  actionable_steps?: string[]; // Legacy field
  affected_metrics: string[];
  timestamp?: string;
  business_impact?: string;
  effort_estimate?: 'low' | 'medium' | 'high';
  
  // New systematic prompt fields
  root_cause_analysis?: string;
  immediate_actions?: string[];
  code_optimizations?: string[];
  long_term_solutions?: string[];
  priority_score?: 'P1' | 'P2' | 'P3' | 'P4' | 'P5'; // P1=Critical, P2=High, P3=Medium, P4=Low, P5=Recommended
  expected_improvement?: string;
  
  // 💻 NEW: Code-level analysis fields
  affected_files?: AffectedFile[];
  code_recommendations?: CodeRecommendation[];
}

export interface SystemContext {
  stack?: string;
  environment?: 'dev' | 'staging' | 'prod';
  scale?: 'small' | 'medium' | 'large';
  selectedModel?: string;
  deployment_id?: string;
  
  // ✅ NEW CUSTOM CONTEXT FIELDS FOR BETTER AI RESULTS
  business_criticality?: 'low' | 'medium' | 'high' | 'critical';
  recent_changes?: string;
  performance_goals?: string;
  known_issues?: string;
  custom_focus?: string;
  team?: 'frontend' | 'backend' | 'devops' | 'fullstack';
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
  
  // Code Review Mode
  enableCodeReview?: boolean; // New toggle for code review mode
}

export interface EnhancedComparisonResult extends ComparisonResult {
  aiInsights?: AIInsight[];
  explanation?: string;
  predictions?: AIInsight[];
}

// 📈 Enhanced impact metrics for comprehensive analysis
export interface ImpactSummary {
  improvedMetrics: number;
  worseMetrics: number;
  sameMetrics: number;
  avgPctImprovement: number | null;
  netImprovementScore: number;
  latencyImprovementMs: number | null;
  latencyImprovementPct: number | null;
  estTimeSavedPer1kRequestsMs: number | null;
  suggestionEffectivenessPct: number | null;
  
  // 🚨 Critical System Health
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical' | 'failed';
    errorRate: MetricDiff | null;
    successRate: MetricDiff | null;
    availability: number | null;
  };
  
  // 🎯 Core Web Vitals
  coreWebVitals: {
    fcp: MetricDiff | null;
    lcp: MetricDiff | null;
    cls: MetricDiff | null;
    fid: MetricDiff | null;
    ttfb: MetricDiff | null;
    score: 'good' | 'needs-improvement' | 'poor';
  };
  
  // 💼 Business Impact
  businessImpact: {
    revenueRisk: 'low' | 'medium' | 'high' | 'critical';
    userExperience: 'excellent' | 'good' | 'degraded' | 'poor';
    seoImpact: 'positive' | 'neutral' | 'negative' | 'severe';
    estimatedLoss: string | null;
  };
  
  // 🎯 Performance Categories
  categories: {
    systemReliability: {
      score: number;
      status: 'good' | 'warning' | 'critical';
      metrics: MetricDiff[];
    };
    performance: {
      score: number;
      status: 'good' | 'warning' | 'critical';
      metrics: MetricDiff[];
    };
    userExperience: {
      score: number;
      status: 'good' | 'warning' | 'critical';
      metrics: MetricDiff[];
    };
  };
  
  // 🚨 Priority Issues
  priorityIssues: {
    critical: MetricDiff[];
    high: MetricDiff[];
    medium: MetricDiff[];
  };
}

// ===============================================
// 🧪 ENHANCED SOURCE CODE TYPES FOR TEST-APP AUTO-LOADING
// ===============================================
// This section can be easily removed if needed

// Enhanced Source Code File interface
export interface SourceCodeFile {
  path: string;
  content: string;
  language: string;
  
  // 🧪 NEW: Additional fields for test-app auto-loading
  category?: string;    // "Backend API Server", "Dashboard Component", etc.
  size?: number;        // File size in bytes
}

// Enhanced Source Code interface  
export interface SourceCode {
  files: SourceCodeFile[];
  entryPoints?: string[];
  totalFiles?: number;
  totalSize?: number;
  
  // 🧪 NEW: Auto-loading identification
  source?: 'manual-upload' | 'test-app-auto-loaded';  // How the code was provided
  timestamp?: string;   // When the code was loaded
}