import type { PerformanceReport, ComparisonResult, MetricDiff, ImpactSummary } from '../types';

const friendlyLabels: Record<string, string> = {
  responseTimeAvg: 'Avg Response Time (ms)',
  responseTimeP95: 'p95 Response Time (ms)',
  responseTimeP99: 'p99 Response Time (ms)',
  latencyAvg: 'Avg Latency (ms)',
  throughput: 'Throughput (req/s)',
  rps: 'Requests per Second',
  errorRate: 'Error Rate (%)',
  failures: 'Failures (%)',
  cpu: 'CPU (%)',
  memory: 'Memory (MB)',
  
  // 🎯 Core Web Vitals (Critical for UX)
  fcp_avg_ms: 'First Contentful Paint - Avg (ms)',
  fcp_p95_ms: 'First Contentful Paint - p95 (ms)',
  lcp_avg_ms: 'Largest Contentful Paint - Avg (ms)',
  lcp_p95_ms: 'Largest Contentful Paint - p95 (ms)',
  cls_avg: 'Cumulative Layout Shift',
  fid_avg_ms: 'First Input Delay - Avg (ms)',
  fid_p95_ms: 'First Input Delay - p95 (ms)',
  inp_avg_ms: 'Interaction to Next Paint - Avg (ms)',
  inp_p95_ms: 'Interaction to Next Paint - p95 (ms)',
  ttfb_avg_ms: 'Time to First Byte - Avg (ms)',
  ttfb_p95_ms: 'Time to First Byte - p95 (ms)',
  
  // 🚀 Load Performance
  page_load_avg_ms: 'Page Load Time - Avg (ms)',
  page_load_p95_ms: 'Page Load Time - p95 (ms)',
  navigation_avg_ms: 'Navigation Time (ms)',
  login_avg_ms: 'Login Time - Avg (ms)',
  login_p95_ms: 'Login Time - p95 (ms)',
  
  // 🌐 HTTP Performance
  http_req_avg_ms: 'HTTP Request Duration - Avg (ms)',
  http_req_p95_ms: 'HTTP Request Duration - p95 (ms)',
  http_req_failed_rate: 'HTTP Failed Request Rate (%)',
  
  // ✅ Success Rates
  successful_requests_rate: 'Successful Request Rate (%)',
  error_rate: 'Error Rate (%)',
  checks_rate: 'Check Success Rate (%)',
  checks_success_rate: 'Overall Check Success Rate (%)',
  
  // 📊 Context Metrics
  checks_total_passes: 'Total Check Passes',
  checks_total_fails: 'Total Check Fails',
  total_iterations: 'Total Test Iterations',
  total_requests: 'Total HTTP Requests',
};

const lowerIsBetter = /(latency|response|time|duration|p\d+|error|fail|cpu|mem(ory)?|fcp|lcp|fid|inp|ttfb|cls|load)/i;
const higherIsBetter = /(throughput|rps|tps|success|pass|rate(?!.*fail|error))/i;

function betterWhenForKey(key: string): 'lower' | 'higher' {
  // Special cases for rates - most rates should be higher except error/fail rates
  if (key.includes('rate') || key.includes('success') || key.includes('pass')) {
    if (/(error|fail|http.*failed)/i.test(key)) return 'lower';
    return 'higher';
  }
  
  // CLS (Cumulative Layout Shift) should be lower
  if (key.includes('cls')) return 'lower';
  
  if (higherIsBetter.test(key)) return 'higher';
  if (lowerIsBetter.test(key)) return 'lower';
  
  // Default to lower for performance metrics
  return 'lower';
}

function labelForKey(key: string): string {
  return friendlyLabels[key] ?? key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b(p\d{2})\b/i, (m) => m.toUpperCase())
    .replace(/^cpu$/i, 'CPU (%)')
    .replace(/^mem(ory)?$/i, 'Memory');
}

