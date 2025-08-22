// Enhanced AI Integration with OpenRouter + OpenAI Support
import type { MetricDiff, AIInsight, PerformanceReport, EnhancedComparisonResult, SystemContext } from '../types';
import { compareReports } from './compare';
import { AI_CONFIG, getPreferredProvider } from '../config/ai';

export class SimplifiedAI {
  private openrouterKey: string;
  private openaiKey: string;
  private provider: 'openrouter' | 'openai' | 'local';
  private model: string;
  private baseUrl: string = '';

  constructor() {
    this.openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    this.openaiKey = ''; // DISABLED - Force free models only
    
    // Force OpenRouter or local only (no OpenAI)
    if (this.openrouterKey) {
      this.provider = 'openrouter';
      this.model = AI_CONFIG.openrouter.primaryModel;
      this.baseUrl = AI_CONFIG.openrouter.baseUrl;
      console.log('🌟 SimplifiedAI FORCED to OpenRouter (free models only)');
      console.log('🎯 Primary model:', this.model);
    } else {
      this.provider = 'local';
      this.model = 'local-fallback';
      console.log('🏠 No OpenRouter key - using local fallback only');
    }
    
    console.log('🤖 AI Provider:', this.provider);
    console.log('🔑 OpenRouter Key available:', !!this.openrouterKey);
    console.log('🚫 OpenAI DISABLED to prevent gpt-4o usage');
  }

  /**
   * Get headers for API requests based on provider
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.provider === 'openrouter') {
      headers['Authorization'] = `Bearer ${this.openrouterKey}`;
      headers['HTTP-Referer'] = AI_CONFIG.openrouter.siteUrl;
      headers['X-Title'] = AI_CONFIG.openrouter.siteName;
    } else if (this.provider === 'openai') {
      headers['Authorization'] = `Bearer ${this.openaiKey}`;
    }

    return headers;
  }

  /**
   * Make API call with automatic fallback
   */
  private async makeAPICall(prompt: string, maxTokens: number = 15000, selectedModel?: string): Promise<string> {
    // Only use OpenRouter (free models) - no OpenAI fallback
    if (this.provider === 'openrouter' && this.openrouterKey) {
      try {
        return await this.callOpenRouter(prompt, maxTokens, selectedModel);
      } catch (error) {
        console.error('❌ OpenRouter failed, no fallback to prevent gpt-4o usage:', error);
        throw new Error('OpenRouter failed and OpenAI is disabled for free models only');
      }
    }
    
    throw new Error('No OpenRouter API key available - only free models supported');
  }

  /**
   * Call OpenRouter API with model fallback
   */
  private async callOpenRouter(prompt: string, maxTokens: number, selectedModel?: string): Promise<string> {
    // Use selected model if provided, otherwise use free models
    const freeModelIds = AI_CONFIG.openrouter.freeModels.map(m => m.id);
    const models = selectedModel ? [selectedModel, ...freeModelIds.filter(m => m !== selectedModel)] : freeModelIds;
    
    console.log(`🎯 Model priority: ${selectedModel ? `${selectedModel} (user-selected)` : 'auto-fallback'}`);
    
    for (const model of models) {
      try {
        console.log(`🌟 Trying OpenRouter model: ${model}`);
        
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are a performance optimization expert.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: maxTokens,
            temperature: AI_CONFIG.openrouter.temperature
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        
        if (content) {
          console.log(`✅ OpenRouter success with model: ${model}`);
          return content;
        }
        
        throw new Error('No content in response');
        
      } catch (error) {
        console.warn(`Model ${model} failed:`, error);
        continue;
      }
    }
    
    throw new Error('All OpenRouter models failed');
  }

  /**
   * Call OpenAI API directly
   */
  private async callOpenAI(prompt: string, maxTokens: number): Promise<string> {
    console.log('🔄 Making OpenAI API call...');
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a performance optimization expert.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }
    
