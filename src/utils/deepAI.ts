import { ComparisonResult, AIInsight, MetricDiff } from '../types';

interface DeepAIResult {
  aiInsights: AIInsight[];
  predictions: AIInsight[];
  explanation: string;
}

// Heuristic weights for impact estimation
const WEIGHTS: Record<string, number> = {
  latency: 3,
  response: 3,
  error: 4,
  fail: 4,
  throughput: 3,
  rps: 3,
  cpu: 2,
  mem: 2,
  memory: 2
};

function classify(diff: MetricDiff): { category: string; impact: number } {
  const k = diff.key.toLowerCase();
  let cat = 'other';
  if (/error|fail/.test(k)) cat = 'stability';
  else if (/latency|response|time|p95|p99/.test(k)) cat = 'latency';
  else if (/throughput|rps|tps/.test(k)) cat = 'throughput';
  else if (/cpu/.test(k)) cat = 'cpu';
  else if (/mem|memory/.test(k)) cat = 'memory';
  const base = WEIGHTS[k.split(/[^a-z]/)[0] || ''] || WEIGHTS[cat] || 1;
  // Larger absolute percent change => higher impact; improvements positive, regressions negative
  const pct = diff.pct ?? 0;
  const normalized = diff.betterWhen === 'lower' ? -pct : pct; // improvement positive
  const impact = normalized * base;
  return { category: cat, impact };
}

function buildInsight(diff: MetricDiff): AIInsight | null {
  if (diff.pct === null || diff.trend === 'same' || diff.trend === 'unknown') return null;
  const { category, impact } = classify(diff);
  const improved = diff.trend === 'improved';
  const absPct = Math.abs(diff.pct);
  // Determine severity (for regressions higher impact => higher severity)
  let severity: AIInsight['severity'] = 'low';
  const absImpact = Math.abs(impact);
  if (absImpact > 40) severity = 'critical';
  else if (absImpact > 25) severity = 'high';
  else if (absImpact > 10) severity = 'medium';

  const title = improved
    ? `${diff.label} improved by ${((diff.betterWhen === 'lower' ? -diff.pct! : diff.pct!) ).toFixed(1)}%`
    : `${diff.label} regressed by ${((diff.betterWhen === 'lower' ? diff.pct! : -diff.pct!) ).toFixed(1)}%`;

  const affected_metrics = [diff.label];
  const actionable_steps: string[] = [];
  if (category === 'latency') {
    if (improved) actionable_steps.push('Convert this improvement into a new performance budget / SLO.');
    else actionable_steps.push('Profile hottest endpoints (APM / flame graphs) to isolate latency sources.');
    actionable_steps.push('Cache expensive computations and batch dependent calls where feasible.');
  } else if (category === 'throughput') {
    if (!improved) actionable_steps.push('Check saturation: increase concurrency limits or scale instances.');
    actionable_steps.push('Enable keep-alive / connection pooling to reduce protocol overhead.');
  } else if (category === 'stability') {
    actionable_steps.push('Inspect recent deployment changes & dependency versions.');
    actionable_steps.push('Add / tune circuit breakers, retries and timeouts around slow externals.');
  } else if (category === 'cpu') {
    actionable_steps.push('Capture CPU profiles in representative load to identify top functions.');
    actionable_steps.push('Optimize hot loops; reduce unnecessary JSON serialization / logging.');
  } else if (category === 'memory') {
    actionable_steps.push('Capture heap snapshots; track retained objects growth.');
    actionable_steps.push('Stream large payloads; reuse buffers to reduce allocations.');
  }

  const descriptionParts: string[] = [];
  if (improved) {
    descriptionParts.push(`${diff.label} shows a positive change of ${((diff.betterWhen === 'lower' ? -diff.pct! : diff.pct!) ).toFixed(2)}%.`);
  } else {
    descriptionParts.push(`${diff.label} worsened by ${((diff.betterWhen === 'lower' ? diff.pct! : -diff.pct!) ).toFixed(2)}%.`);
  }
  descriptionParts.push(`Category: ${category}. Estimated impact weight: ${impact.toFixed(1)}.`);

  const insight: AIInsight = {
    type: improved ? 'suggestion' : 'anomaly',
    severity,
    confidence: Math.min(0.95, 0.5 + Math.min(absPct, 50) / 100),
    title,
    description: descriptionParts.join(' '),
    actionable_steps,
    affected_metrics,
    timestamp: new Date().toISOString()
  };
  return insight;
}

