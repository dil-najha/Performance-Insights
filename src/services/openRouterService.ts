// Enhanced OpenRouter AI Service with Multi-Model Support
import type { MetricDiff, PerformanceReport, AIInsight, SystemContext, EnhancedComparisonResult } from '../types';
import { AI_CONFIG, getPreferredProvider } from '../config/ai';
import { compareReports } from '../utils/compare';

interface ModelConfig {
  id: string;
  name: string;
  cost: 'ultra-low' | 'low' | 'medium' | 'high';
  speed: 'fast' | 'medium' | 'slow';
  quality: 'basic' | 'good' | 'excellent';
  provider: string;
}

export class OpenRouterService {
  private baseUrl: string;
  private apiKey: string;
  private siteUrl: string;
  private siteName: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Get free models from config (no hardcoded models)
  private get models(): ModelConfig[] {
    return AI_CONFIG.openrouter.freeModels.map(model => ({
      id: model.id,
      name: model.name,
      cost: 'ultra-low', // All free models are ultra-low cost
      speed: 'fast',
      quality: 'excellent',
      provider: model.provider
    }));
  }

  constructor() {
    const config = AI_CONFIG.openrouter;
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.siteUrl = config.siteUrl;
    this.siteName = config.siteName;
    this.cache = new Map();

    console.log('🌟 OpenRouter Service initialized');
    console.log('🔑 API Key present:', !!this.apiKey);
    console.log('🌐 Site URL:', this.siteUrl);
    console.log('📊 Available models:', this.models.length);
  }

