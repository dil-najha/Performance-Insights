import React from 'react';
import type { MetricDiff } from '../types';
import { selectTopImportantDiffs } from '../utils/compare';

function trendBadge(trend: MetricDiff['trend']): string {
  switch (trend) {
    case 'improved': return 'badge badge-success';
    case 'worse': return 'badge badge-error';
    case 'same': return 'badge badge-neutral';
    default: return 'badge';
  }
}

interface Props {
  diffs: MetricDiff[];
  topOnly?: boolean;
  max?: number;
}

export default function DiffTable({ diffs, topOnly = false, max = 25 }: Props) {
  const shown = topOnly ? selectTopImportantDiffs(diffs, max) : diffs;
  return (
    <div className="overflow-x-auto bg-base-200 rounded-lg">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Metric</th>
            <th className="text-right">Baseline</th>
            <th className="text-right">Current</th>
            <th className="text-right">Δ</th>
            <th className="text-right">Δ%</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {shown.map(d => (
            <tr key={d.key}>
              <td>{d.label}</td>
              <td className="text-right">{d.baseline ?? '-'}</td>
              <td className="text-right">{d.current ?? '-'}</td>
              <td className="text-right">{d.change === null ? '-' : d.change.toFixed(2)}</td>
              <td className="text-right">{d.pct === null ? '-' : `${d.pct.toFixed(1)}%`}</td>
              <td><span className={trendBadge(d.trend)}>{d.trend}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
