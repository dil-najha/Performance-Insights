import React, { useState } from 'react';
import type { AIInsight, CodeRecommendation, AffectedFile } from '../types';

interface Props {
  insights: AIInsight[];
}

function getFileIcon(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx': return '⚛️';
    case 'ts':
    case 'tsx': return '🔷';
    case 'py': return '🐍';
    case 'java': return '☕';
    case 'css': return '🎨';
    case 'html': return '🌐';
    case 'json': return '📋';
    case 'md': return '📝';
    default: return '📄';
  }
}

function CodeDiffView({ recommendation }: { recommendation: CodeRecommendation }) {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  return (
    <div className="bg-base-300/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-base-300 px-4 py-2 border-b border-base-content/10">
        <div className="flex items-center gap-2">
          <span className="text-sm">{getFileIcon(recommendation.file)}</span>
          <span className="font-mono text-sm font-semibold">{recommendation.file}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="btn-group">
            <button 
              className={`btn btn-xs ${viewMode === 'split' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('split')}
            >
              Split
            </button>
            <button 
              className={`btn btn-xs ${viewMode === 'unified' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('unified')}
            >
              Unified
            </button>
          </div>
        </div>
      </div>

      {/* Code Comparison */}
      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-base-content/10">
          {/* Current Code */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-error badge-sm">❌ Current</span>
              <span className="text-xs opacity-60">Problematic code</span>
            </div>
            <pre className="text-xs leading-relaxed font-mono bg-error/5 border border-error/20 rounded p-3 overflow-x-auto">
              <code className="text-error-content">{recommendation.current_code}</code>
            </pre>
          </div>

          {/* Optimized Code */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-success badge-sm">✅ Optimized</span>
              <span className="text-xs opacity-60">Improved code</span>
            </div>
            <pre className="text-xs leading-relaxed font-mono bg-success/5 border border-success/20 rounded p-3 overflow-x-auto">
              <code className="text-success-content">{recommendation.optimized_code}</code>
            </pre>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Current Code */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-error badge-sm">❌ Current Code</span>
            </div>
            <pre className="text-xs leading-relaxed font-mono bg-error/5 border border-error/20 rounded p-3 overflow-x-auto">
              <code className="text-error-content">{recommendation.current_code}</code>
            </pre>
          </div>

          {/* Optimized Code */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-success badge-sm">✅ Optimized Code</span>
            </div>
            <pre className="text-xs leading-relaxed font-mono bg-success/5 border border-success/20 rounded p-3 overflow-x-auto">
              <code className="text-success-content">{recommendation.optimized_code}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="bg-info/5 border-t border-info/20 p-4">
        <div className="flex items-start gap-3">
          <span className="text-info text-lg flex-shrink-0">💡</span>
          <div className="flex-1">
            <h6 className="font-semibold text-sm text-info mb-1">Why This Optimization Works</h6>
            <p className="text-xs leading-relaxed opacity-90">{recommendation.explanation}</p>
            {recommendation.expected_improvement && (
              <div className="mt-2">
                <span className="badge badge-info badge-sm">📈 {recommendation.expected_improvement}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AffectedFilesView({ files }: { files: AffectedFile[] }) {
  return (
    <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
      <h5 className="font-semibold text-sm mb-3 flex items-center gap-2 text-warning">
        📁 Affected Files
      </h5>
      <div className="space-y-3">
        {files.map((file, index) => (
          <div key={index} className="bg-base-100 rounded p-3 border border-base-content/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{getFileIcon(file.path)}</span>
              <span className="font-mono text-sm font-semibold">{file.path}</span>
            </div>
            
            <div className="text-xs opacity-80 mb-2">{file.issue}</div>
            
            <div className="flex flex-wrap gap-2">
              {file.functions.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs opacity-60">Functions:</span>
                  {file.functions.map((func, i) => (
                    <span key={i} className="badge badge-ghost badge-xs font-mono">
                      {func}
                    </span>
                  ))}
                </div>
              )}
              
              {file.lines.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs opacity-60">Lines:</span>
                  {file.lines.map((line, i) => (
                    <span key={i} className="badge badge-outline badge-xs">
                      {line}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeSuggestionCard({ insight }: { insight: AIInsight }) {
  const [expanded, setExpanded] = useState(false);
  
  const hasCodeRecommendations = insight.code_recommendations && insight.code_recommendations.length > 0;
  const hasAffectedFiles = insight.affected_files && insight.affected_files.length > 0;

  if (!hasCodeRecommendations && !hasAffectedFiles) {
    return null; // Don't render if no code-level content
  }

  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/20">
      <div className="card-body p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0 mt-1">💻</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold text-lg leading-tight">{insight.title}</h4>
                {insight.priority_score && (
                  <span className={`badge badge-sm font-semibold ${
                    insight.priority_score === 'P1' ? 'bg-error/20 text-error border-error' :
                    insight.priority_score === 'P2' ? 'bg-warning/20 text-warning border-warning' :
                    'bg-info/20 text-info border-info'
                  }`}>
                    {insight.priority_score}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="badge badge-primary">Code Optimization</span>
                <span className="badge badge-outline badge-sm">
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

        {/* Expected Improvement */}
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

        {/* Affected Files (Always visible) */}
        {hasAffectedFiles && (
          <div className="mb-4">
            <AffectedFilesView files={insight.affected_files!} />
          </div>
        )}

        {/* Code Recommendations (Always visible for code suggestions) */}
        {hasCodeRecommendations && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-sm">🔧 Code Recommendations</span>
              <span className="badge badge-primary badge-sm">{insight.code_recommendations!.length}</span>
            </div>
            
            {insight.code_recommendations!.map((recommendation, index) => (
              <CodeDiffView key={index} recommendation={recommendation} />
            ))}
          </div>
        )}

        {/* Expandable Content */}
        {expanded && (
          <div className="space-y-4 animate-in slide-in-from-top duration-300 border-t border-base-content/10 pt-4 mt-4">
            
            {/* Root Cause Analysis */}
            {insight.root_cause_analysis && (
              <div className="bg-base-200 rounded-lg p-4">
                <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  🔍 Root Cause Analysis
                </h5>
                <p className="text-xs leading-relaxed opacity-80">{insight.root_cause_analysis}</p>
              </div>
            )}

            {/* Business Impact */}
            {insight.business_impact && (
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-warning">
                  💼 Business Impact
                </h5>
                <p className="text-xs leading-relaxed opacity-80">{insight.business_impact}</p>
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

export default function CodeLevelSuggestions({ insights }: Props) {
  // Filter insights that have code-level recommendations
  const codeInsights = insights.filter(insight => 
    (insight.code_recommendations && insight.code_recommendations.length > 0) ||
    (insight.affected_files && insight.affected_files.length > 0)
  );

  if (codeInsights.length === 0) {
    return (
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title flex items-center gap-2">
            💻 Code-Level Suggestions
            <span className="badge badge-ghost badge-sm">0</span>
          </h3>
          <p className="text-sm opacity-60">
            No code-level suggestions available. Enable "Code level suggestions" and run analysis to see specific optimizations with code examples.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title flex items-center gap-2">
            💻 Code-Level Suggestions
            <span className="badge badge-primary badge-sm">{codeInsights.length}</span>
          </h3>
          <div className="text-xs opacity-50">
            AI-powered code optimizations
          </div>
        </div>

        <div className="space-y-4">
          {codeInsights.map((insight, i) => (
            <CodeSuggestionCard key={i} insight={insight} />
          ))}
        </div>

        <div className="mt-4 text-xs opacity-50">
          💡 Tip: Click the expand button to see detailed analysis including root cause, business impact, and implementation guidance.
        </div>
      </div>
    </div>
  );
}
