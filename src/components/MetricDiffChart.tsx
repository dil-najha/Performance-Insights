import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from 'recharts';
import type { MetricDiff } from '../types';

interface MetricGroup {
  title: string;
  metrics: MetricDiff[];
  unit: string;
  icon: string;
  formatter: (value: number) => string;
  colorScheme: {
    baseline: string;
    current: string;
    change: string;
  };
}

export default function MetricDiffChart({ diffs }: { diffs: MetricDiff[] }) {
  // Group metrics by category and unit type for meaningful visualization
  const metricGroups = groupMetricsByCategory(diffs);
  
  return (
    <div className="space-y-6">
      {/* Category-specific charts - 2 per row for better space utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metricGroups.map((group, index) => (
          <CategoryChart key={index} group={group} />
        ))}
      </div>

      {/* Overview - Percent Changes (Line Chart at the end) */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h3 className="card-title text-lg">📈 Performance Changes Overview</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getOverviewData(diffs)} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }} 
                  interval={0} 
                  angle={-45} 
                  textAnchor="end" 
                  height={90}
                />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(1)}%`, 'Percent Change']}
                  labelFormatter={(label) => `Metric: ${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="change" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                  name="% Change"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs opacity-70 mt-2">
            📈 Line shows percentage change from baseline to current values
          </div>
        </div>
      </div>
    </div>
  );
}

// Consistent color scheme for all charts
const CHART_COLORS = {
  baseline: '#10b981', // Green - represents the target/ideal
  current: '#3b82f6',  // Blue - represents current state
  improved: '#10b981', // Green for improvements
  worse: '#ef4444',    // Red for degradation
  neutral: '#6b7280'   // Gray for no change
};

function CategoryChart({ group }: { group: MetricGroup }) {
  const chartData = group.metrics.map(d => ({
    name: d.label.replace(group.title, '').replace(/^[:\-\s]+/, '').replace(/ - /g, '\n'), // Clean up labels and add line breaks
    baseline: d.baseline ?? 0,
    current: d.current ?? 0,
    pct: d.pct ?? 0,
  }));

  return (
    <div className="card bg-base-200 shadow">
      <div className="card-body p-4">
        <h3 className="card-title text-sm mb-3">
          {group.icon} {group.title}
          <span className="badge badge-neutral badge-sm">{group.unit}</span>
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 9 }} 
                interval={0} 
                angle={-35} 
                textAnchor="end" 
                height={70}
              />
              <YAxis 
                tickFormatter={group.formatter}
                domain={group.unit === '%' ? [0, 100] : ['auto', 'auto']}
                tick={{ fontSize: 10 }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  group.formatter(value), 
                  name === 'baseline' ? 'Baseline' : name === 'current' ? 'Current' : name
                ]}
                labelFormatter={(label) => `Metric: ${label}`}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '15px',
                  fontSize: '12px'
                }} 
              />
              <Bar 
                dataKey="baseline" 
                fill={CHART_COLORS.baseline}
                name="Baseline" 
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="current" 
                fill={CHART_COLORS.current}
                name="Current" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function groupMetricsByCategory(diffs: MetricDiff[]): MetricGroup[] {
  const groups: MetricGroup[] = [];
  
  // Consistent color scheme for all chart groups
  const standardColorScheme = {
    baseline: CHART_COLORS.baseline,
    current: CHART_COLORS.current,
    change: '#8b5cf6'
  };
  
  // Core Web Vitals (milliseconds)
  const coreWebVitals = diffs.filter(d => 
    /(fcp|lcp|fid|inp|ttfb).*ms/i.test(d.key)
  );
  if (coreWebVitals.length > 0) {
    groups.push({
      title: 'Core Web Vitals',
      metrics: coreWebVitals,
      unit: 'milliseconds',
      icon: '🎯',
      formatter: (v) => `${Math.round(v)}ms`,
      colorScheme: standardColorScheme
    });
  }

  // Load Performance (milliseconds/seconds)
  const loadPerformance = diffs.filter(d => 
    /(page_load|navigation|login).*ms/i.test(d.key)
  );
  if (loadPerformance.length > 0) {
    groups.push({
      title: 'Load Performance',
      metrics: loadPerformance,
      unit: 'milliseconds',
      icon: '🚀',
      formatter: (v) => v > 1000 ? `${(v/1000).toFixed(1)}s` : `${Math.round(v)}ms`,
      colorScheme: standardColorScheme
    });
  }

  // HTTP Performance (milliseconds)
  const httpPerformance = diffs.filter(d => 
    /http_req.*ms/i.test(d.key)
  );
  if (httpPerformance.length > 0) {
    groups.push({
      title: 'HTTP Performance',
      metrics: httpPerformance,
      unit: 'milliseconds',
      icon: '🌐',
      formatter: (v) => `${Math.round(v)}ms`,
      colorScheme: standardColorScheme
    });
  }

  // Success Rates (percentages)
  const successRates = diffs.filter(d => 
    /(rate|success|error|checks)(?!.*ms)/i.test(d.key)
  );
  if (successRates.length > 0) {
    groups.push({
      title: 'Success Rates',
      metrics: successRates.map(d => ({
        ...d,
        baseline: d.baseline ? d.baseline * 100 : null, // Convert to percentage
        current: d.current ? d.current * 100 : null
      })),
      unit: '%',
      icon: '✅',
      formatter: (v) => `${v.toFixed(1)}%`,
      colorScheme: standardColorScheme
    });
  }

  // Layout Stability (CLS score)
  const layoutStability = diffs.filter(d => 
    /cls/i.test(d.key)
  );
  if (layoutStability.length > 0) {
    groups.push({
      title: 'Layout Stability',
      metrics: layoutStability,
      unit: 'score',
      icon: '📐',
      formatter: (v) => v.toFixed(3),
      colorScheme: standardColorScheme
    });
  }

  // Context Metrics (counts)
  const contextMetrics = diffs.filter(d => 
    /(total|count|passes|fails)(?!.*rate)/i.test(d.key)
  );
  if (contextMetrics.length > 0) {
    groups.push({
      title: 'Test Context',
      metrics: contextMetrics,
      unit: 'count',
      icon: '📊',
      formatter: (v) => Math.round(v).toString(),
      colorScheme: standardColorScheme
    });
  }

  return groups;
}

function getOverviewData(diffs: MetricDiff[]) {
  return diffs
    .filter(d => d.pct !== null && Math.abs(d.pct) > 1) // Only significant changes
    .sort((a, b) => Math.abs(b.pct!) - Math.abs(a.pct!)) // Sort by impact
    .slice(0, 12) // Top 12 most impactful changes for better readability
    .map(d => ({
      name: d.label
        .replace(/ - /g, '\n') // Break long labels into multiple lines
        .substring(0, 35) + (d.label.length > 35 ? '...' : ''), // Truncate if too long
      change: Math.round(d.pct! * 10) / 10 // Round to 1 decimal place
    }));
}