export function coerceReport(raw: any, fallbackName: string): PerformanceReport | null {
  try {
    if (!raw) return null;
    if (typeof raw === 'string') raw = JSON.parse(raw);

    if (raw.metrics && typeof raw.metrics === 'object') {
      const metrics: Record<string, number> = {};
      for (const [k, v] of Object.entries(raw.metrics)) {
        const num = typeof v === 'number' ? v : Number(v);
        if (!Number.isNaN(num)) metrics[k] = num;
      }
      return { name: raw.name ?? fallbackName, timestamp: raw.timestamp, metrics };
    }

    // If top-level is an object with numeric values, treat it as metrics
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      const metrics: Record<string, number> = {};
      for (const [k, v] of Object.entries(raw)) {
        const num = typeof v === 'number' ? v : Number(v);
        if (!Number.isNaN(num)) metrics[k] = num;
      }
      return { name: raw.name ?? fallbackName, timestamp: (raw as any).timestamp, metrics };
    }

    return null;
  } catch {
    return null;
  }
}

export function compareReports(baseline: PerformanceReport, current: PerformanceReport): ComparisonResult {
  const keys = new Set<string>([...Object.keys(baseline.metrics), ...Object.keys(current.metrics)]);

  const diffs: MetricDiff[] = [];
  for (const key of keys) {
    const baseVal = baseline.metrics[key];
    const curVal = current.metrics[key];

    const betterWhen = betterWhenForKey(key);

    let change: number | null = null;
    let pct: number | null = null;
    let trend: MetricDiff['trend'] = 'unknown';

    if (typeof baseVal === 'number' && typeof curVal === 'number') {
      change = curVal - baseVal;
      pct = baseVal === 0 ? null : (change / baseVal) * 100;

      if (curVal === baseVal) trend = 'same';
      else if (betterWhen === 'lower') trend = curVal < baseVal ? 'improved' : 'worse';
      else trend = curVal > baseVal ? 'improved' : 'worse';
    }

    diffs.push({
      key,
      label: labelForKey(key),
      baseline: typeof baseVal === 'number' ? baseVal : null,
      current: typeof curVal === 'number' ? curVal : null,
      change,
      pct,
      betterWhen,
      trend,
    });
  }

  const summary = {
    improved: diffs.filter(d => d.trend === 'improved').length,
    worse: diffs.filter(d => d.trend === 'worse').length,
    same: diffs.filter(d => d.trend === 'same').length,
    unknown: diffs.filter(d => d.trend === 'unknown').length,
  };

  return { diffs: diffs.sort((a,b) => a.label.localeCompare(b.label)), summary };
}

export function suggestionsFromDiffs(diffs: MetricDiff[]): string[] {
  const tips = new Set<string>();

  const isWorse = (k: string, thresholdPct = 5) => {
    const d = diffs.find(x => x.key.toLowerCase() === k.toLowerCase());
    return d && d.trend === 'worse' && (d.pct === null || Math.abs(d.pct) >= thresholdPct);
  };

  const anyWorse = (regex: RegExp, thresholdPct = 5) =>
    diffs.some(d => regex.test(d.key) && d.trend === 'worse' && (d.pct === null || Math.abs(d.pct) >= thresholdPct));

  if (anyWorse(/response|latency|p95|p99|time|duration|fcp|lcp|ttfb|load/i)) {
    tips.add('Optimize slow endpoints: add caching (CDN/app), reduce payloads, and batch or parallelize dependent calls.');
    tips.add('Investigate database hotspots: add indexes, analyze slow queries, and consider pagination.');
    if (anyWorse(/fcp|lcp|ttfb/i)) {
      tips.add('Core Web Vitals optimization: compress images, minify CSS/JS, use a CDN, and optimize server response times.');
    }
  }

  if (anyWorse(/throughput|rps|tps/i)) {
    tips.add('Scale horizontally: increase instances or use autoscaling.');
    tips.add('Enable keep-alive and connection pooling to reduce overhead.');
  }

  if (anyWorse(/error|fail|http.*failed/i)) {
    tips.add('Add circuit breakers, timeouts, and retries to improve resiliency.');
    tips.add('Check dependency health (DB, cache, 3rd-party) and increase capacity or rate limits.');
    if (anyWorse(/check.*fail|checks.*rate/i)) {
      tips.add('Review test assertions and ensure application logic matches expected behavior.');
    }
  }

  if (anyWorse(/fid|inp/i)) {
    tips.add('Improve interactivity: reduce JavaScript execution time, defer non-critical scripts, and optimize event handlers.');
    tips.add('Consider code splitting and lazy loading to reduce initial bundle size.');
  }

  if (anyWorse(/cls/i)) {
    tips.add('Fix layout shifts: set explicit dimensions for images/videos, avoid inserting content above existing content, and use CSS transforms.');
    tips.add('Preload critical fonts and use font-display: swap to prevent invisible text periods.');
  }

  if (anyWorse(/cpu/i)) {
    tips.add('Profile CPU hotspots; optimize algorithms and avoid unnecessary JSON/serialization.');
    tips.add('Enable gzip/br compression and HTTP/2 to reduce CPU spent on IO.');
  }

  if (anyWorse(/mem|memory/i)) {
    tips.add('Find leaks with heap snapshots; reuse buffers; stream large payloads instead of loading into memory.');
    tips.add('Tune GC and object lifetimes; avoid retaining large arrays/maps.');
  }

  // Generic tip if nothing triggered but still worse metrics exist
  if (diffs.some(d => d.trend === 'worse')) {
    tips.add('Baseline again with controlled environment (same dataset, warm cache) to ensure fair comparison.');
  }

  return Array.from(tips);
}

