import React, { useState } from 'react';
import type { ImpactSummary, MetricDiff } from '../types';

interface Props {
  impact: ImpactSummary;
}

export default function EnhancedImpactSummary({ impact }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'categories' | 'priorities'>('overview');



  return (
    <div className="card bg-base-100 shadow-xl border border-primary/20 animate-pop">
      <div className="card-body p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="card-title text-xl">📊 Performance Impact Summary</h3>
          <div className="flex gap-2">
            <span className={`badge ${getOverallHealthBadge(impact)}`}>
              {getOverallHealthText(impact)}
            </span>
            <span className="badge badge-primary badge-sm">Dynamic</span>
          </div>
        </div>



        {/* Tab Navigation */}
        <div className="tabs tabs-boxed mb-4">
          <button 
            className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📈 Overview
          </button>
          <button 
            className={`tab ${activeTab === 'vitals' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('vitals')}
          >
            🎯 Core Web Vitals
          </button>
          <button 
            className={`tab ${activeTab === 'categories' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            📊 Categories
          </button>
          <button 
            className={`tab ${activeTab === 'priorities' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('priorities')}
          >
            🚨 Priorities
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'overview' && <OverviewTab impact={impact} />}
          {activeTab === 'vitals' && <CoreWebVitalsTab impact={impact} />}
          {activeTab === 'categories' && <CategoriesTab impact={impact} />}
          {activeTab === 'priorities' && <PrioritiesTab impact={impact} />}
        </div>
      </div>
    </div>
  );
}



function OverviewTab({ impact }: { impact: ImpactSummary }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <MetricCard
          title="Net Score"
          value={impact.netImprovementScore.toString()}
          suffix=""
          color={impact.netImprovementScore >= 0 ? 'success' : 'error'}
          description={`${impact.improvedMetrics} improved, ${impact.worseMetrics} degraded`}
        />
        <MetricCard
          title="Avg % Gain"
          value={impact.avgPctImprovement?.toString() || '—'}
          suffix="%"
          color={impact.avgPctImprovement && impact.avgPctImprovement > 0 ? 'success' : 'neutral'}
          description="Average improvement across enhanced metrics"
        />
        <MetricCard
          title="Latency Saved"
          value={impact.latencyImprovementMs?.toString() || '—'}
          suffix=" ms"
          color={impact.latencyImprovementMs && impact.latencyImprovementMs > 0 ? 'success' : 'neutral'}
          description={impact.latencyImprovementPct ? `${impact.latencyImprovementPct}% faster` : ''}
        />
        <MetricCard
          title="Suggestion Score"
          value={impact.suggestionEffectivenessPct?.toString() || '—'}
          suffix="%"
          color={impact.suggestionEffectivenessPct && impact.suggestionEffectivenessPct > 50 ? 'success' : 'warning'}
          description="Effectiveness of performance changes"
        />
      </div>

      {/* Business Impact Summary */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body p-4">
          <h4 className="card-title text-base mb-3">💼 Business Impact Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Revenue Risk:</span>
                <span className={`badge badge-sm ${getRiskBadgeColor(impact.businessImpact.revenueRisk)}`}>
                  {impact.businessImpact.revenueRisk}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">User Experience:</span>
                <span className={`badge badge-sm ${getUXBadgeColor(impact.businessImpact.userExperience)}`}>
                  {impact.businessImpact.userExperience}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">SEO Impact:</span>
                <span className={`badge badge-sm ${getSEOBadgeColor(impact.businessImpact.seoImpact)}`}>
                  {impact.businessImpact.seoImpact}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">System Health:</span>
                <span className={`badge badge-sm ${getHealthBadgeColor(impact.systemHealth.status)}`}>
                  {impact.systemHealth.status}
                </span>
              </div>
            </div>
          </div>
          {impact.businessImpact.estimatedLoss && (
            <div className="alert alert-warning mt-3 py-2">
              <span className="text-sm">
                <strong>Estimated Impact:</strong> {impact.businessImpact.estimatedLoss}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CoreWebVitalsTab({ impact }: { impact: ImpactSummary }) {
  const vitals = impact.coreWebVitals;
  
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="text-center">
        <div className={`badge badge-lg ${getVitalsBadgeColor(vitals.score)}`}>
          Core Web Vitals: {vitals.score.toUpperCase()}
        </div>
        <p className="text-sm opacity-70 mt-2">
          Google's user experience metrics for SEO and performance
        </p>
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <VitalCard
          title="First Contentful Paint"
          subtitle="FCP"
          metric={vitals.fcp}
          threshold={1800}
          unit="ms"
          description="Time until first text/image is painted"
        />
        <VitalCard
          title="Largest Contentful Paint"
          subtitle="LCP"
          metric={vitals.lcp}
          threshold={2500}
          unit="ms"
          description="Time until largest content element is painted"
        />
        <VitalCard
          title="Time to First Byte"
          subtitle="TTFB"
          metric={vitals.ttfb}
          threshold={800}
          unit="ms"
          description="Server response time"
        />
        <VitalCard
          title="First Input Delay"
          subtitle="FID"
          metric={vitals.fid}
          threshold={100}
          unit="ms"
          description="Time until page responds to first interaction"
        />
        <VitalCard
          title="Cumulative Layout Shift"
          subtitle="CLS"
          metric={vitals.cls}
          threshold={0.1}
          unit=""
          description="Visual stability of page content"
          lowerIsBetter
        />
      </div>

      {/* Recommendations */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body p-4">
          <h4 className="card-title text-base mb-3">🎯 Core Web Vitals Recommendations</h4>
          <div className="space-y-2 text-sm">
            {vitals.fcp && vitals.fcp.current && (vitals.fcp.current as number) > 1800 && (
              <div className="flex items-start gap-2">
                <span className="text-warning">⚠️</span>
                <span>Optimize FCP: Reduce server response time, eliminate render-blocking resources</span>
              </div>
            )}
            {vitals.lcp && vitals.lcp.current && (vitals.lcp.current as number) > 2500 && (
              <div className="flex items-start gap-2">
                <span className="text-warning">⚠️</span>
                <span>Optimize LCP: Optimize largest content element, improve server response time</span>
              </div>
            )}
            {vitals.ttfb && vitals.ttfb.current && (vitals.ttfb.current as number) > 800 && (
              <div className="flex items-start gap-2">
                <span className="text-error">🔴</span>
                <span>TTFB Performance: Server response issues detected - review database/API performance</span>
              </div>
            )}
            {vitals.score === 'good' && (
              <div className="flex items-start gap-2">
                <span className="text-success">✅</span>
                <span>Core Web Vitals are performing well - maintain current optimizations</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoriesTab({ impact }: { impact: ImpactSummary }) {
  const { categories } = impact;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CategoryCard
          title="System Reliability"
          icon="🛡️"
          category={categories.systemReliability}
          description="Error rates, uptime, and service availability"
        />
        <CategoryCard
          title="Performance"
          icon="🚀"
          category={categories.performance}
          description="Response times, throughput, and latency"
        />
        <CategoryCard
          title="User Experience"
          icon="👥"
          category={categories.userExperience}
          description="Core Web Vitals and interaction metrics"
        />
      </div>
    </div>
  );
}

function PrioritiesTab({ impact }: { impact: ImpactSummary }) {
  const { priorityIssues } = impact;
  
  return (
    <div className="space-y-6">
      <PrioritySection
        title="🔴 High Priority Issues (P1)"
        description="Immediate action required - performance impact affecting operations"
        metrics={priorityIssues.critical}
        badgeColor="badge-error"
      />
      <PrioritySection
        title="⚠️ High Priority Issues (P2)"
        description="Urgent attention needed - significant performance degradation"
        metrics={priorityIssues.high}
        badgeColor="badge-warning"
      />
      <PrioritySection
        title="📊 Medium Priority Issues (P3)"
        description="Important optimizations with clear ROI"
        metrics={priorityIssues.medium}
        badgeColor="badge-info"
      />
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, suffix, color, description }: {
  title: string;
  value: string;
  suffix: string;
  color: 'success' | 'error' | 'warning' | 'neutral';
  description: string;
}) {
  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-3 text-center">
        <div className="text-xs opacity-70">{title}</div>
        <div className={`text-lg font-bold text-${color}`}>
          {value}{suffix}
        </div>
        <div className="text-[10px] opacity-60 mt-1">{description}</div>
      </div>
    </div>
  );
}

function VitalCard({ title, subtitle, metric, threshold, unit, description, lowerIsBetter = false }: {
  title: string;
  subtitle: string;
  metric: MetricDiff | null;
  threshold: number;
  unit: string;
  description: string;
  lowerIsBetter?: boolean;
}) {
  if (!metric) {
    return (
      <div className="card bg-base-200 shadow-sm opacity-50">
        <div className="card-body p-3 text-center">
          <h5 className="font-semibold text-sm">{subtitle}</h5>
          <div className="text-xs opacity-70 mb-2">{title}</div>
          <div className="text-lg">—</div>
          <div className="text-xs opacity-60">No data</div>
        </div>
      </div>
    );
  }

  const current = metric.current as number;
  const isGood = lowerIsBetter ? current <= threshold : current >= threshold;
  const status = isGood ? 'good' : current > threshold * 1.5 ? 'poor' : 'needs-improvement';
  
  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-3 text-center">
        <h5 className="font-semibold text-sm">{subtitle}</h5>
        <div className="text-xs opacity-70 mb-2">{title}</div>
        <div className={`text-lg font-bold ${getVitalsValueColor(status)}`}>
          {current.toFixed(0)}{unit}
        </div>
        <div className="text-xs opacity-60">{formatMetricChange(metric)}</div>
        <div className="text-[10px] opacity-50 mt-1">{description}</div>
      </div>
    </div>
  );
}

function CategoryCard({ title, icon, category, description }: {
  title: string;
  icon: string;
  category: { score: number; status: string; metrics: MetricDiff[] };
  description: string;
}) {
  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{icon}</span>
          <h4 className="font-semibold">{title}</h4>
        </div>
        <div className="text-center mb-3">
          <div className={`text-2xl font-bold ${getCategoryScoreColor(category.status)}`}>
            {category.score}%
          </div>
          <div className={`badge badge-sm ${getCategoryBadgeColor(category.status)}`}>
            {category.status.toUpperCase()}
          </div>
        </div>
        <p className="text-xs opacity-70 mb-3">{description}</p>
        <div className="text-xs">
          <strong>{category.metrics.length}</strong> metrics tracked
        </div>
      </div>
    </div>
  );
}

function PrioritySection({ title, description, metrics, badgeColor }: {
  title: string;
  description: string;
  metrics: MetricDiff[];
  badgeColor: string;
}) {
  if (metrics.length === 0) {
    return (
      <div className="card bg-base-200 shadow-sm opacity-50">
        <div className="card-body p-4">
          <h4 className="font-semibold mb-2">{title}</h4>
          <p className="text-sm opacity-70">No issues in this priority level</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">{title}</h4>
          <span className={`badge ${badgeColor}`}>{metrics.length}</span>
        </div>
        <p className="text-sm opacity-70 mb-4">{description}</p>
        <div className="space-y-2">
          {metrics.slice(0, 5).map((metric, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span>{metric.label}</span>
              <span className="font-mono">{formatMetricChange(metric)}</span>
            </div>
          ))}
          {metrics.length > 5 && (
            <div className="text-xs opacity-60 pt-2 border-t">
              +{metrics.length - 5} more issues
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Functions
function formatMetricChange(metric: MetricDiff): string {
  if (metric.pct === null) return '—';
  const sign = metric.pct >= 0 ? '+' : '';
  return `${sign}${metric.pct.toFixed(1)}%`;
}

function getOverallHealthBadge(impact: ImpactSummary): string {
  if (impact.systemHealth.status === 'failed') return 'badge-error';
  if (impact.systemHealth.status === 'critical') return 'badge-error';
  if (impact.systemHealth.status === 'degraded') return 'badge-warning';
  return 'badge-success';
}

function getOverallHealthText(impact: ImpactSummary): string {
  if (impact.systemHealth.status === 'failed') return 'ISSUES DETECTED';
  if (impact.systemHealth.status === 'critical') return 'NEEDS ATTENTION';
  if (impact.systemHealth.status === 'degraded') return 'DEGRADED';
  return 'HEALTHY';
}

function getRiskBadgeColor(risk: string): string {
  switch (risk) {
    case 'critical': return 'badge-error';
    case 'high': return 'badge-warning';
    case 'medium': return 'badge-info';
    case 'low': return 'badge-success';
    default: return 'badge-neutral';
  }
}

function getUXBadgeColor(ux: string): string {
  switch (ux) {
    case 'poor': return 'badge-error';
    case 'degraded': return 'badge-warning';
    case 'good': return 'badge-success';
    case 'excellent': return 'badge-success';
    default: return 'badge-neutral';
  }
}

function getSEOBadgeColor(seo: string): string {
  switch (seo) {
    case 'severe': return 'badge-error';
    case 'negative': return 'badge-warning';
    case 'neutral': return 'badge-info';
    case 'positive': return 'badge-success';
    default: return 'badge-neutral';
  }
}

function getHealthBadgeColor(status: string): string {
  switch (status) {
    case 'failed': return 'badge-error';
    case 'critical': return 'badge-error';
    case 'degraded': return 'badge-warning';
    case 'healthy': return 'badge-success';
    default: return 'badge-neutral';
  }
}

function getVitalsBadgeColor(score: string): string {
  switch (score) {
    case 'poor': return 'badge-error';
    case 'needs-improvement': return 'badge-warning';
    case 'good': return 'badge-success';
    default: return 'badge-neutral';
  }
}

function getVitalsValueColor(status: string): string {
  switch (status) {
    case 'poor': return 'text-error';
    case 'needs-improvement': return 'text-warning';
    case 'good': return 'text-success';
    default: return 'text-neutral';
  }
}

function getCategoryScoreColor(status: string): string {
  switch (status) {
    case 'critical': return 'text-error';
    case 'warning': return 'text-warning';
    case 'good': return 'text-success';
    default: return 'text-neutral';
  }
}

function getCategoryBadgeColor(status: string): string {
  switch (status) {
    case 'critical': return 'badge-error';
    case 'warning': return 'badge-warning';
    case 'good': return 'badge-success';
    default: return 'badge-neutral';
  }
}
