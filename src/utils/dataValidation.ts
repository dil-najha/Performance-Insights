// Data validation utilities for performance reports
import type { PerformanceReport } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized?: PerformanceReport;
}

export class DataValidator {
  static validatePerformanceReport(data: any, reportName = 'Unknown'): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!data || typeof data !== 'object') {
      return {
        valid: false,
        errors: ['Invalid data: must be a JSON object'],
        warnings: []
      };
    }

    // Check if it has metrics property
    if (!data.metrics && !this.isFlat(data)) {
      errors.push('Missing "metrics" property in report structure');
    }

    // Extract metrics
    let metrics: Record<string, number> = {};
    
    if (data.metrics && typeof data.metrics === 'object') {
      metrics = data.metrics;
    } else if (this.isFlat(data)) {
      // If it's a flat object, treat top-level numeric values as metrics
      metrics = this.extractMetricsFromFlat(data);
    } else {
      errors.push('No valid metrics found in the data');
    }

    // Validate metrics
    const validatedMetrics = this.validateMetrics(metrics);
    errors.push(...validatedMetrics.errors);
    warnings.push(...validatedMetrics.warnings);

    // Validate timestamp if present
    if (data.timestamp) {
      const timestampValidation = this.validateTimestamp(data.timestamp);
      if (!timestampValidation.valid) {
        warnings.push(`Invalid timestamp format: ${data.timestamp}`);
      }
    }

    // Create sanitized report
    const sanitized: PerformanceReport = {
      name: data.name || reportName,
      timestamp: data.timestamp || new Date().toISOString(),
      metrics: validatedMetrics.sanitized
    };

    return {
      valid: errors.length === 0 && Object.keys(validatedMetrics.sanitized).length > 0,
      errors,
      warnings,
      sanitized
    };
  }

  private static isFlat(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Check if object has mostly numeric values at top level
    const numericKeys = Object.keys(data).filter(key => 
      typeof data[key] === 'number' && !isNaN(data[key])
    );
    const totalKeys = Object.keys(data).filter(key => 
      typeof data[key] !== 'function'
    );
    
    return numericKeys.length > 0 && numericKeys.length / totalKeys.length > 0.5;
  }

  private static extractMetricsFromFlat(data: any): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number' && !isNaN(value)) {
        metrics[key] = value;
      } else if (typeof value === 'string') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          metrics[key] = numValue;
        }
      }
    }
    
    return metrics;
  }

  private static validateMetrics(metrics: any): {
    sanitized: Record<string, number>;
    errors: string[];
    warnings: string[];
  } {
    const sanitized: Record<string, number> = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!metrics || typeof metrics !== 'object') {
      errors.push('Metrics must be an object');
      return { sanitized, errors, warnings };
    }

    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'number') {
        if (isNaN(value) || !isFinite(value)) {
          warnings.push(`Skipping invalid metric "${key}": ${value}`);
        } else if (value < 0 && this.shouldBePositive(key)) {
          warnings.push(`Metric "${key}" has negative value: ${value}`);
          sanitized[key] = Math.abs(value);
        } else {
          sanitized[key] = value;
        }
      } else if (typeof value === 'string') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          sanitized[key] = numValue;
          warnings.push(`Converted string metric "${key}" to number: ${value} → ${numValue}`);
        } else {
          warnings.push(`Skipping non-numeric metric "${key}": ${value}`);
        }
      } else {
        warnings.push(`Skipping non-numeric metric "${key}": ${typeof value}`);
      }
    }

    if (Object.keys(sanitized).length === 0) {
      errors.push('No valid numeric metrics found');
    }

    return { sanitized, errors, warnings };
  }

  private static shouldBePositive(key: string): boolean {
    const positiveMetrics = /(time|latency|throughput|rps|tps|memory|cpu|size|count|rate)/i;
    return positiveMetrics.test(key);
  }

  private static validateTimestamp(timestamp: any): { valid: boolean; normalized?: string } {
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return { valid: true, normalized: date.toISOString() };
      }
    }
    
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return { valid: true, normalized: date.toISOString() };
      }
    }

    return { valid: false };
  }

  // Validate JSON string before parsing
  static validateJSONString(jsonString: string): { valid: boolean; parsed?: any; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      return { valid: true, parsed };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Invalid JSON format'
      };
    }
  }

  // Check for common metric patterns and suggest fixes
  static suggestMetricFixes(data: any): string[] {
    const suggestions: string[] = [];
    
    if (data && typeof data === 'object') {
      const keys = Object.keys(data);
      
      // Check for common naming patterns
      if (keys.some(k => k.includes('response_time'))) {
        suggestions.push('Consider using camelCase: "responseTime" instead of "response_time"');
      }
      
      if (keys.some(k => k.includes('error_rate'))) {
        suggestions.push('Consider using camelCase: "errorRate" instead of "error_rate"');
      }
      
      // Check for percentage values that might be in wrong format
      const possiblePercentages = keys.filter(k => 
        k.toLowerCase().includes('rate') || k.toLowerCase().includes('percent')
      );
      
      possiblePercentages.forEach(key => {
        const value = data[key];
        if (typeof value === 'number' && value > 1 && value <= 100) {
          suggestions.push(`"${key}" might be a percentage - ensure it's in the expected format (0-1 vs 0-100)`);
        }
      });
    }
    
    return suggestions;
  }
}

// Enhanced upload panel with validation
export function useDataValidation() {
  const validateFile = (file: File): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        
        // Validate JSON format first
        const jsonValidation = DataValidator.validateJSONString(text);
        if (!jsonValidation.valid) {
          resolve({
            valid: false,
            errors: [`JSON parsing error: ${jsonValidation.error}`],
            warnings: []
          });
          return;
        }
        
        // Validate as performance report
        const validation = DataValidator.validatePerformanceReport(
          jsonValidation.parsed, 
          file.name.replace('.json', '')
        );
        
        // Add suggestions
        const suggestions = DataValidator.suggestMetricFixes(jsonValidation.parsed);
        validation.warnings.push(...suggestions);
        
        resolve(validation);
      };
      
      reader.onerror = () => {
        resolve({
          valid: false,
          errors: ['Failed to read file'],
          warnings: []
        });
      };
      
      reader.readAsText(file);
    });
  };

  return { validateFile };
}
