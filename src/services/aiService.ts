// Secure AI Service Layer for Performance Insights
import type { MetricDiff, PerformanceReport, AIInsight, SystemContext, EnhancedComparisonResult } from '../types';

export class SecureAIService {
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:3001/api';
    this.apiKey = import.meta.env.VITE_API_SECRET_KEY || 'dev-secure-api-key-for-performance-insights-2025';
    this.cache = new Map();
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

  // Main AI Analysis endpoint
  async analyzePerformance(
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
      console.error('❌ Performance analysis failed:', error);
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

  // 1. AI-Powered Anomaly Detection
  async detectAnomalies(diffs: MetricDiff[]): Promise<AIInsight[]> {
    try {
      console.log('🔍 Calling AI Anomaly Detection API...');
      console.log('API URL:', `${this.baseUrl}/anomalies`);
      console.log('API Key present:', !!this.apiKey);
      console.log('Metrics to analyze:', diffs);
      
      const response = await fetch(`${this.baseUrl}/anomalies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ metrics: diffs })
      });

      console.log('API Response Status:', response.status);
      console.log('API Response OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Anomaly detection failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Anomaly Detection Result:', result);
      return result;
    } catch (error) {
      console.error('❌ AI Anomaly Detection Error:', error);
      console.log('🔄 Using fallback anomaly detection');
      return this.fallbackAnomalyDetection(diffs);
    }
  }

  // 2. GPT-Powered Smart Suggestions
  async generateSmartSuggestions(
    diffs: MetricDiff[], 
    context?: SystemContext
  ): Promise<AIInsight[]> {
    const prompt = this.buildSuggestionsPrompt(diffs, context);
    
    try {
      const response = await fetch(`${this.baseUrl}/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ prompt, context })
      });

      return await response.json();
    } catch (error) {
      console.error('AI Suggestions Error:', error);
      return this.fallbackSuggestions(diffs);
    }
  }

  // 3. Root Cause Analysis
  async analyzeRootCauses(diffs: MetricDiff[]): Promise<AIInsight[]> {
    const correlations = this.calculateCorrelations(diffs);
    
    try {
      const response = await fetch(`${this.baseUrl}/root-cause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ 
          metrics: diffs, 
          correlations 
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Root Cause Analysis Error:', error);
      return [];
    }
  }

  // 4. Performance Prediction
  async predictPerformance(
    current: PerformanceReport,
    historical?: PerformanceReport[]
  ): Promise<AIInsight[]> {
    try {
      const response = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ 
          current, 
          historical: historical?.slice(-30) // Last 30 data points
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Performance Prediction Error:', error);
      return [];
    }
  }

  // 5. Natural Language Explanation
  async explainMetrics(diffs: MetricDiff[]): Promise<string> {
    const prompt = `
    Explain this performance comparison in simple terms:
    
    ${diffs.map(d => `${d.label}: ${d.baseline} → ${d.current} (${d.pct?.toFixed(1)}% ${d.trend})`).join('\n')}
    
    Provide a concise, business-friendly summary.
    `;

    try {
      const response = await fetch(`${this.baseUrl}/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ prompt })
      });

      const result = await response.json();
      return result.explanation || 'No explanation available.';
    } catch (error) {
      console.error('AI Explanation Error:', error);
      return this.fallbackExplanation(diffs);
    }
  }

  // Private helper methods
  private buildSuggestionsPrompt(diffs: MetricDiff[], context?: SystemContext): string {
    const worseMetrics = diffs.filter(d => d.trend === 'worse');
    const improvedMetrics = diffs.filter(d => d.trend === 'improved');

    return `
    Performance Analysis Report:
    
    DEGRADED METRICS:
    ${worseMetrics.map(d => `- ${d.label}: ${d.baseline} → ${d.current} (${d.pct?.toFixed(1)}% worse)`).join('\n')}
    
    IMPROVED METRICS:
    ${improvedMetrics.map(d => `- ${d.label}: ${d.baseline} → ${d.current} (${d.pct?.toFixed(1)}% better)`).join('\n')}
    
    SYSTEM CONTEXT:
    - Technology Stack: ${context?.stack || 'Unknown'}
    - Environment: ${context?.environment || 'Unknown'}
    - Scale: ${context?.scale || 'Unknown'}
    
    Please provide:
    1. Root cause analysis for degraded metrics
    2. Specific, actionable optimization recommendations
    3. Priority ranking (high/medium/low impact)
    4. Implementation effort estimates
    
    Focus on practical solutions with measurable impact.
    `;
  }

  private calculateCorrelations(diffs: MetricDiff[]): Record<string, number> {
    // Simple correlation calculation
    const correlations: Record<string, number> = {};
    
    for (let i = 0; i < diffs.length; i++) {
      for (let j = i + 1; j < diffs.length; j++) {
        const metric1 = diffs[i];
        const metric2 = diffs[j];
        
        if (metric1.pct !== null && metric2.pct !== null) {
          // Simplified correlation: same direction change
          const correlation = Math.sign(metric1.pct) === Math.sign(metric2.pct) ? 0.7 : -0.3;
          correlations[`${metric1.key}-${metric2.key}`] = correlation;
        }
      }
    }
    
    return correlations;
  }

  // Fallback methods for when AI services are unavailable
  private fallbackAnomalyDetection(diffs: MetricDiff[]): AIInsight[] {
    return diffs
      .filter(d => d.pct !== null && Math.abs(d.pct) > 20)
      .map(d => ({
        type: 'anomaly' as const,
        severity: Math.abs(d.pct!) > 50 ? 'high' : 'medium',
        confidence: 0.7,
        title: `Significant change in ${d.label}`,
        description: `${d.label} changed by ${d.pct?.toFixed(1)}% - this may indicate a performance issue.`,
        actionable_steps: ['Investigate recent changes', 'Check system resources'],
        affected_metrics: [d.key]
      }));
  }

  private fallbackSuggestions(diffs: MetricDiff[]): AIInsight[] {
    const suggestions: AIInsight[] = [];
    
    const hasLatencyIssues = diffs.some(d => 
      /response|latency|time/i.test(d.key) && d.trend === 'worse'
    );
    
    if (hasLatencyIssues) {
      suggestions.push({
        type: 'suggestion',
        severity: 'medium',
        confidence: 0.8,
        title: 'Optimize Response Times',
        description: 'Response time degradation detected.',
        actionable_steps: [
          'Add caching layers',
          'Optimize database queries',
          'Review application bottlenecks'
        ],
        affected_metrics: diffs.filter(d => /response|latency|time/i.test(d.key)).map(d => d.key)
      });
    }
    
    return suggestions;
  }

  private fallbackExplanation(diffs: MetricDiff[]): string {
    const worse = diffs.filter(d => d.trend === 'worse').length;
    const improved = diffs.filter(d => d.trend === 'improved').length;
    
    if (worse > improved) {
      return `Performance has degraded with ${worse} metrics showing worse performance. Focus on optimization is recommended.`;
    } else if (improved > worse) {
      return `Performance has improved with ${improved} metrics showing better performance. Great job!`;
    } else {
      return `Performance is mixed with both improvements and degradations. Review individual metrics for targeted optimization.`;
    }
  }

  // Clear cache manually
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const aiService = new SecureAIService();