// Enhanced comprehensive impact analysis
export function computeImpact(result: ComparisonResult): ImpactSummary {
  try {
    const { diffs, summary } = result;
    const improved = diffs.filter(d => d.trend === 'improved');
    const worse = diffs.filter(d => d.trend === 'worse');

  // Calculate legacy metrics
  const latencyKeyOrder = ['responseTimeAvg', 'latencyAvg', 'responseTimeP95', 'responseTimeP99'];
  let latencyDiff: MetricDiff | undefined;
  for (const key of latencyKeyOrder) {
    latencyDiff = diffs.find(d => d.key === key);
    if (latencyDiff) break;
  }

  let latencyImprovementMs: number | null = null;
  let latencyImprovementPct: number | null = null;
  if (latencyDiff && typeof latencyDiff.change === 'number' && latencyDiff.trend === 'improved') {
    latencyImprovementMs = latencyDiff.baseline! - latencyDiff.current!;
    latencyImprovementPct = latencyDiff.pct !== null ? -latencyDiff.pct : null;
  }

  const pctImprovements: number[] = improved
    .filter(d => d.pct !== null)
    .map(d => d.betterWhen === 'lower' ? -(d.pct as number) : (d.pct as number))
    .filter(v => v > 0);
  const avgPctImprovement = pctImprovements.length
    ? pctImprovements.reduce((a, b) => a + b, 0) / pctImprovements.length
    : null;

  const estTimeSavedPer1kRequestsMs = latencyImprovementMs !== null
    ? Math.round(latencyImprovementMs * 1000)
    : null;

  const suggestionEffectivenessPct = (improved.length + worse.length) > 0
    ? Number(((improved.length / (improved.length + worse.length)) * 100).toFixed(1))
    : null;

  // 🚨 System Health Analysis
  const errorRate = findMetric(diffs, ['error_rate', 'http_req_failed_rate', 'failures']);
  const successRate = findMetric(diffs, ['successful_requests_rate', 'checks_rate', 'checks_success_rate']);
  
  let systemHealthStatus: 'healthy' | 'degraded' | 'critical' | 'failed' = 'healthy';
  if (errorRate && errorRate.pct && Math.abs(errorRate.pct) > 100) systemHealthStatus = 'failed';
  else if (errorRate && errorRate.pct && Math.abs(errorRate.pct) > 50) systemHealthStatus = 'critical';
  else if (successRate && successRate.pct && successRate.pct < -10) systemHealthStatus = 'degraded';

  const availability = successRate?.current ? Math.round((successRate.current as number) * 100) : null;

  // 🎯 Core Web Vitals Analysis
  const fcp = findMetric(diffs, ['fcp_avg_ms', 'browser_web_vital_fcp']);
  const lcp = findMetric(diffs, ['lcp_avg_ms', 'browser_web_vital_lcp']);
  const cls = findMetric(diffs, ['cls_avg', 'browser_web_vital_cls']);
  const fid = findMetric(diffs, ['fid_avg_ms', 'browser_web_vital_fid']);
  const ttfb = findMetric(diffs, ['ttfb_avg_ms', 'browser_web_vital_ttfb']);

  let coreWebVitalsScore: 'good' | 'needs-improvement' | 'poor' = 'good';
  const vitalsIssues = [fcp, lcp, ttfb].filter(v => v && v.current && (v.current as number) > 2500).length;
  if (vitalsIssues >= 2) coreWebVitalsScore = 'poor';
  else if (vitalsIssues >= 1) coreWebVitalsScore = 'needs-improvement';

  // 💼 Business Impact Analysis
  let revenueRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let userExperience: 'excellent' | 'good' | 'degraded' | 'poor' = 'good';
  let seoImpact: 'positive' | 'neutral' | 'negative' | 'severe' = 'neutral';

  if (systemHealthStatus === 'failed' || (errorRate && Math.abs(errorRate.pct!) > 100)) {
    revenueRisk = 'critical';
    userExperience = 'poor';
    seoImpact = 'severe';
  } else if (systemHealthStatus === 'critical' || coreWebVitalsScore === 'poor') {
    revenueRisk = 'high';
    userExperience = 'degraded';
    seoImpact = 'negative';
  } else if (systemHealthStatus === 'degraded' || coreWebVitalsScore === 'needs-improvement') {
    revenueRisk = 'medium';
    userExperience = 'degraded';
  }

  const estimatedLoss = revenueRisk === 'critical' ? '40-90% transaction failures' :
                      revenueRisk === 'high' ? '20-40% user abandonment' :
                      revenueRisk === 'medium' ? '10-20% conversion impact' : null;

  // 🎯 Performance Categories
  const categories = categorizeMetrics(diffs);

  // 🚨 Priority Issues
  const priorityIssues = {
    critical: diffs.filter(d => d.trend === 'worse' && Math.abs(d.pct!) > 50),
    high: diffs.filter(d => d.trend === 'worse' && Math.abs(d.pct!) > 20 && Math.abs(d.pct!) <= 50),
    medium: diffs.filter(d => d.trend === 'worse' && Math.abs(d.pct!) > 10 && Math.abs(d.pct!) <= 20),
  };

  return {
    improvedMetrics: summary.improved,
    worseMetrics: summary.worse,
    sameMetrics: summary.same,
    avgPctImprovement: avgPctImprovement !== null ? Number(avgPctImprovement.toFixed(1)) : null,
    netImprovementScore: summary.improved - summary.worse,
    latencyImprovementMs: latencyImprovementMs !== null ? Number(latencyImprovementMs.toFixed(2)) : null,
    latencyImprovementPct: latencyImprovementPct !== null ? Number(latencyImprovementPct.toFixed(2)) : null,
    estTimeSavedPer1kRequestsMs,
    suggestionEffectivenessPct,
    
    systemHealth: {
      status: systemHealthStatus,
      errorRate,
      successRate,
      availability,
    },
    
    coreWebVitals: {
      fcp,
      lcp,
      cls,
      fid,
      ttfb,
      score: coreWebVitalsScore,
    },
    
    businessImpact: {
      revenueRisk,
      userExperience,
      seoImpact,
      estimatedLoss,
    },
    
    categories,
    priorityIssues,
  };
  } catch (error) {
    console.error('❌ Enhanced impact analysis failed, falling back to basic analysis:', error);
    
    // Fallback to basic impact analysis
    const { diffs, summary } = result;
    const improved = diffs.filter(d => d.trend === 'improved');
    const worse = diffs.filter(d => d.trend === 'worse');

    const latencyKeyOrder = ['responseTimeAvg', 'latencyAvg', 'responseTimeP95', 'responseTimeP99'];
    let latencyDiff: MetricDiff | undefined;
    for (const key of latencyKeyOrder) {
      latencyDiff = diffs.find(d => d.key === key);
      if (latencyDiff) break;
    }

    let latencyImprovementMs: number | null = null;
    let latencyImprovementPct: number | null = null;
    if (latencyDiff && typeof latencyDiff.change === 'number' && latencyDiff.trend === 'improved') {
      latencyImprovementMs = latencyDiff.baseline! - latencyDiff.current!;
      latencyImprovementPct = latencyDiff.pct !== null ? -latencyDiff.pct : null;
    }

    const pctImprovements: number[] = improved
      .filter(d => d.pct !== null)
      .map(d => d.betterWhen === 'lower' ? -(d.pct as number) : (d.pct as number))
      .filter(v => v > 0);
    const avgPctImprovement = pctImprovements.length
      ? pctImprovements.reduce((a, b) => a + b, 0) / pctImprovements.length
      : null;

    const estTimeSavedPer1kRequestsMs = latencyImprovementMs !== null
      ? Math.round(latencyImprovementMs * 1000)
      : null;

    const suggestionEffectivenessPct = (improved.length + worse.length) > 0
      ? Number(((improved.length / (improved.length + worse.length)) * 100).toFixed(1))
      : null;

    // Return basic structure with safe defaults
    return {
      improvedMetrics: summary.improved,
      worseMetrics: summary.worse,
      sameMetrics: summary.same,
      avgPctImprovement: avgPctImprovement !== null ? Number(avgPctImprovement.toFixed(1)) : null,
      netImprovementScore: summary.improved - summary.worse,
      latencyImprovementMs: latencyImprovementMs !== null ? Number(latencyImprovementMs.toFixed(2)) : null,
      latencyImprovementPct: latencyImprovementPct !== null ? Number(latencyImprovementPct.toFixed(2)) : null,
      estTimeSavedPer1kRequestsMs,
      suggestionEffectivenessPct,
      
      systemHealth: {
        status: 'healthy' as const,
        errorRate: null,
        successRate: null,
        availability: null,
      },
      
      coreWebVitals: {
        fcp: null,
        lcp: null,
        cls: null,
        fid: null,
        ttfb: null,
        score: 'good' as const,
      },
      
      businessImpact: {
        revenueRisk: 'low' as const,
        userExperience: 'good' as const,
        seoImpact: 'neutral' as const,
        estimatedLoss: null,
      },
      
      categories: {
        systemReliability: { score: 100, status: 'good' as const, metrics: [] },
        performance: { score: 100, status: 'good' as const, metrics: [] },
        userExperience: { score: 100, status: 'good' as const, metrics: [] },
      },
      
      priorityIssues: {
        critical: [],
        high: [],
        medium: [],
      },
    };
  }
}

