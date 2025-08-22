import React from 'react';
import type { MetricDiff } from '../types';

function trendBadge(trend: MetricDiff['trend']): string {
  switch (trend) {
    case 'improved': return 'badge badge-success';
    case 'worse': return 'badge badge-error';
    case 'same': return 'badge badge-neutral';
    default: return 'badge';
  }
}

export default function DiffTable({ diffs }: { diffs: MetricDiff[] }) {
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
          {diffs.map(d => (
            <tr key={d.key}>
              <td>{d.label}</td>
              <td className="text-right">{d.baseline !== null ? d.baseline.toFixed(2) : '-'}</td>
              <td className="text-right">{d.current !== null ? d.current.toFixed(2) : '-'}</td>
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
