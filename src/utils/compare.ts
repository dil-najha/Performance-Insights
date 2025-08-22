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
  memory: 'Memory (MB)'
};

const lowerIsBetter = /(latency|response|time|p\d+|error|fail|cpu|mem(ory)?)/i;
const higherIsBetter = /(throughput|rps|tps|success|pass)/i;

function betterWhenForKey(key: string): 'lower' | 'higher' {
  if (higherIsBetter.test(key)) return 'higher';
  return 'lowerIsBetter'.includes('true') && lowerIsBetter.test(key) ? 'lower' : 'lower';
}

function labelForKey(key: string): string {
  if (friendlyLabels[key]) return friendlyLabels[key];
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> spaces
    .replace(/_/g, ' ') // snake_case -> spaces
    .replace(/\./g, ' / ') // dot.path -> hierarchy indicator
    .replace(/p\((\d+)\)/gi, 'p$1') // p(95) -> p95
    .replace(/\b(p\d{2})\b/gi, (m) => m.toUpperCase())
    .replace(/^cpu$/i, 'CPU (%)')
    .replace(/^mem(ory)?$/i, 'Memory');
}

// Recursively flatten any nested JSON object collecting numeric leaves into a metrics map.
// Special handling: if key === 'values', we do not include it in the flattened path so that
// a metric like metricName.values.avg becomes metricName.avg.
function flattenNumeric(obj: any, basePath = '', out: Record<string, number> = {}, depth = 0) {
  if (!obj || typeof obj !== 'object') return out;
  // Safety guard to avoid extremely deep recursion on pathological JSON
  if (depth > 8) return out;
  for (const [kRaw, v] of Object.entries(obj)) {
    const k = kRaw; // raw key before sanitation for path decisions
    const sanitizedKey = k.replace(/p\((\d+)\)/i, 'p$1');
    const newPath = k === 'values' ? basePath : (basePath ? `${basePath}.${sanitizedKey}` : sanitizedKey);
    if (typeof v === 'number' && isFinite(v)) {
      out[newPath] = v;
    } else if (typeof v === 'string') {
      const num = Number(v);
      if (!isNaN(num) && isFinite(num)) out[newPath] = num;
    } else if (v && typeof v === 'object') {
      // Skip obviously non-metric structural booleans-only objects (like { ok: true }) unless numeric inside
      const values = Object.values(v);
      const hasNumeric = values.some(x => typeof x === 'number');
      const hasNestedObjects = values.some(x => x && typeof x === 'object');
      if (hasNumeric || hasNestedObjects) {
        flattenNumeric(v, newPath, out, depth + 1);
      }
    }
  }
  return out;
}