// Helper function to find metrics by multiple possible keys
function findMetric(diffs: MetricDiff[], keys: string[]): MetricDiff | null {
  for (const key of keys) {
    const metric = diffs.find(d => d.key === key);
    if (metric) return metric;
  }
  return null;
}

// Helper function to categorize metrics into performance domains
function categorizeMetrics(diffs: MetricDiff[]) {
  const systemReliabilityKeys = ['error_rate', 'successful_requests_rate', 'checks_rate', 'http_req_failed_rate'];
  const performanceKeys = ['responseTimeAvg', 'http_req_avg_ms', 'page_load_avg_ms', 'navigation_avg_ms', 'login_avg_ms'];
  const userExperienceKeys = ['fcp_avg_ms', 'lcp_avg_ms', 'cls_avg', 'fid_avg_ms', 'ttfb_avg_ms'];

  const systemReliability = diffs.filter(d => systemReliabilityKeys.some(key => d.key.includes(key)));
  const performance = diffs.filter(d => performanceKeys.some(key => d.key.includes(key)));
  const userExperience = diffs.filter(d => userExperienceKeys.some(key => d.key.includes(key)));

  return {
    systemReliability: {
      score: calculateCategoryScore(systemReliability),
      status: getCategoryStatus(systemReliability),
      metrics: systemReliability,
    },
    performance: {
      score: calculateCategoryScore(performance),
      status: getCategoryStatus(performance),
      metrics: performance,
    },
    userExperience: {
      score: calculateCategoryScore(userExperience),
      status: getCategoryStatus(userExperience),
      metrics: userExperience,
    },
  };
}

function calculateCategoryScore(metrics: MetricDiff[]): number {
  if (metrics.length === 0) return 100;
  const improved = metrics.filter(m => m.trend === 'improved').length;
  const total = metrics.length;
  return Math.round((improved / total) * 100);
}

function getCategoryStatus(metrics: MetricDiff[]): 'good' | 'warning' | 'critical' {
  const criticalIssues = metrics.filter(m => m.trend === 'worse' && Math.abs(m.pct!) > 50).length;
  const highIssues = metrics.filter(m => m.trend === 'worse' && Math.abs(m.pct!) > 20).length;
  
  if (criticalIssues > 0) return 'critical';
  if (highIssues > 0) return 'warning';
  return 'good';
}