    console.log('✅ OpenAI API call successful');
    return content;
  }

  // Real OpenAI API call for insights
  async generateAIInsights(diffs: MetricDiff[], context?: SystemContext): Promise<AIInsight[]> {
    console.log('🤖 Generating REAL AI insights for diffs:', diffs);
    
    if (this.provider === 'local') {
      console.warn('⚠️ No AI provider available, using fallback insights');
      return this.generateFallbackInsights(diffs);
    }

    try {
      const prompt = this.buildInsightsPrompt(diffs, context);
      console.log('📝 Sending prompt with context to AI provider:', this.provider);

      // Build enhanced system prompt based on available context
      let systemPrompt = 'You are a performance optimization expert. Analyze performance metrics and provide specific, actionable insights.';
      
      // Enhance system prompt when advanced context is provided
      if (context) {
        const hasAdvancedContext = context.business_criticality || context.recent_changes?.trim() || 
                                  context.performance_goals?.trim() || context.known_issues?.trim() || 
                                  context.custom_focus?.trim();
        
        if (hasAdvancedContext) {
          systemPrompt = `You are a senior performance optimization expert specializing in ${context.stack || 'web applications'}.
          
${context.business_criticality ? `This is a ${context.business_criticality} priority system. ` : ''}
${context.recent_changes?.trim() ? `Recent changes: ${context.recent_changes}. ` : ''}
${context.known_issues?.trim() ? `Known issues: ${context.known_issues}. ` : ''}
${context.custom_focus?.trim() ? `Focus area: ${context.custom_focus}. ` : ''}

Analyze performance metrics and provide specific, actionable insights considering the above context.`;
        }
      }
      
      systemPrompt += ' Respond with a JSON array of insights, each having: type (anomaly/suggestion/prediction), severity (low/medium/high/critical), confidence (0-1), title, description, actionable_steps (array), affected_metrics (array).';
      
      const fullPrompt = `${systemPrompt}\n\nUser Query: ${prompt}`;
      
      // Use selected model from context if provided and increase token limit
      const selectedModel = context?.selectedModel;
      const aiContent = await this.makeAPICall(fullPrompt, 15000, selectedModel);
      console.log('✅ Raw AI response:', aiContent);

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

  private buildInsightsPrompt(diffs: MetricDiff[], context?: SystemContext): string {
    const worseMetrics = diffs.filter(d => d.trend === 'worse');
    const improvedMetrics = diffs.filter(d => d.trend === 'improved');
    
    // Include advanced context in prompt (only when provided)
    const contextLines = [];
    if (context?.environment) contextLines.push(`Environment: ${context.environment}`);
    if (context?.stack) contextLines.push(`Technology Stack: ${context.stack}`);
    if (context?.scale) contextLines.push(`Scale: ${context.scale}`);
    if (context?.business_criticality) contextLines.push(`Business Impact: ${context.business_criticality}`);
    if (context?.performance_goals?.trim()) contextLines.push(`Goals: ${context.performance_goals}`);
    if (context?.known_issues?.trim()) contextLines.push(`Known Issues: ${context.known_issues}`);
    if (context?.custom_focus?.trim()) contextLines.push(`Focus Area: ${context.custom_focus}`);
    
    const contextSection = contextLines.length > 0 ? 
      `\nSYSTEM CONTEXT:\n${contextLines.map(item => `- ${item}`).join('\n')}\n` : '';
    
    return `
Performance Analysis Report:${contextSection}

DEGRADED METRICS (need attention):
${worseMetrics.map(d => `- ${d.label}: ${d.baseline} → ${d.current} (${d.pct?.toFixed(1)}% ${d.trend})`).join('\n')}

IMPROVED METRICS:
${improvedMetrics.map(d => `- ${d.label}: ${d.baseline} → ${d.current} (${d.pct?.toFixed(1)}% ${d.trend})`).join('\n')}

Please analyze this performance data and provide 2-4 specific, actionable insights. Focus on:
1. Root cause analysis for degraded metrics
2. Specific optimization recommendations  
3. Priority ranking based on business impact and context

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

  // Enhanced AI explanation with provider fallback
  async generateExplanation(diffs: MetricDiff[], context?: SystemContext): Promise<string> {
    if (this.provider === 'local') {
      console.warn('⚠️ No AI provider available, using fallback explanation');
      return this.generateFallbackExplanation(diffs);
    }

    try {
      const prompt = this.buildExplanationPrompt(diffs);
      console.log('📝 Getting AI explanation from:', this.provider);

      // Build context-aware system prompt for explanations
      let systemPrompt = 'You are a performance analyst. Provide a concise, business-friendly summary of performance changes in 1-2 sentences.';
      
      if (context?.business_criticality || context?.custom_focus?.trim()) {
        systemPrompt += ` Focus on ${context.business_criticality ? `${context.business_criticality} priority` : 'business'} impact${context.custom_focus?.trim() ? ` and ${context.custom_focus}` : ''}.`;
      }
      
      const fullPrompt = `${systemPrompt}\n\nUser Query: ${prompt}`;
      
      // Use selected model from context if provided
      const selectedModel = context?.selectedModel;
      const explanation = await this.makeAPICall(fullPrompt, 500, selectedModel);
      const trimmedExplanation = explanation.trim();
      
      console.log('✅ AI explanation:', trimmedExplanation);
      return trimmedExplanation || this.generateFallbackExplanation(diffs);

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
    current: PerformanceReport,
    context?: SystemContext
  ): Promise<EnhancedComparisonResult> {
    console.log('🚀 Starting AI-enhanced comparison...');
    
    // Get basic comparison
    const basicResult = compareReports(baseline, current);
    console.log('Basic comparison result:', basicResult);

    try {
      // Generate AI insights and explanation
      const [aiInsights, explanation] = await Promise.all([
        this.generateAIInsights(basicResult.diffs, context),
        this.generateExplanation(basicResult.diffs, context)
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
