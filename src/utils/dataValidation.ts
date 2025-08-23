// Data validation utilities for performance reports
import type { PerformanceReport } from '../types';

// K6 specific types
export interface K6Metric {
  type: 'rate' | 'trend' | 'counter' | 'gauge';
  contains: 'default' | 'time' | 'data';
  values: Record<string, number>;
  thresholds?: Record<string, { ok: boolean }>;
}

export interface K6Report {
  metrics: Record<string, K6Metric>;
  root_group?: {
    checks: Array<{
      name: string;
      passes: number;
      fails: number;
    }>;
  };
  options?: any;
  state?: any;
}

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

    // Check if this is a K6 report format
    if (this.isK6Format(data)) {
      warnings.push('Detected K6 performance test format - converting to standard format');
      return this.validateK6Report(data, reportName);
    }

    // Check if it has metrics property
    if (!data.metrics && !this.isFlat(data)) {
      errors.push('Missing "metrics" property in report structure');
    }

    // Extract metrics
    let metrics: Record<string, number> = {};
    
    if (data.metrics && typeof data.metrics === 'object') {
      // Check if metrics are already in simple format
      if (this.isSimpleMetrics(data.metrics)) {
        metrics = data.metrics;
      } else {
        // Try to extract from complex metrics structure
        metrics = this.extractSimpleMetrics(data.metrics);
        warnings.push('Extracted metrics from complex structure');
      }
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

  // Check if data is in K6 format
  private static isK6Format(data: any): boolean {
    return data && 
           typeof data === 'object' && 
           data.metrics && 
           typeof data.metrics === 'object' &&
           Object.values(data.metrics).some((metric: any) => 
             metric && 
             typeof metric === 'object' && 
             metric.type && 
             metric.values &&
             ['rate', 'trend', 'counter', 'gauge'].includes(metric.type)
           );
  }

  // Validate K6 format and convert to standard format
  private static validateK6Report(data: K6Report, reportName: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const extractedMetrics: Record<string, number> = {};

    try {
      // Define critical metrics we want to extract
      const criticalMetrics = this.getCriticalK6Metrics();
      
      // Extract only critical metrics from K6 format
      for (const [metricName, metric] of Object.entries(data.metrics)) {
        if (!metric || typeof metric !== 'object' || !metric.values) continue;
        
        // Check if this is a critical metric we care about
        const criticalConfig = criticalMetrics[metricName];
        if (!criticalConfig) continue; // Skip non-critical metrics
        
        // Extract only the values we need for this critical metric
        for (const valueKey of criticalConfig.extract) {
          const value = metric.values[valueKey];
          if (typeof value === 'number') {
            const metricKey = criticalConfig.transform ? 
              criticalConfig.transform(metricName, valueKey) : 
              `${metricName}_${valueKey}`;
            extractedMetrics[metricKey] = value;
          }
        }

        // Handle threshold status for critical metrics
        if (metric.thresholds && criticalConfig.includeThresholds) {
          for (const [thresholdName, threshold] of Object.entries(metric.thresholds)) {
            const thresholdKey = `${metricName}_threshold_ok`;
            extractedMetrics[thresholdKey] = threshold.ok ? 1 : 0;
          }
        }
      }

      // Extract overall check results (always important)
      if (data.root_group?.checks) {
        let totalPasses = 0;
        let totalFails = 0;
        
        for (const check of data.root_group.checks) {
          totalPasses += check.passes || 0;
          totalFails += check.fails || 0;
        }
        
        // Only extract overall check metrics, not individual checks
        extractedMetrics['checks_total_passes'] = totalPasses;
        extractedMetrics['checks_total_fails'] = totalFails;
        extractedMetrics['checks_success_rate'] = totalPasses + totalFails > 0 ? totalPasses / (totalPasses + totalFails) : 0;
      }

      // Validate extracted metrics
      const validatedMetrics = this.validateMetrics(extractedMetrics);
      errors.push(...validatedMetrics.errors);
      warnings.push(...validatedMetrics.warnings);

      // Create sanitized report
      const sanitized: PerformanceReport = {
        name: reportName,
        timestamp: data.state?.testRunDurationMs ? 
          new Date(Date.now() - data.state.testRunDurationMs).toISOString() : 
          new Date().toISOString(),
        metrics: validatedMetrics.sanitized
      };

      warnings.push(`Extracted ${Object.keys(validatedMetrics.sanitized).length} critical metrics from K6 report`);

      return {
        valid: errors.length === 0 && Object.keys(validatedMetrics.sanitized).length > 0,
        errors,
        warnings,
        sanitized
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to process K6 report: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      };
    }
  }

  // Define critical K6 metrics to extract (Updated for Test-App compatibility)
  private static getCriticalK6Metrics(): Record<string, {
    extract: string[];
    transform?: (metricName: string, valueKey: string) => string;
    includeThresholds?: boolean;
  }> {
    return {
      // 🎯 Core Web Vitals (Original Browser Format)
      'browser_web_vital_fcp': {
        extract: ['avg', 'p(95)'],
        transform: (name, key) => key === 'p(95)' ? 'fcp_p95_ms' : 'fcp_avg_ms'
      },
      'browser_web_vital_lcp': {
        extract: ['avg', 'p(95)'],
        transform: (name, key) => key === 'p(95)' ? 'lcp_p95_ms' : 'lcp_avg_ms'
      },
      'browser_web_vital_cls': {
        extract: ['avg'],
        transform: () => 'cls_avg'
      },
      'browser_web_vital_fid': {
        extract: ['avg', 'p(95)'],
        transform: (name, key) => key === 'p(95)' ? 'fid_p95_ms' : 'fid_avg_ms'
      },
      'browser_web_vital_inp': {
        extract: ['avg', 'p(95)'],
        transform: (name, key) => key === 'p(95)' ? 'inp_p95_ms' : 'inp_avg_ms'
      },
      'browser_web_vital_ttfb': {
        extract: ['avg', 'p(95)'],
        transform: (name, key) => key === 'p(95)' ? 'ttfb_p95_ms' : 'ttfb_avg_ms'
      },

      // 🧪 Test-App Core Web Vitals (New Test-App Format)
      'test_app_web_vital_fcp': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `test_app_fcp_${key.replace('(', '').replace(')', '')}`
      },
      'test_app_web_vital_lcp': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `test_app_lcp_${key.replace('(', '').replace(')', '')}`
      },
      'test_app_web_vital_cls': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `test_app_cls_${key.replace('(', '').replace(')', '')}`
      },
      'test_app_web_vital_inp': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `test_app_inp_${key.replace('(', '').replace(')', '')}`
      },
      'test_app_web_vital_ttfb': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `test_app_ttfb_${key.replace('(', '').replace(')', '')}`
      },

      // 🚀 Test-App Response Times
      'login_response_time': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `login_response_${key.replace('(', '').replace(')', '')}_ms`,
        includeThresholds: true
      },
      'dashboard_load_time': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `dashboard_load_${key.replace('(', '').replace(')', '')}_ms`
      },
      'api_response_time': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `api_response_${key.replace('(', '').replace(')', '')}_ms`
      },
      'users_api_response_time': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `users_api_response_${key.replace('(', '').replace(')', '')}_ms`
      },
      'database_query_time': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `database_query_${key.replace('(', '').replace(')', '')}_ms`
      },

      // 💾 Test-App System Resources
      'memory_usage_mb': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `memory_usage_${key.replace('(', '').replace(')', '')}_mb`
      },
      'cpu_utilization_percent': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `cpu_utilization_${key.replace('(', '').replace(')', '')}_pct`
      },
      'javascript_heap_size_mb': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `js_heap_size_${key.replace('(', '').replace(')', '')}_mb`
      },

      // 🌐 Test-App UI Performance
      'websocket_connection_time': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `websocket_connection_${key.replace('(', '').replace(')', '')}_ms`
      },
      'meeting_creation_time': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `meeting_creation_${key.replace('(', '').replace(')', '')}_ms`
      },
      'calendar_navigation_time': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `calendar_navigation_${key.replace('(', '').replace(')', '')}_ms`
      },
      'notification_processing_time': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `notification_processing_${key.replace('(', '').replace(')', '')}_ms`
      },
      'resource_load_time': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `resource_load_${key.replace('(', '').replace(')', '')}_ms`
      },
      'profile_load_time': {
        extract: ['avg', 'p(95)', 'min', 'max', 'p(90)', 'med'],
        transform: (name, key) => `profile_load_${key.replace('(', '').replace(')', '')}_ms`
      },


      // 🌐 Test-App HTTP Performance  
      'test_app_http_req_failed': {
        extract: ['rate'],
        transform: () => 'test_app_http_req_failed_rate'
      },

      // 🚀 Original Load Performance (backward compatibility)
      'page_load_time': {
        extract: ['avg', 'p(95)'],
        transform: (name, key) => key === 'p(95)' ? 'page_load_p95_ms' : 'page_load_avg_ms'
      },
      'navigation_time': {
        extract: ['avg'],
        transform: () => 'navigation_avg_ms'
      },
      'login_time': {
        extract: ['avg', 'p(95)'],
        transform: (name, key) => key === 'p(95)' ? 'login_p95_ms' : 'login_avg_ms',
        includeThresholds: true
      },

      // 🌐 Original HTTP Performance (backward compatibility)
      'browser_http_req_duration': {
        extract: ['avg', 'p(95)'],
        transform: (name, key) => key === 'p(95)' ? 'http_req_p95_ms' : 'http_req_avg_ms'
      },
      'browser_http_req_failed': {
        extract: ['rate'],
        transform: () => 'http_req_failed_rate'
      },

      // ✅ Success Rates (compatible with both formats)
      'successful_requests': {
        extract: ['rate'],
        transform: () => 'successful_requests_rate',
        includeThresholds: true
      },
      'errors': {
        extract: ['rate'],
        transform: () => 'error_rate',
        includeThresholds: true
      },
      'checks': {
        extract: ['rate'],
        transform: () => 'checks_rate'
      },

      // 📊 Context Metrics (for volume understanding)
      'iterations': {
        extract: ['count'],
        transform: () => 'total_iterations'
      },
      'requests': {
        extract: ['count'],
        transform: () => 'total_requests'
      }
    };
  }

  // Check if metrics are in simple Record<string, number> format
  private static isSimpleMetrics(metrics: any): boolean {
    return Object.values(metrics).every(value => typeof value === 'number');
  }

  // Extract simple metrics from complex structure
  private static extractSimpleMetrics(metrics: any): Record<string, number> {
    const simple: Record<string, number> = {};
    
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'number') {
        simple[key] = value;
      } else if (value && typeof value === 'object') {
        // Try to extract avg, mean, or value from nested objects
        const nested = value as any;
        if (typeof nested.avg === 'number') {
          simple[`${key}_avg`] = nested.avg;
        } else if (typeof nested.mean === 'number') {
          simple[`${key}_mean`] = nested.mean;
        } else if (typeof nested.value === 'number') {
          simple[`${key}_value`] = nested.value;
        } else if (typeof nested.rate === 'number') {
          simple[`${key}_rate`] = nested.rate;
        }
      }
    }
    
    return simple;
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
