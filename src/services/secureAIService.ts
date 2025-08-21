// Secure AI Service Layer for Performance Insights
import type { MetricDiff, PerformanceReport, AIInsight, SystemContext, EnhancedComparisonResult } from '../types';
import { openRouterService } from './openRouterService';
import { getPreferredProvider, validateAIConfig } from '../config/ai';
import { compareReports } from '../utils/compare';

export class SecureAIService {
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:3001/api';
    this.apiKey = import.meta.env.VITE_API_SECRET_KEY || 'dev-secure-api-key-for-performance-insights-2025';
    this.cache = new Map();

    // Log provider configuration
    const provider = getPreferredProvider();
    const config = validateAIConfig();
    console.log('🔧 SecureAIService initialized');
    console.log('🎯 Preferred provider:', provider);
    console.log('✅ Providers available:', config.providers);
  }

  private getCacheKey(data: any): string {
    return JSON.stringify(data);
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    const cacheKey = this.getCacheKey({ endpoint, data });
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📦 Using cached result for:', endpoint);
      return cached;
    }

    try {
      console.log('🔄 Making AI API request to:', endpoint);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ AI API request failed:', error);
      throw error;
    }
  }

  // Main AI Analysis endpoint with intelligent routing
  async analyzePerformance(
    baseline: PerformanceReport, 
    current: PerformanceReport, 
    systemContext?: SystemContext
  ): Promise<EnhancedComparisonResult> {
    return this.routeToProvider(baseline, current, systemContext);
  }

  /**
   * Intelligent provider routing - uses OpenRouter first, falls back to backend API
   */
  private async routeToProvider(
    baseline: PerformanceReport,
    current: PerformanceReport,
    systemContext?: SystemContext
  ): Promise<EnhancedComparisonResult> {
    const provider = getPreferredProvider();
    
    console.log(`🎯 Using AI provider: ${provider}`);

    switch (provider) {
      case 'openrouter':
        try {
          console.log('🌟 Using OpenRouter with free models only...');
          const result = await openRouterService.analyzePerformance(baseline, current, systemContext);
          console.log('✅ OpenRouter analysis successful');
          return result;
        } catch (error) {
          console.error('❌ OpenRouter failed - NO FALLBACK to prevent gpt-4o usage:', error);
          // Return basic analysis instead of falling back to backend
          const basicResult = compareReports(baseline, current);
          return {
            ...basicResult,
            explanation: 'Analysis completed using basic algorithms (OpenRouter failed, no fallback to prevent paid model usage)'
          };
        }

      case 'local':
      default:
        console.log('🏠 Using local analysis only (no API keys available)...');
        const basicResult = compareReports(baseline, current);
        return {
          ...basicResult,
          explanation: 'Analysis completed using basic algorithms (no AI API keys configured)'
        };
    }
  }

  /**
   * Backend API analysis (existing implementation)
   */
  private async analyzeViaBackend(
    baseline: PerformanceReport,
    current: PerformanceReport,
    systemContext?: SystemContext
  ): Promise<EnhancedComparisonResult> {
    try {
      const result = await this.makeRequest('/ai/analyze', {
        baseline,
        current,
        systemContext
      });

      return {
        diffs: result.diffs,
        summary: result.summary,
        aiInsights: result.aiInsights || [],
        predictions: result.predictions || [],
        explanation: result.explanation
      };
    } catch (error) {
      console.error('❌ Backend API analysis failed:', error);
      // Return fallback analysis
      return this.fallbackAnalysis(baseline, current);
    }
  }

  // Get historical reports
  async getHistoricalReports(limit = 20, offset = 0): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/history?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to fetch historical reports:', error);
      return { reports: [], total: 0, limit, offset };
    }
  }

  // Export report
  async exportReport(data: any, format: 'csv' | 'json'): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ data, format })
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    }
  }

  private fallbackAnalysis(baseline: PerformanceReport, current: PerformanceReport): EnhancedComparisonResult {
    const diffs = this.calculateBasicDiffs(baseline, current);
    const summary = this.calculateSummary(diffs);
    const aiInsights = this.generateFallbackInsights(diffs);

    return {
      diffs,
      summary,
      aiInsights,
      explanation: 'Analysis completed using local algorithms due to AI service unavailability.'
    };
  }

  private calculateBasicDiffs(baseline: PerformanceReport, current: PerformanceReport): MetricDiff[] {
    const diffs: MetricDiff[] = [];
    const allKeys = new Set([...Object.keys(baseline.metrics), ...Object.keys(current.metrics)]);

    for (const key of allKeys) {
      const baselineValue = baseline.metrics[key] || null;
      const currentValue = current.metrics[key] || null;

      let change = null;
      let pct = null;
      let trend: 'improved' | 'worse' | 'same' | 'unknown' = 'unknown';

      if (baselineValue !== null && currentValue !== null) {
        change = currentValue - baselineValue;
        pct = baselineValue !== 0 ? (change / baselineValue) * 100 : 0;

        const betterWhen = this.getBetterWhenForKey(key);
        if (Math.abs(pct) < 5) {
          trend = 'same';
        } else if (betterWhen === 'lower') {
          trend = change < 0 ? 'improved' : 'worse';
        } else {
          trend = change > 0 ? 'improved' : 'worse';
        }
      }

      diffs.push({
        key,
        label: this.getLabelForKey(key),
        baseline: baselineValue,
        current: currentValue,
        change,
        pct,
        betterWhen: this.getBetterWhenForKey(key),
        trend
      });
    }

    return diffs;
  }

  private getBetterWhenForKey(key: string): 'lower' | 'higher' {
    const lowerIsBetter = /(latency|response|time|p\d+|error|fail|cpu|mem(ory)?)/i;
    const higherIsBetter = /(throughput|rps|tps|success|pass)/i;

    if (higherIsBetter.test(key)) return 'higher';
    return 'lower';
  }

  private getLabelForKey(key: string): string {
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

    return friendlyLabels[key] || key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ');
  }

  private calculateSummary(diffs: MetricDiff[]) {
    const summary = { improved: 0, worse: 0, same: 0, unknown: 0 };
    diffs.forEach(diff => {
      summary[diff.trend]++;
    });
    return summary;
  }

  private generateFallbackInsights(diffs: MetricDiff[]): AIInsight[] {
    const insights: AIInsight[] = [];

    diffs.forEach(diff => {
      if (diff.trend === 'worse' && Math.abs(diff.pct || 0) > 20) {
        insights.push({
          type: 'anomaly',
          severity: Math.abs(diff.pct || 0) > 50 ? 'high' : 'medium',
          confidence: 0.8,
          title: `Significant degradation in ${diff.label}`,
          description: `${diff.label} has degraded by ${Math.abs(diff.pct || 0).toFixed(1)}%, which exceeds normal variation.`,
          actionable_steps: [
            'Review recent deployments or configuration changes',
            'Check system resource utilization',
            'Analyze error logs for this time period'
          ],
          affected_metrics: [diff.key]
        });
      }
    });

    return insights;
  }

  // Clear cache manually
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const aiService = new SecureAIService();
