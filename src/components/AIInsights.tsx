import React, { useState } from 'react';
import type { AIInsight } from '../types';

interface Props {
  insights: AIInsight[];
  explanation?: string;
  loading?: boolean;
}

function getSeverityColor(severity: AIInsight['severity']): string {
  switch (severity) {
    case 'critical': return 'badge-error text-error-content';
    case 'high': return 'badge-warning text-warning-content';
    case 'medium': return 'badge-info text-info-content';
    case 'low': return 'badge-neutral text-neutral-content';
    default: return 'badge-neutral text-neutral-content';
  }
}

function getSeverityBorder(severity: AIInsight['severity']): string {
  switch (severity) {
    case 'critical': return 'border-error border-l-4 bg-error/5';
    case 'high': return 'border-warning border-l-4 bg-warning/5';
    case 'medium': return 'border-info border-l-4 bg-info/5';
    case 'low': return 'border-neutral border-l-4 bg-neutral/5';
    default: return 'border-neutral border-l-4 bg-neutral/5';
  }
}

function getTypeIcon(type: AIInsight['type']): string {
  switch (type) {
    case 'critical_issue': return '🚨';
    case 'root_cause': return '🔍';
    case 'optimization': return '⚡';
    case 'monitoring': return '📊';
    case 'anomaly': return '⚠️';
    case 'suggestion': return '💡';
    case 'prediction': return '🔮';
    case 'explanation': return '📖';
    default: return '🤖';
  }
}

function getTypeLabel(type: AIInsight['type']): string {
  switch (type) {
    case 'critical_issue': return 'Critical Issue';
    case 'root_cause': return 'Root Cause';
    case 'optimization': return 'Optimization';
    case 'monitoring': return 'Monitoring';
    case 'anomaly': return 'Anomaly';
    case 'suggestion': return 'Suggestion';
    case 'prediction': return 'Prediction';
    case 'explanation': return 'Explanation';
    default: return 'AI Insight';
  }
}

function getPriorityColor(score?: number): string {
  if (!score) return 'bg-neutral/20';
  if (score >= 8) return 'bg-error/20 text-error';
  if (score >= 6) return 'bg-warning/20 text-warning';
  if (score >= 4) return 'bg-info/20 text-info';
  return 'bg-success/20 text-success';
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 border ${getSeverityBorder(insight.severity)}`}>
      <div className="card-body p-5">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0 mt-1">{getTypeIcon(insight.type)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold text-lg leading-tight">{insight.title}</h4>
                {insight.priority_score && (
                  <span className={`badge badge-sm font-semibold ${getPriorityColor(insight.priority_score)}`}>
                    P{insight.priority_score}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`badge ${getSeverityColor(insight.severity)}`}>
                  {insight.severity.toUpperCase()}
                </span>
                <span className="badge badge-outline badge-sm">
                  {getTypeLabel(insight.type)}
                </span>
                <span className="badge badge-ghost badge-sm">
                  {Math.round(insight.confidence * 100)}% confidence
                </span>
                {insight.effort_estimate && (
                  <span className="badge badge-outline badge-sm">
                    {insight.effort_estimate} effort
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn btn-ghost btn-sm hover:btn-primary transition-colors"
          >
            {expanded ? '🔼' : '🔽'}
          </button>
        </div>
        
        {/* Description */}
        <div className="mb-4">
          <p className="text-sm leading-relaxed opacity-90">{insight.description}</p>
        </div>

        {/* Business Impact (Always visible for critical/high) */}
        {insight.business_impact && (insight.severity === 'critical' || insight.severity === 'high') && (
          <div className="alert alert-warning mb-4 py-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">💼</span>
              <div>
                <h5 className="font-semibold text-sm">Business Impact</h5>
                <p className="text-xs mt-1">{insight.business_impact}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expected Improvement (Always visible) */}
        {insight.expected_improvement && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-green-600">📈</span>
              <div>
                <h5 className="font-semibold text-sm text-success">Expected Improvement</h5>
                <p className="text-xs text-success/80 mt-1">{insight.expected_improvement}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expandable Content */}
        {expanded && (
          <div className="space-y-4 animate-in slide-in-from-top duration-300">
            
            {/* Root Cause Analysis */}
            {insight.root_cause_analysis && (
              <div className="bg-base-200 rounded-lg p-4">
                <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  🔍 Root Cause Analysis
                </h5>
                <p className="text-xs leading-relaxed opacity-80">{insight.root_cause_analysis}</p>
              </div>
            )}

            {/* Immediate Actions */}
            {insight.immediate_actions && insight.immediate_actions.length > 0 && (
              <div className="bg-error/5 border border-error/20 rounded-lg p-4">
                <h5 className="font-semibold text-sm mb-3 flex items-center gap-2 text-error">
                  🚨 Immediate Actions
                </h5>
                <ul className="space-y-2">
                  {insight.immediate_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-error font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Code Optimizations */}
            {insight.code_optimizations && insight.code_optimizations.length > 0 && (
              <div className="bg-info/5 border border-info/20 rounded-lg p-4">
                <h5 className="font-semibold text-sm mb-3 flex items-center gap-2 text-info">
                  ⚡ Code Optimizations
                </h5>
                <ul className="space-y-2">
                  {insight.code_optimizations.map((optimization, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-info font-bold mt-0.5">•</span>
                      <span className="leading-relaxed font-mono bg-base-300 px-2 py-1 rounded text-xs">{optimization}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Long-term Solutions */}
            {insight.long_term_solutions && insight.long_term_solutions.length > 0 && (
              <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                <h5 className="font-semibold text-sm mb-3 flex items-center gap-2 text-success">
                  🎯 Long-term Solutions
                </h5>
                <ul className="space-y-2">
                  {insight.long_term_solutions.map((solution, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-success font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Legacy Action Steps (fallback) */}
            {!insight.immediate_actions && insight.actionable_steps && insight.actionable_steps.length > 0 && (
              <div className="bg-base-200 rounded-lg p-4">
                <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  ✅ Action Items
                </h5>
                <ul className="space-y-2">
                  {insight.actionable_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Business Impact (for expanded view if not critical/high) */}
            {insight.business_impact && insight.severity !== 'critical' && insight.severity !== 'high' && (
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-warning">
                  💼 Business Impact
                </h5>
                <p className="text-xs leading-relaxed opacity-80">{insight.business_impact}</p>
              </div>
            )}

            {/* Affected Metrics */}
            {insight.affected_metrics.length > 0 && (
              <div>
                <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  📊 Affected Metrics
                </h5>
                <div className="flex flex-wrap gap-2">
                  {insight.affected_metrics.map((metric, i) => (
                    <span key={i} className="badge badge-outline badge-sm font-mono">
                      {metric}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
