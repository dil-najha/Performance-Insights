import type { PerformanceReport, ComparisonResult, MetricDiff } from '../types';

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
};

const lowerIsBetter = /(latency|response|time|p\d+|error|fail|cpu|mem(ory)?)/i;
const higherIsBetter = /(throughput|rps|tps|success|pass)/i;

function betterWhenForKey(key: string): 'lower' | 'higher' {
  if (higherIsBetter.test(key)) return 'higher';
  return 'lowerIsBetter'.includes('true') && lowerIsBetter.test(key) ? 'lower' : 'lower';
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