function aggregateRootCause(result: ComparisonResult): AIInsight | null {
  // Look for simultaneous regressions in latency + error or latency + cpu
  const latency = result.diffs.filter(d => /latency|response|p95|p99|time/i.test(d.key) && d.trend === 'worse');
  const error = result.diffs.filter(d => /error|fail/i.test(d.key) && d.trend === 'worse');
  if (latency.length && error.length) {
    return {
      type: 'root_cause',
      severity: 'high',
      confidence: 0.85,
      title: 'Correlated latency and error degradation',
      description: 'Both latency and error-related metrics regressed, suggesting possible upstream saturation, cascading timeouts, or resource contention.',
      actionable_steps: [
        'Correlate error spikes with specific endpoints / services in logs or tracing.',
        'Check database & external dependency latency for spikes.',
        'Introduce adaptive timeouts and backoff where missing.'
      ],
      affected_metrics: [...latency.slice(0,3).map(d=>d.label), ...error.slice(0,3).map(d=>d.label)],
      timestamp: new Date().toISOString()
    };
  }
  return null;
}

function generatePredictions(result: ComparisonResult): AIInsight[] {
  // Simple projection: metrics improving/regressing strongly might continue
  const predictions: AIInsight[] = [];
  result.diffs.forEach(d => {
    if (d.pct === null || d.trend === 'same' || d.trend === 'unknown') return;
    const norm = d.betterWhen === 'lower' ? -d.pct! : d.pct!;
    if (Math.abs(norm) < 8) return; // ignore small changes
    const futurePct = (norm > 0 ? norm * 1.5 : norm * 1.3);
    predictions.push({
      type: 'prediction',
      severity: Math.abs(futurePct) > 40 ? 'high' : 'medium',
      confidence: 0.6 + Math.min(Math.abs(norm)/100, 0.3),
      title: `${d.label} likely to ${norm > 0 ? 'improve' : 'degrade'} further` ,
      description: `Trend magnitude suggests a projected ${(futurePct).toFixed(1)}% ${norm > 0 ? 'improvement' : 'regression'} next cycle if conditions persist. Consider proactive optimization / mitigation.` ,
      actionable_steps: norm > 0 ? [
        'Capture before/after benchmarks to lock in improvement.',
        'Document optimizations to replicate across services.'
      ] : [
        'Set alert threshold slightly before projected regression level.',
        'Allocate time for optimization sprint if regression continues.'
      ],
      affected_metrics: [d.label],
      timestamp: new Date().toISOString()
    });
  });
  return predictions.slice(0,5);
}

export function deepAnalyze(result: ComparisonResult): DeepAIResult {
  const insights: AIInsight[] = [];
  for (const diff of result.diffs) {
    const ins = buildInsight(diff);
    if (ins) insights.push(ins);
  }
  const root = aggregateRootCause(result);
  if (root) insights.unshift(root);
  // Sort by severity / impact (approx by confidence & severity rank)
  const severityRank: Record<string, number> = { critical:4, high:3, medium:2, low:1 };
  insights.sort((a,b) => (severityRank[b.severity]-severityRank[a.severity]) || (b.confidence - a.confidence));
  const predictions = generatePredictions(result);
  const explanation = `Generated ${insights.length} insights and ${predictions.length} trend projections using rule-based heuristics over metric deltas to approximate AI reasoning.`;
  return { aiInsights: insights, predictions, explanation };
}
