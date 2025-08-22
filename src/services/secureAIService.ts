// Amazon Bedrock AI Service Layer for Performance Insights
// Clean implementation with only Bedrock support

import type { MetricDiff, PerformanceReport, AIInsight, SystemContext, EnhancedComparisonResult } from '../types';
import { getPreferredProvider, validateAIConfig } from '../config/ai';
import { compareReports } from '../utils/compare';

export class SecureAIService {
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:3001/api';
    this.apiKey = import.meta.env.VITE_API_SECRET_KEY || 'bedrock-performance-insights-2025';
    this.cache = new Map();

    // Log provider configuration
    const provider = getPreferredProvider();
    const config = validateAIConfig();
    console.log('🏆 Bedrock AI Service initialized');
    console.log('🎯 Provider:', provider);
    console.log('✅ Bedrock available:', config.providers.bedrock);
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
      console.log('📦 Using cached Bedrock result for:', endpoint);
      return cached;
    }

    try {
      console.log('🏆 Making Bedrock API request to:', endpoint);
      
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
        throw new Error(`Bedrock API request failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Bedrock API request failed:', error);
      throw error;
    }
  }

  // Main AI Analysis using Amazon Bedrock
  async analyzePerformance(
    baseline: PerformanceReport, 
    current: PerformanceReport, 
    systemContext?: SystemContext
  ): Promise<EnhancedComparisonResult> {
    const provider = getPreferredProvider();
    
    console.log(`🎯 Using AI provider: ${provider}`);

    if (provider === 'bedrock') {
      try {
        console.log('🏆 Using Amazon Bedrock Claude models...');
        
        const result = await this.makeRequest('/ai/analyze', {
          baseline,
          current,
          systemContext
        });

        console.log('✅ Bedrock analysis successful');
        
        return {
          diffs: result.diffs,
          summary: result.summary,
          aiInsights: result.aiInsights || [],
          predictions: result.predictions || [],
          explanation: result.explanation
        };
        
      } catch (error) {
        console.error('❌ Bedrock analysis failed:', error);
        // Return basic analysis as fallback
        const basicResult = compareReports(baseline, current);
        return {
          ...basicResult,
          explanation: 'Analysis completed using basic algorithms (Bedrock temporarily unavailable)'
        };
      }
    } else {
      // Local analysis fallback
      console.log('🏠 Using local analysis only (Bedrock not configured)...');
      const basicResult = compareReports(baseline, current);
      return {
        ...basicResult,
        explanation: 'Analysis completed using basic algorithms (AWS Bedrock not configured)'
      };
    }
  }

  // Direct prompt to Bedrock (following AmazonBedrockAI.md pattern)
  async directPrompt(prompt: string, modelId?: string): Promise<string> {
    try {
      console.log('🏆 Sending direct prompt to Bedrock...');
      
      const result = await this.makeRequest('/ai/prompt', {
        prompt,
        modelId
      });

      console.log('✅ Bedrock prompt successful');
      return result.result;
      
    } catch (error) {
      console.error('❌ Bedrock prompt failed:', error);
      throw error;
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

  // Check Bedrock health
  async checkHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return { status: 'error', bedrock: { available: false } };
    }
  }

  // Clear cache manually
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const aiService = new SecureAIService();