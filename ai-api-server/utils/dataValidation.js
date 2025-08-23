// Backend Data Validation for Performance Reports
// Robust validation to match frontend capabilities

export class BackendDataValidator {
  /**
   * Validate a performance report structure
   */
  static validatePerformanceReport(data, reportName = 'Unknown') {
    const errors = [];
    const warnings = [];

    // Basic structure validation
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {
        valid: false,
        errors: ['Invalid data: must be a JSON object'],
        warnings: [],
        sanitized: null
      };
    }

    // Check for metrics property
    if (!data.metrics) {
      errors.push('Missing "metrics" property in report structure');
      return { valid: false, errors, warnings, sanitized: null };
    }

    if (typeof data.metrics !== 'object' || Array.isArray(data.metrics)) {
      errors.push('Invalid "metrics" property: must be an object');
      return { valid: false, errors, warnings, sanitized: null };
    }

    // Validate and sanitize metrics
    const validatedMetrics = this.validateMetrics(data.metrics);
    errors.push(...validatedMetrics.errors);
    warnings.push(...validatedMetrics.warnings);

    // Check if we have any valid metrics
    if (Object.keys(validatedMetrics.sanitized).length === 0) {
      errors.push('No valid numeric metrics found');
    }

    // Validate name if present
    let sanitizedName = reportName;
    if (data.name) {
      if (typeof data.name === 'string' && data.name.trim().length > 0) {
        sanitizedName = data.name.trim();
      } else {
        warnings.push('Invalid name format, using fallback');
      }
    }

    // Validate timestamp if present
    let sanitizedTimestamp = new Date().toISOString();
    if (data.timestamp) {
      const timestampValidation = this.validateTimestamp(data.timestamp);
      if (timestampValidation.valid) {
        sanitizedTimestamp = timestampValidation.sanitized;
      } else {
        warnings.push(`Invalid timestamp format: ${data.timestamp}`);
      }
    }

