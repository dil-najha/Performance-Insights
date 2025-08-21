import React, { useState } from 'react';
import type { AIInsight } from '../types';

interface Props {
  insights: AIInsight[];
  explanation?: string;
  loading?: boolean;
}

function getSeverityColor(severity: AIInsight['severity']): string {
  switch (severity) {
    case 'critical': return 'badge-error';
    case 'high': return 'badge-warning';
    case 'medium': return 'badge-info';
    case 'low': return 'badge-neutral';
    default: return 'badge-neutral';
  }
}

function getTypeIcon(type: AIInsight['type']): string {
  switch (type) {
    case 'anomaly': return '⚠️';
    case 'suggestion': return '💡';
    case 'prediction': return '🔮';
    case 'root_cause': return '🔍';
    case 'explanation': return '📊';
    default: return '🤖';
  }
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getTypeIcon(insight.type)}</span>
            <div>
              <h4 className="font-semibold text-sm">{insight.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge badge-xs ${getSeverityColor(insight.severity)}`}>
                  {insight.severity}
                </span>
                <span className="text-xs opacity-60">
                  {Math.round(insight.confidence * 100)}% confidence
                </span>
              </div>
            </div>
          </div>
          <button 
            className="btn btn-ghost btn-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '−' : '+'}
          </button>
        </div>
        
        <p className="text-sm opacity-80 mt-2">{insight.description}</p>
        
        {expanded && insight.actionable_steps.length > 0 && (
          <div className="mt-3">
            <h5 className="font-medium text-xs mb-2">Action Steps:</h5>
            <ul className="text-xs space-y-1">
              {insight.actionable_steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {expanded && insight.affected_metrics.length > 0 && (
          <div className="mt-3">
            <h5 className="font-medium text-xs mb-2">Affected Metrics:</h5>
            <div className="flex flex-wrap gap-1">
              {insight.affected_metrics.map((metric, i) => (
                <span key={i} className="badge badge-outline badge-xs">
                  {metric}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIInsights({ insights, explanation, loading }: Props) {
  const [filter, setFilter] = useState<AIInsight['type'] | 'all'>('all');
  
  if (loading) {
    return (
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title flex items-center gap-2">
            🤖 AI Analysis
            <div className="loading loading-spinner loading-sm"></div>
          </h3>
          <p className="text-sm opacity-60">Analyzing performance data...</p>
        </div>
      </div>
    );
  }

  if (insights.length === 0 && !explanation) {
    return (
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title">🤖 AI Analysis</h3>
          <p className="text-sm opacity-60">No AI insights available. Enable AI analysis and load performance data to see intelligent recommendations.</p>
        </div>
      </div>
    );
  }

  const filteredInsights = filter === 'all' 
    ? insights 
    : insights.filter(insight => insight.type === filter);

  const insightTypes = [...new Set(insights.map(i => i.type))];

  return (
    <div className="card bg-base-200 shadow">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title">🤖 AI Analysis</h3>
          {insightTypes.length > 1 && (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-sm">
                Filter: {filter} ▼
              </label>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li><a onClick={() => setFilter('all')}>All Types</a></li>
                {insightTypes.map(type => (
                  <li key={type}>
                    <a onClick={() => setFilter(type)}>
                      {getTypeIcon(type)} {type}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {explanation && (
          <div className="alert mb-4">
            <span className="text-sm">{explanation}</span>
          </div>
        )}

        {filteredInsights.length > 0 ? (
          <div className="space-y-3">
            {filteredInsights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-60">No insights available for the selected filter.</p>
        )}

        {insights.length > 0 && (
          <div className="mt-4 text-xs opacity-50">
            Powered by AI • {insights.length} insights found
          </div>
        )}
      </div>
    </div>
  );
}
