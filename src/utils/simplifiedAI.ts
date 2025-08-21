// Real AI Integration with OpenAI
import type { MetricDiff, AIInsight, PerformanceReport, EnhancedComparisonResult } from '../types';
import { compareReports } from './compare';

export class SimplifiedAI {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
    console.log('🤖 AI Service initialized with model:', this.model);
    console.log('🔑 API Key present:', !!this.apiKey);
  }

  // Real OpenAI API call for insights
  async generateAIInsights(diffs: MetricDiff[]): Promise<AIInsight[]> {
    console.log('🤖 Generating REAL AI insights for diffs:', diffs);
    
    if (!this.apiKey) {
      console.warn('⚠️ No OpenAI API key found, using fallback insights');
      return this.generateFallbackInsights(diffs);
    }

    try {
      const prompt = this.buildInsightsPrompt(diffs);
      console.log('📝 Sending prompt to OpenAI:', prompt);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a performance optimization expert. Analyze performance metrics and provide specific, actionable insights. Respond with a JSON array of insights, each having: type (anomaly/suggestion/prediction), severity (low/medium/high/critical), confidence (0-1), title, description, actionable_steps (array), affected_metrics (array).'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.choices[0]?.message?.content;
      
      console.log('✅ Raw OpenAI response:', aiContent);

      // Parse the AI response
      const insights = this.parseAIResponse(aiContent, diffs);
      console.log('🎯 Parsed AI insights:', insights);
      
      return insights;

    } catch (error) {
      console.error('❌ OpenAI API call failed:', error);
      console.log('🔄 Using fallback insights');
      return this.generateFallbackInsights(diffs);
    }
  }

  private buildInsightsPrompt(diffs: MetricDiff[]): string {
    const worseMetrics = diffs.filter(d => d.trend === 'worse');
    const improvedMetrics = diffs.filter(d => d.trend === 'improved');
    
    return `
Performance Analysis Report:

DEGRADED METRICS (need attention):
${worseMetrics.map(d => `- ${d.label}: ${d.baseline} → ${d.current} (${d.pct?.toFixed(1)}% ${d.trend})`).join('\n')}

IMPROVED METRICS:
${improvedMetrics.map(d => `- ${d.label}: ${d.baseline} → ${d.current} (${d.pct?.toFixed(1)}% ${d.trend})`).join('\n')}

Please analyze this performance data and provide 2-4 specific, actionable insights. Focus on:
1. Root cause analysis for degraded metrics
2. Specific optimization recommendations
3. Priority ranking based on impact

Return as JSON array with insights having: type, severity, confidence, title, description, actionable_steps, affected_metrics.
    `.trim();
  }

  private parseAIResponse(content: string, diffs: MetricDiff[]): AIInsight[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.map(insight => ({
            ...insight,
            timestamp: new Date().toISOString()
          }));
        }
      }

      // If parsing fails, create a single insight from the text
      return [{
        type: 'suggestion' as const,
        severity: 'medium' as const,
        confidence: 0.8,
        title: 'AI Performance Analysis',
        description: content.slice(0, 200) + '...',
        actionable_steps: [content],
        affected_metrics: diffs.filter(d => d.trend === 'worse').map(d => d.key),
        timestamp: new Date().toISOString()
      }];
      
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.generateFallbackInsights(diffs);
    }
  }

  private generateFallbackInsights(diffs: MetricDiff[]): AIInsight[] {
    const insights: AIInsight[] = [];

    const worseMetrics = diffs.filter(d => d.trend === 'worse');
    
    if (worseMetrics.length > 0) {
      insights.push({
        type: 'anomaly',
        severity: 'high',
        confidence: 0.9,
        title: `${worseMetrics.length} Metrics Degraded`,
        description: `Performance degradation detected in ${worseMetrics.length} metrics. Manual analysis suggests system stress or recent changes.`,
        actionable_steps: [
          'Investigate recent deployments or changes',
          'Check system resource utilization',
          'Review error logs for anomalies'
        ],
        affected_metrics: worseMetrics.map(m => m.key),
        timestamp: new Date().toISOString()
      });
    }

    return insights;
  }

  // Real OpenAI explanation
  async generateExplanation(diffs: MetricDiff[]): Promise<string> {
    if (!this.apiKey) {
      console.warn('⚠️ No OpenAI API key found, using fallback explanation');
      return this.generateFallbackExplanation(diffs);
    }

    try {
      const prompt = this.buildExplanationPrompt(diffs);
      console.log('📝 Getting AI explanation...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a performance analyst. Provide a concise, business-friendly summary of performance changes in 1-2 sentences.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const explanation = data.choices[0]?.message?.content?.trim();
      
      console.log('✅ AI explanation:', explanation);
      return explanation || this.generateFallbackExplanation(diffs);

    } catch (error) {
      console.error('❌ AI explanation failed:', error);
      return this.generateFallbackExplanation(diffs);
    }
  }

  private buildExplanationPrompt(diffs: MetricDiff[]): string {
    const worse = diffs.filter(d => d.trend === 'worse').length;
    const improved = diffs.filter(d => d.trend === 'improved').length;
    const same = diffs.filter(d => d.trend === 'same').length;
    
    const worseMetrics = diffs.filter(d => d.trend === 'worse').slice(0, 3);
    const improvedMetrics = diffs.filter(d => d.trend === 'improved').slice(0, 3);

    return `
Performance comparison summary:
- ${worse} metrics degraded
- ${improved} metrics improved  
- ${same} metrics unchanged

Key changes:
${worseMetrics.map(d => `- ${d.label}: ${d.pct?.toFixed(1)}% worse`).join('\n')}
${improvedMetrics.map(d => `- ${d.label}: ${d.pct?.toFixed(1)}% better`).join('\n')}

Provide a business-friendly summary of this performance comparison.
    `.trim();
  }

  private generateFallbackExplanation(diffs: MetricDiff[]): string {
    const worse = diffs.filter(d => d.trend === 'worse').length;
    const improved = diffs.filter(d => d.trend === 'improved').length;

    if (worse > improved) {
      return `Performance analysis shows ${worse} metrics have degraded while ${improved} improved. The degradation suggests optimization opportunities exist.`;
    } else if (improved > worse) {
      return `Excellent! Performance shows ${improved} metrics improved and only ${worse} degraded. Recent optimizations appear effective.`;
    } else {
      return `Performance shows mixed results with balanced improvements and degradations, indicating targeted optimization effects.`;
    }
  }

  // Main comparison function with AI
  async compareWithAI(
    baseline: PerformanceReport, 
    current: PerformanceReport
  ): Promise<EnhancedComparisonResult> {
    console.log('🚀 Starting AI-enhanced comparison...');
    
    // Get basic comparison
    const basicResult = compareReports(baseline, current);
    console.log('Basic comparison result:', basicResult);

    try {
      // Generate AI insights and explanation
      const [aiInsights, explanation] = await Promise.all([
        this.generateAIInsights(basicResult.diffs),
        this.generateExplanation(basicResult.diffs)
      ]);

      const result: EnhancedComparisonResult = {
        ...basicResult,
        aiInsights,
        explanation,
        predictions: [] // We can add predictions later
      };

      console.log('🎉 AI-enhanced result:', result);
      return result;

    } catch (error) {
      console.error('❌ AI enhancement failed:', error);
      // Return basic result with empty AI data
      return {
        ...basicResult,
        aiInsights: [],
        explanation: 'AI analysis unavailable. Showing basic comparison.',
        predictions: []
      };
    }
  }
}

// Export singleton
export const simplifiedAI = new SimplifiedAI();
