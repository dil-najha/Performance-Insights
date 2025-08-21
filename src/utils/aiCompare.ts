// Enhanced comparison utility with AI integration
import type { 
  PerformanceReport, 
  EnhancedComparisonResult, 
  SystemContext,
  AIInsight 
} from '../types';
import { compareReports } from './compare';
import { aiService } from '../services/secureAIService';

export class AIEnhancedComparison {
  private context: SystemContext;

  constructor(context: SystemContext = {}) {
    this.context = context;
  }

  async compareWithAI(
    baseline: PerformanceReport, 
    current: PerformanceReport
  ): Promise<EnhancedComparisonResult> {
    try {
      // Use the main AI analysis method
      const result = await aiService.analyzePerformance(baseline, current, this.context);
      return result;
    } catch (error) {
      console.error('AI analysis failed, falling back to basic comparison:', error);
      // Fallback to basic comparison
      return compareReports(baseline, current);
    }
  }

  // Method to update system context
  updateContext(newContext: Partial<SystemContext>): void {
    this.context = { ...this.context, ...newContext };
  }
}

// Export singleton instance
//changed comments
export const aiComparer = new AIEnhancedComparison();