    const sanitized = {
      name: sanitizedName,
      timestamp: sanitizedTimestamp,
      metrics: validatedMetrics.sanitized
    };

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitized
    };
  }

  /**
   * Validate metrics object and convert to numbers
   */
  static validateMetrics(metrics) {
    const errors = [];
    const warnings = [];
    const sanitized = {};

    if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
      return {
        errors: ['Metrics must be an object'],
        warnings: [],
        sanitized: {}
      };
    }

    for (const [key, value] of Object.entries(metrics)) {
      // Validate key
      if (typeof key !== 'string' || key.trim().length === 0) {
        warnings.push(`Skipping invalid metric key: ${key}`);
        continue;
      }

      // Validate and convert value
      const numericValue = this.convertToNumber(value);
      
      if (numericValue.valid) {
        sanitized[key.trim()] = numericValue.value;
        if (numericValue.warning) {
          warnings.push(`${key}: ${numericValue.warning}`);
        }
      } else {
        warnings.push(`Skipping invalid metric "${key}": ${numericValue.error}`);
      }
    }

    return { errors, warnings, sanitized };
  }

  /**
   * Convert various types to numbers safely
   */
  static convertToNumber(value) {
    // Handle null/undefined
    if (value == null) {
      return { valid: false, error: 'null or undefined value' };
    }

    // Already a number
    if (typeof value === 'number') {
      if (Number.isNaN(value)) {
        return { valid: false, error: 'NaN value' };
      }
      if (!Number.isFinite(value)) {
        return { valid: false, error: 'infinite value' };
      }
      return { valid: true, value };
    }

    // String conversion
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        return { valid: false, error: 'empty string' };
      }
      
      const num = Number(trimmed);
      if (Number.isNaN(num)) {
        return { valid: false, error: 'cannot convert string to number' };
      }
      if (!Number.isFinite(num)) {
        return { valid: false, error: 'string converts to infinite value' };
      }
      
      return { 
        valid: true, 
        value: num, 
        warning: 'converted string to number' 
      };
    }

    // Boolean conversion (sometimes useful for rates)
    if (typeof value === 'boolean') {
      return { 
        valid: true, 
        value: value ? 1 : 0, 
        warning: 'converted boolean to number' 
      };
    }

    // Reject objects, arrays, functions, etc.
    return { 
      valid: false, 
      error: `unsupported type: ${typeof value}` 
    };
  }

  /**
   * Validate timestamp format
   */
  static validateTimestamp(timestamp) {
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return { valid: true, sanitized: date.toISOString() };
      }
    }
    
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return { valid: true, sanitized: date.toISOString() };
      }
    }

    return { valid: false };
  }

  /**
   * Validate source code structure for code review mode
   */
  static validateSourceCode(sourceCode) {
    const errors = [];
    const warnings = [];

    if (!sourceCode || typeof sourceCode !== 'object') {
      return {
        valid: false,
        errors: ['Source code must be a valid object'],
        warnings: []
      };
    }

    // Validate files array
    if (!sourceCode.files || !Array.isArray(sourceCode.files)) {
      return {
        valid: false,
        errors: ['Source code must contain a valid "files" array'],
        warnings: []
      };
    }

    if (sourceCode.files.length === 0) {
      return {
        valid: false,
        errors: ['Source code files array cannot be empty'],
        warnings: []
      };
    }

    // Validate each file
    const validatedFiles = [];
    for (let i = 0; i < sourceCode.files.length; i++) {
      const file = sourceCode.files[i];
      
      if (!file || typeof file !== 'object') {
        warnings.push(`File ${i + 1}: Invalid file object, skipping`);
        continue;
      }

      if (!file.path || typeof file.path !== 'string' || file.path.trim().length === 0) {
        warnings.push(`File ${i + 1}: Missing or invalid file path, skipping`);
        continue;
      }

      if (!file.content || typeof file.content !== 'string') {
        warnings.push(`File ${i + 1}: Missing or invalid file content, skipping`);
        continue;
      }

      if (!file.language || typeof file.language !== 'string') {
        warnings.push(`File ${i + 1}: Missing language, defaulting to 'text'`);
        file.language = 'text';
      }

      // Validate file size (limit to reasonable size for AI analysis)
      const fileSize = file.content.length;
      if (fileSize > 100000) { // 100KB limit per file
        warnings.push(`File ${i + 1}: Large file (${Math.round(fileSize/1024)}KB), may impact AI analysis performance`);
      }

      if (fileSize > 500000) { // 500KB hard limit
        warnings.push(`File ${i + 1}: File too large (${Math.round(fileSize/1024)}KB), skipping`);
        continue;
      }

      validatedFiles.push({
        path: file.path.trim(),
        content: file.content,
        language: file.language.toLowerCase().trim()
      });
    }

    if (validatedFiles.length === 0) {
      return {
        valid: false,
        errors: ['No valid source code files found after validation'],
        warnings
      };
    }

    // Validate entryPoints (optional)
    let entryPoints = [];
    if (sourceCode.entryPoints) {
      if (Array.isArray(sourceCode.entryPoints)) {
        entryPoints = sourceCode.entryPoints
          .filter(ep => typeof ep === 'string' && ep.trim().length > 0)
          .map(ep => ep.trim());
      } else {
        warnings.push('Invalid entryPoints format, ignoring');
      }
    }

    // Calculate total source code size
    const totalSize = validatedFiles.reduce((sum, file) => sum + file.content.length, 0);
    if (totalSize > 1000000) { // 1MB total limit
      warnings.push(`Large codebase (${Math.round(totalSize/1024)}KB), AI analysis may take longer`);
    }

    return {
      valid: true,
      errors: [],
      warnings,
      sanitized: {
        files: validatedFiles,
        entryPoints: entryPoints.length > 0 ? entryPoints : undefined,
        totalFiles: validatedFiles.length,
        totalSize: totalSize
      }
    };
  }

  /**
   * Validate request body for AI analysis endpoint
   */
  static validateAnalysisRequest(body) {
    const errors = [];
    const warnings = [];

    if (!body || typeof body !== 'object') {
      return {
        valid: false,
        errors: ['Request body must be a JSON object'],
        warnings: []
      };
    }

    // Validate baseline
    if (!body.baseline) {
      errors.push('Missing "baseline" report');
    } else {
      const baselineValidation = this.validatePerformanceReport(body.baseline, 'baseline');
      if (!baselineValidation.valid) {
        errors.push(`Baseline validation failed: ${baselineValidation.errors.join(', ')}`);
      } else {
        warnings.push(...baselineValidation.warnings.map(w => `Baseline: ${w}`));
        body.baseline = baselineValidation.sanitized;
      }
    }

    // Validate current
    if (!body.current) {
      errors.push('Missing "current" report');
    } else {
      const currentValidation = this.validatePerformanceReport(body.current, 'current');
      if (!currentValidation.valid) {
        errors.push(`Current validation failed: ${currentValidation.errors.join(', ')}`);
      } else {
        warnings.push(...currentValidation.warnings.map(w => `Current: ${w}`));
        body.current = currentValidation.sanitized;
      }
    }

    // Validate systemContext (optional)
    if (body.systemContext && typeof body.systemContext !== 'object') {
      warnings.push('Invalid systemContext format, ignoring');
      body.systemContext = {};
    }

    // Validate sourceCode (optional, for code review mode)
    if (body.sourceCode) {
      const sourceCodeValidation = this.validateSourceCode(body.sourceCode);
      if (!sourceCodeValidation.valid) {
        warnings.push(`Source code validation: ${sourceCodeValidation.errors.join(', ')}`);
        body.sourceCode = null; // Remove invalid source code
      } else {
        warnings.push(...sourceCodeValidation.warnings.map(w => `Source code: ${w}`));
        body.sourceCode = sourceCodeValidation.sanitized;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitized: body
    };
  }
}

export default BackendDataValidator;