  /**
   * Get OpenRouter headers with site attribution
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': this.siteUrl,
      'X-Title': this.siteName,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Cache management
   */
  private getCacheKey(data: any): string {
    return JSON.stringify(data);
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('📦 Using cached OpenRouter result');
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Select optimal model based on priority (fallback only, prefer user selection)
   */
  private selectModel(priority: 'speed' | 'cost' | 'quality' = 'cost'): string {
    // Default to first free model (DeepSeek V3)
    const defaultModel = AI_CONFIG.openrouter.primaryModel;
    
    if (defaultModel && this.models.some(m => m.id === defaultModel)) {
      return defaultModel;
    }

    // Fallback to first available free model
    return this.models[0]?.id || 'deepseek/deepseek-chat-v3-0324:free';
  }

  /**
   * Make API call with fallback strategy
   */
  private async makeAPICall(
    model: string,
    messages: any[],
    maxTokens: number = 1500
  ): Promise<any> {
    try {
      console.log(`🚀 Making OpenRouter API call with model: ${model}`);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature: AI_CONFIG.openrouter.temperature,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ OpenRouter API call successful with ${model}`);
      
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error(`❌ OpenRouter API call failed with ${model}:`, error);
      throw error;
    }
  }

  /**
   * Make API call with automatic model fallback
   */
  private async callWithFallback(
    messages: any[],
    priority: 'speed' | 'cost' | 'quality' = 'cost',
    selectedModel?: string
  ): Promise<string> {
    // Use selected model if provided, otherwise use priority-based selection
    const primaryModel = selectedModel || this.selectModel(priority);
    // Use free models as fallbacks
    const fallbackModels = AI_CONFIG.openrouter.freeModels.map(m => m.id).filter(m => m !== primaryModel);
    
    console.log(`🎯 Using model: ${primaryModel}${selectedModel ? ' (user-selected)' : ' (auto-selected)'}`);
    console.log(`📋 Fallback models available: ${fallbackModels.slice(0, 3).join(', ')}...`);

    // Try primary model first
    try {
      return await this.makeAPICall(primaryModel, messages);
    } catch (error) {
      console.warn(`❌ Primary model ${primaryModel} failed, trying fallbacks...`);
    }

    // Try fallback models
    for (const model of fallbackModels) {
      try {
        console.log(`🔄 Trying fallback model: ${model}`);
        return await this.makeAPICall(model, messages);
      } catch (error) {
        console.warn(`Fallback model ${model} failed, continuing...`);
        continue;
      }
    }

    throw new Error('All OpenRouter models failed');
  }

  /**
   * Generate AI insights using OpenRouter
   */
  async generateAIInsights(diffs: MetricDiff[], context?: SystemContext): Promise<AIInsight[]> {
    if (!this.apiKey) {
      console.warn('⚠️ No OpenRouter API key found, using fallback');
      return this.generateFallbackInsights(diffs);
    }

    const cacheKey = this.getCacheKey({ diffs, context, type: 'insights' });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const prompt = this.buildInsightsPrompt(diffs, context);
      
      const messages = [
        {
          role: 'system',
          content: 'You are a performance optimization expert. Analyze performance metrics and provide specific, actionable insights. Respond with a JSON array of insights, each having: type (anomaly/suggestion/prediction), severity (low/medium/high/critical), confidence (0-1), title, description, actionable_steps (array), affected_metrics (array).'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      // Use selected model from context if provided
      const selectedModel = context?.selectedModel;
      const response = await this.callWithFallback(messages, 'quality', selectedModel);
      const insights = this.parseAIResponse(response, diffs);
      
      this.setCache(cacheKey, insights);
      return insights;

    } catch (error) {
      console.error('❌ OpenRouter insights generation failed:', error);
      return this.generateFallbackInsights(diffs);
    }
  }

  /**
   * Generate natural language explanation
   */
  async generateExplanation(diffs: MetricDiff[], context?: SystemContext): Promise<string> {
    if (!this.apiKey) {
      console.warn('⚠️ No OpenRouter API key found, using fallback');
      return this.generateFallbackExplanation(diffs);
    }

    const cacheKey = this.getCacheKey({ diffs, context, type: 'explanation' });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const prompt = this.buildExplanationPrompt(diffs, context);
      
      const messages = [
        {
          role: 'system',
          content: 'You are a performance analyst. Provide a concise, business-friendly summary of performance changes in 1-2 sentences. Focus on the most important changes and their business impact.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      // Use selected model from context if provided
      const selectedModel = context?.selectedModel;
      const response = await this.callWithFallback(messages, 'speed', selectedModel);
      const explanation = response.trim();
      
      this.setCache(cacheKey, explanation);
      return explanation;

    } catch (error) {
      console.error('❌ OpenRouter explanation generation failed:', error);
      return this.generateFallbackExplanation(diffs);
    }
  }

  /**
   * Main analysis function with OpenRouter integration
   */
  async analyzePerformance(
    baseline: PerformanceReport,
    current: PerformanceReport,
    context?: SystemContext
  ): Promise<EnhancedComparisonResult> {
    console.log('🤖 Starting OpenRouter AI analysis...');

    // Get basic comparison
    const basicResult = compareReports(baseline, current);
    
    try {
      // Run AI analysis in parallel for better performance
      const [aiInsights, explanation] = await Promise.all([
        this.generateAIInsights(basicResult.diffs, context),
        this.generateExplanation(basicResult.diffs, context)
      ]);

      const result: EnhancedComparisonResult = {
        ...basicResult,
        aiInsights,
        explanation,
        predictions: [] // Can be extended for predictions
      };

      console.log('🎉 OpenRouter analysis completed successfully');
      console.log('📊 Generated insights:', aiInsights.length);
      
      return result;

    } catch (error) {
      console.error('❌ OpenRouter analysis failed:', error);
      
      // Return basic result with fallback insights
      return {
        ...basicResult,
        aiInsights: this.generateFallbackInsights(basicResult.diffs),
        explanation: this.generateFallbackExplanation(basicResult.diffs),
        predictions: []
      };
    }
  }

  /**
   * Get credits/usage information from OpenRouter
   */
  async getUsageInfo(): Promise<any> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get OpenRouter usage info:', error);
    }

    return null;
  }

  // Helper methods for prompt building and parsing
  private buildInsightsPrompt(diffs: MetricDiff[], context?: SystemContext): string {
    const worseMetrics = diffs.filter(d => d.trend === 'worse');
    const improvedMetrics = diffs.filter(d => d.trend === 'improved');
    
    let contextInfo = '';
    if (context) {
      contextInfo = `
System Context:
- Environment: ${context.environment || 'unknown'}
- Technology Stack: ${context.stack || 'unknown'}
- Scale: ${context.scale || 'unknown'}
`;
    }

    return `
Performance Analysis Report:
${contextInfo}
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

  private buildExplanationPrompt(diffs: MetricDiff[], context?: SystemContext): string {
    const worse = diffs.filter(d => d.trend === 'worse').length;
    const improved = diffs.filter(d => d.trend === 'improved').length;
    const same = diffs.filter(d => d.trend === 'same').length;
    
    const worseMetrics = diffs.filter(d => d.trend === 'worse').slice(0, 3);
    const improvedMetrics = diffs.filter(d => d.trend === 'improved').slice(0, 3);

    let contextInfo = '';
    if (context?.environment) {
      contextInfo = ` in ${context.environment} environment`;
    }

    return `
Performance comparison summary${contextInfo}:
- ${worse} metrics degraded
- ${improved} metrics improved  
- ${same} metrics unchanged

Key changes:
${worseMetrics.map(d => `- ${d.label}: ${d.pct?.toFixed(1)}% worse`).join('\n')}
${improvedMetrics.map(d => `- ${d.label}: ${d.pct?.toFixed(1)}% better`).join('\n')}

Provide a business-friendly summary of this performance comparison in 1-2 sentences.
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
        title: 'OpenRouter AI Analysis',
        description: content.slice(0, 200) + '...',
        actionable_steps: [content],
        affected_metrics: diffs.filter(d => d.trend === 'worse').map(d => d.key),
        timestamp: new Date().toISOString()
      }];
      
    } catch (error) {
      console.error('Failed to parse OpenRouter response:', error);
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
        description: `Performance degradation detected in ${worseMetrics.length} metrics. Statistical analysis suggests system stress or recent changes.`,
        actionable_steps: [
          'Investigate recent deployments or configuration changes',
          'Check system resource utilization',
          'Review error logs for anomalies',
          'Consider performance profiling'
        ],
        affected_metrics: worseMetrics.map(m => m.key),
        timestamp: new Date().toISOString()
      });
    }

    return insights;
  }

  private generateFallbackExplanation(diffs: MetricDiff[]): string {
    const worse = diffs.filter(d => d.trend === 'worse').length;
    const improved = diffs.filter(d => d.trend === 'improved').length;

    if (worse > improved) {
      return `Performance analysis shows ${worse} metrics have degraded while ${improved} improved. The degradation suggests optimization opportunities exist.`;
    } else if (improved > worse) {
      return `Performance shows ${improved} metrics improved and only ${worse} degraded. Recent changes appear to have positive impact.`;
    } else {
      return `Performance shows balanced results with ${improved} improvements and ${worse} degradations, indicating targeted optimization effects.`;
    }
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();