export function coerceReport(raw: any, fallbackName: string): PerformanceReport | null {
  try {
    if (!raw) return null;
    if (typeof raw === 'string') raw = JSON.parse(raw);

    let metrics: Record<string, number> = {};

    if (raw.metrics && typeof raw.metrics === 'object') {
      // Could be flat or nested (k6-style). Use flatten to be generic.
      metrics = flattenNumeric(raw.metrics);
    }

    // If still empty, attempt flatten on full object (excluding name/timestamp like keys)
    if (Object.keys(metrics).length === 0 && typeof raw === 'object' && !Array.isArray(raw)) {
      const clone = { ...raw };
      delete (clone as any).name;
      delete (clone as any).timestamp;
      metrics = flattenNumeric(clone);
    }

    if (Object.keys(metrics).length > 0) {
      return { name: raw.name ?? fallbackName, timestamp: raw.timestamp, metrics };
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

// Heuristic importance scoring for selecting a concise subset of metrics.
// Scores based on presence of key performance indicators (latency, errors, throughput, core web vitals, resource usage).
export function scoreMetricImportance(key: string): number {
  let score = 0;
  const k = key.toLowerCase();
  if (/\b(lcp|fcp|cls|fid|inp|ttfb)\b/.test(k)) score += 9; // Core Web Vitals
  if (/(latency|response|duration|time|load)/.test(k)) score += 8; // Timing
  if (/(throughput|rps|reqs_per_sec|requestspersec|requests_per_sec|reqs|requests)/.test(k)) score += 7; // Capacity
  if (/(error|fail)/.test(k)) score += 8; // Reliability
  if (/(cpu|memory|heap|rss)/.test(k)) score += 6; // Resource
  if (/(p95|p99)/.test(k)) score += 5; // Tail latency
  if (/(avg|median|med)/.test(k)) score += 3; // Central tendency
  if (/rate/.test(k)) score += 2; // Generic rate
  // Penalize extremely deep/derived metrics to prefer primary metrics
  const depth = key.split('.').length;
  score -= Math.max(0, depth - 3); // slight penalty
  return score;
}

export function selectTopImportantDiffs(all: MetricDiff[], max = 25): MetricDiff[] {
  // Keep all if already small
  if (all.length <= max) return all;
  // Score & sort
  return [...all]
    .map(d => ({ d, s: scoreMetricImportance(d.key) }))
    .sort((a,b) => b.s - a.s)
    .slice(0, max)
    .map(x => x.d)
    .sort((a,b) => a.label.localeCompare(b.label));
}

export function suggestionsFromDiffs(diffs: MetricDiff[]): string[] {
  const tips = new Set<string>();

  const isWorse = (k: string, thresholdPct = 5) => {
    const d = diffs.find(x => x.key.toLowerCase() === k.toLowerCase());
    return d && d.trend === 'worse' && (d.pct === null || Math.abs(d.pct) >= thresholdPct);
  };

  const anyWorse = (regex: RegExp, thresholdPct = 5) =>
    diffs.some(d => regex.test(d.key) && d.trend === 'worse' && (d.pct === null || Math.abs(d.pct) >= thresholdPct));

  if (anyWorse(/response|latency|p95|p99|time/i)) {
    tips.add('Optimize slow endpoints: add caching (CDN/app), reduce payloads, and batch or parallelize dependent calls.');
    tips.add('Investigate database hotspots: add indexes, analyze slow queries, and consider pagination.');
  }

  if (anyWorse(/throughput|rps|tps/i)) {
    tips.add('Scale horizontally: increase instances or use autoscaling.');
    tips.add('Enable keep-alive and connection pooling to reduce overhead.');
  }

  if (anyWorse(/error|fail/i)) {
    tips.add('Add circuit breakers, timeouts, and retries to improve resiliency.');
    tips.add('Check dependency health (DB, cache, 3rd-party) and increase capacity or rate limits.');
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

// Derive an ImpactSummary to quantify improvements
export function computeImpact(result: ComparisonResult): ImpactSummary {
  const { diffs, summary } = result;
  const improved = diffs.filter(d => d.trend === 'improved');
  const worse = diffs.filter(d => d.trend === 'worse');
  // Dynamically pick a primary latency/time metric instead of hard-coded keys.
  // Preference: improved metrics whose key indicates time/latency and includes an average/median/p95/p99 indicator.
  const latencyPattern = /(latency|response|time|duration|lcp|fcp|ttfb|load)/i;
  const centralTendencyPattern = /(\bavg\b|\.avg$|median|med|p95|p99)/i;
  let latencyDiff: MetricDiff | undefined = diffs.find(d => d.trend === 'improved' && latencyPattern.test(d.key) && centralTendencyPattern.test(d.key));
  if (!latencyDiff) latencyDiff = diffs.find(d => latencyPattern.test(d.key) && centralTendencyPattern.test(d.key));
  if (!latencyDiff) latencyDiff = diffs.find(d => latencyPattern.test(d.key));

  let latencyImprovementMs: number | null = null;
  let latencyImprovementPct: number | null = null;
  if (latencyDiff && typeof latencyDiff.change === 'number' && typeof latencyDiff.baseline === 'number' && typeof latencyDiff.current === 'number') {
    // For lower-is-better latency metrics, improvement means negative change
    const isImproved = latencyDiff.trend === 'improved';
    if (isImproved) {
      latencyImprovementMs = latencyDiff.baseline - latencyDiff.current; // positive number when improved
      latencyImprovementPct = latencyDiff.pct !== null ? -latencyDiff.pct : null; // pct is current-baseline / baseline *100; invert sign for improvement display
    }
  }

  const pctImprovements: number[] = improved
    .filter(d => d.pct !== null)
    .map(d => {
      // For improvements where lower is better we want positive numbers
      return d.betterWhen === 'lower' ? -(d.pct as number) : (d.pct as number);
    })
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

  // Helper to fetch metric diff by regex list
  const findMetric = (patterns: RegExp[]) => {
    for (const p of patterns) {
      const m = diffs.find(d => p.test(d.key));
      if (m) return m;
    }
    return undefined;
  };

  const throughputDiff = findMetric([/(throughput|rps|requestsPerSec|requests_per_sec|reqs_per_sec|reqs|requests)/i]);
  const errorDiff = findMetric([/(errorRate|failures?|errors?\.rate|errors?)/i]);
  const cpuDiff = findMetric([/^cpu$/i]);
  const memDiff = findMetric([/^memory$/i]);

  function normalizedPct(d?: MetricDiff): number | null {
    if (!d || d.pct === null) return null;
    // For lower-is-better metrics invert sign so improvement is positive
    const val = d.betterWhen === 'lower' ? -d.pct : d.pct;
    return val;
  }

  const throughputChangePct = normalizedPct(throughputDiff) !== null ? Number((normalizedPct(throughputDiff) as number).toFixed(2)) : null;
  // Error rate improvement: positive if error rate decreased
  let errorRateChangePct: number | null = null;
  if (errorDiff && errorDiff.pct !== null) {
    errorRateChangePct = errorDiff.betterWhen === 'lower' ? -errorDiff.pct : errorDiff.pct;
    errorRateChangePct = Number(errorRateChangePct.toFixed(2));
  }
  const cpuChangePct = normalizedPct(cpuDiff) !== null ? Number((normalizedPct(cpuDiff) as number).toFixed(2)) : null;
  const memoryChangePct = normalizedPct(memDiff) !== null ? Number((normalizedPct(memDiff) as number).toFixed(2)) : null;

  // Composite performance score: (sum positive improvements - sum regressions) / total * 100
  const normalizedAll = diffs
    .filter(d => d.pct !== null && d.trend !== 'same' && d.trend !== 'unknown')
    .map(d => (d.betterWhen === 'lower' ? -d.pct! : d.pct!));
  let performanceScore: number | null = null;
  if (normalizedAll.length) {
    const positives = normalizedAll.filter(v => v > 0).reduce((a,b)=>a+b,0);
    const negatives = normalizedAll.filter(v => v < 0).reduce((a,b)=>a+b,0); // negative sum
    performanceScore = ((positives + negatives) / normalizedAll.length); // negatives already negative
    performanceScore = Number(Math.max(-100, Math.min(100, performanceScore)).toFixed(1));
  }

  // Estimated user hours saved per day (if throughput & latency improvement present)
  let estUserHoursSavedPerDay: number | null = null;
  if (throughputDiff && throughputDiff.baseline !== null && throughputDiff.current !== null && latencyImprovementMs !== null) {
    // Use current throughput (requests/sec)
    const currentThroughput = throughputDiff.current;
    const secondsPerDay = 86400;
    const msSavedPerRequest = latencyImprovementMs; // ms
    const totalMsSavedPerDay = currentThroughput * secondsPerDay * msSavedPerRequest;
    estUserHoursSavedPerDay = Number((totalMsSavedPerDay / 1000 / 3600).toFixed(2));
  }

  // Top improved / regressed by absolute percent magnitude (normalized so higher positive is better)
  const decorated = diffs
    .filter(d => d.pct !== null && d.trend !== 'same' && d.trend !== 'unknown')
    .map(d => ({
      d,
      norm: d.betterWhen === 'lower' ? -d.pct! : d.pct!
    }));
  const topImproved = decorated.filter(x => x.norm > 0).sort((a,b)=>b.norm - a.norm).slice(0,3)
    .map(x => ({ label: x.d.label, pct: Number(x.norm.toFixed(1)) }));
  const topRegressed = decorated.filter(x => x.norm < 0).sort((a,b)=>a.norm - b.norm).slice(0,3)
    .map(x => ({ label: x.d.label, pct: Number(x.norm.toFixed(1)) }));

  const currentOverallBetter = performanceScore !== null ? performanceScore > 0 : (summary.improved >= summary.worse);

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
    throughputChangePct,
    errorRateChangePct,
    cpuChangePct,
    memoryChangePct,
    performanceScore,
    estUserHoursSavedPerDay,
    topImproved,
    topRegressed,
    currentOverallBetter,
  };
}
