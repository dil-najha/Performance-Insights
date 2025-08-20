import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import type { MetricDiff } from '../types';

export default function MetricDiffChart({ diffs }: { diffs: MetricDiff[] }) {
  const chartData = diffs.map(d => ({
    name: d.label,
    baseline: d.baseline ?? 0,
    current: d.current ?? 0,
    pct: d.pct ?? 0,
  }));

  const top = chartData.slice(0, Math.min(12, chartData.length));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title">Baseline vs Current</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="baseline" fill="#60a5fa" name="Baseline" />
                <Bar dataKey="current" fill="#f472b6" name="Current" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title">Percent Change</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={top}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Legend />
                <Line type="monotone" dataKey="pct" stroke="#34d399" name="Δ%" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
