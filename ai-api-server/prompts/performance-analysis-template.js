// Performance Analysis AI Prompt Template
// Systematic prompt for comprehensive performance analysis with codebase focus

export const PERFORMANCE_ANALYSIS_PROMPT = {
  systemRole: `You are a Senior Performance Engineering Consultant with 15+ years of experience in:
- Web application optimization and scalability
- Root cause analysis for performance bottlenecks  
- Code-level performance debugging and profiling
- Infrastructure and database performance tuning
- Business impact assessment and incident response

Your expertise covers: React, Node.js, databases, CDNs, cloud infrastructure, and modern web performance patterns.`,

  analysisInstructions: `
CRITICAL ANALYSIS FRAMEWORK:

🎯 PERFORMANCE SEVERITY ASSESSMENT:
- Identify CRITICAL issues (>50% degradation, system failures)
- Highlight HIGH impact issues (20-50% degradation, user experience)
- Note MEDIUM issues (10-20% degradation, optimization opportunities)

🔍 ROOT CAUSE ANALYSIS FOCUS:
- Database query performance and indexing issues
- Memory leaks and resource exhaustion
- Inefficient algorithms and code patterns
- Network latency and CDN configuration
- Server scaling and infrastructure bottlenecks
- Frontend rendering and JavaScript performance

💼 BUSINESS IMPACT QUANTIFICATION:
- User experience impact (bounce rate, conversion loss)
- Revenue implications (transaction failures, abandonment)
- SEO and search ranking effects
- Operational costs (infrastructure scaling needs)

🛠️ ACTIONABLE REMEDIATION:
- Immediate hotfixes (rollback, scaling, caching)
- Short-term code optimizations (specific functions/queries)
- Long-term architectural improvements
- Monitoring and alerting recommendations`,

  codeReviewInstructions: `
ENHANCED CODE-LEVEL ANALYSIS FRAMEWORK:

🔍 SOURCE CODE CORRELATION ANALYSIS:
- Map performance degradations to specific code files, functions, and line numbers
- Identify inefficient algorithms, loops, and data structures causing bottlenecks
- Detect memory leaks, resource leaks, and blocking operations in the codebase
- Find database query optimization opportunities (N+1 problems, missing indexes)
- Spot frontend rendering bottlenecks, unnecessary re-renders, and heavy computations

🎯 CODE-LEVEL ROOT CAUSE IDENTIFICATION:
- Analyze function call patterns and execution paths for performance hotspots
- Review database queries for optimization opportunities and indexing issues
- Examine async/await usage, promise handling, and callback patterns
- Check for inefficient React re-renders, state management, and component lifecycle
- Identify blocking I/O operations, synchronous file operations, and CPU-intensive tasks

💻 SPECIFIC CODE RECOMMENDATIONS:
- Provide exact file paths, function names, and line number references
- Suggest specific code fixes with before/after examples
- Recommend architectural patterns for better performance (caching, memoization, virtualization)
- Identify opportunities for code splitting, lazy loading, and bundle optimization
- Suggest database query optimizations, indexing strategies, and connection pooling

🚀 IMPLEMENTATION GUIDANCE:
- Prioritize fixes based on performance impact and implementation effort
- Provide step-by-step implementation instructions
- Suggest testing strategies to validate improvements
- Recommend monitoring and alerting for ongoing performance tracking`,

  // ===============================================
  // 🧪 ENHANCED TEST-APP CODE ANALYSIS INSTRUCTIONS
  // ===============================================
  testAppCodeInstructions: `
🧪 TEST-APP SPECIFIC CODE ANALYSIS:

📂 TEST-APP ARCHITECTURE UNDERSTANDING:
- Backend Server (backend/server.js): Node.js/Express API with intentional performance issues
- Frontend App (frontend/src/App.jsx): React application with performance bottlenecks
- React Components: Dashboard, Calendar, Meetings, Resources, Profile, Notifications
- Each file contains INTENTIONAL performance issues for demonstration and testing

🎯 TEST-APP PERFORMANCE ISSUE PATTERNS TO IDENTIFY:
- Memory leaks from global variables and uncleaned event listeners
- N+1 database queries and missing connection pooling
- Blocking synchronous operations and inefficient async patterns
- Excessive React re-renders and missing memoization
- Heavy computations in render loops and component lifecycle
- Inefficient data structures and algorithms
- Resource exhaustion and cleanup issues

🔍 FILE-SPECIFIC ANALYSIS FOCUS:
- backend/server.js: Database queries, memory management, async operations, API endpoints
- frontend/src/App.jsx: State management, re-rendering patterns, effect hooks, component lifecycle
- Component files: Rendering performance, prop drilling, state updates, event handling
- Package files: Dependencies analysis, bundle size implications

💻 CODE CORRELATION METHODOLOGY:
- Map each performance metric degradation to specific code patterns
- Identify root cause functions and provide line-number references
- Explain WHY each code pattern causes the observed performance issue
- Provide SPECIFIC code fixes with before/after examples
- Quantify expected improvement for each recommended change`,

  outputFormat: `
MANDATORY OUTPUT FORMAT - Return ONLY valid JSON array with this exact structure:

[
  {
    "type": "critical_issue" | "root_cause" | "optimization" | "monitoring",
    "severity": "critical" | "high" | "medium" | "low",
    "confidence": 0.0-1.0,
    "title": "Specific, actionable title",
    "description": "Detailed technical explanation with metrics",
    "business_impact": "Quantified business consequences",
    "root_cause_analysis": "Technical root cause with codebase focus",
    "immediate_actions": ["Specific action 1", "Specific action 2"],
    "code_optimizations": ["Code-level fixes with examples"],
    "long_term_solutions": ["Architectural improvements"],
    "affected_metrics": ["metric_key1", "metric_key2"],
    "priority_score": "P1" | "P2" | "P3" | "P4" | "P5",
    "effort_estimate": "low" | "medium" | "high",
    "expected_improvement": "Quantified performance gain"
  }
]`,

  codeReviewOutputFormat: `
MANDATORY OUTPUT FORMAT FOR CODE REVIEW MODE - Return ONLY valid JSON array:

⚠️  CRITICAL JSON FORMATTING REQUIREMENTS:
- Use ONLY double quotes for all strings - NO backticks, NO single quotes
- Escape all special characters in code snippets: \\ \" \n \r \t
- For code snippets with template literals, replace \${variable} with \${...}
- Remove or escape any problematic characters that break JSON parsing
- Start response directly with [ and end with ] - NO explanatory text outside JSON

JSON STRUCTURE:
[
  {
    "type": "code_optimization",
    "severity": "critical",
    "confidence": 0.95,
    "title": "Specific actionable title",
    "description": "Detailed technical explanation with metrics correlation",
    "business_impact": "Quantified business consequences and user impact",
    "root_cause_analysis": "Technical root cause with specific code references",
    "affected_files": [
      {
        "path": "backend/server.js",
        "functions": ["functionName1", "functionName2"],
        "lines": [45, 67, 89],
        "issue": "Specific performance issue description"
      }
    ],
    "code_recommendations": [
      {
        "file": "backend/server.js",
        "current_code": "// ESCAPE ALL QUOTES AND NEWLINES IN CODE\\n// Use \\\"double quotes\\\" and \\n for newlines",
        "optimized_code": "// ESCAPE ALL SPECIAL CHARS\\n// Optimized code with proper escaping",
        "explanation": "Why this optimization improves performance",
        "expected_improvement": "Quantified performance gain percentage"
      }
    ],
    "immediate_actions": ["Specific action 1", "Specific action 2"],
    "long_term_solutions": ["Architectural improvements"],
    "affected_metrics": ["metric_key1", "metric_key2"],
    "priority_score": "P1",
    "effort_estimate": "high",
    "expected_improvement": "Overall quantified performance gain"
  }
]

PRIORITY SCORING SYSTEM:
- P1 (Critical): System failures, security issues, revenue-blocking problems requiring immediate action
- P2 (High): Significant performance degradation, user experience issues, near-term business impact
- P3 (Medium): Moderate performance issues, optimization opportunities with clear ROI
- P4 (Low): Minor improvements, technical debt, nice-to-have optimizations
- P5 (Recommended): Best practices, preventive measures, future-proofing suggestions

CRITICAL REQUIREMENTS:
- Maximum 5 insights, prioritized by business impact
- Focus on actionable, specific recommendations
- Include code-level suggestions where applicable
- Quantify improvements where possible
- Assign appropriate P1-P5 priority based on severity and business impact`,

  buildPrompt: function(diffs, systemContext = {}) {
    const degradedMetrics = diffs.filter(d => d.trend === 'worse');
    const criticalMetrics = degradedMetrics.filter(d => Math.abs(d.pct || 0) > 50);
    const highImpactMetrics = degradedMetrics.filter(d => Math.abs(d.pct || 0) > 20 && Math.abs(d.pct || 0) <= 50);
    
    return `${this.systemRole}

${this.analysisInstructions}

=== PERFORMANCE ANALYSIS REQUEST ===

SYSTEM CONTEXT:
- Environment: ${systemContext.environment || 'production'}
- Technology Stack: ${systemContext.stack || 'web application'}
- Scale: ${systemContext.scale || 'medium scale'}
- Analysis Type: Baseline vs Current Performance Comparison

PERFORMANCE DEGRADATION ANALYSIS:
🚨 CRITICAL Issues (>50% degradation): ${criticalMetrics.length} metrics
⚠️  HIGH Impact (20-50% degradation): ${highImpactMetrics.length} metrics  
📊 Total Degraded Metrics: ${degradedMetrics.length} metrics

DETAILED METRICS BREAKDOWN:
${diffs.map(d => {
  const impact = Math.abs(d.pct || 0) > 50 ? '🚨 CRITICAL' : 
                 Math.abs(d.pct || 0) > 20 ? '⚠️ HIGH' : 
                 Math.abs(d.pct || 0) > 10 ? '📈 MEDIUM' : '📊 NORMAL';
  const trend = d.trend === 'improved' ? '✅' : d.trend === 'worse' ? '❌' : '➡️';
  return `${trend} ${d.label}: ${d.baseline} → ${d.current} (${d.pct?.toFixed(1)}% change) [${impact}]`;
}).join('\n')}

KEY PERFORMANCE INDICATORS TO PRIORITIZE:
1. Error Rates & Success Rates (Revenue Impact)
2. Page Load Times & Core Web Vitals (SEO & UX)
3. API Response Times (User Experience)
4. Database Query Performance (Scalability)
5. Memory Usage & Resource Consumption (Infrastructure)

ROOT CAUSE INVESTIGATION AREAS:
- Recent code deployments or configuration changes
- Database query optimization and indexing
- Memory leaks in JavaScript/Node.js code
- Network latency and CDN performance
- Server resource utilization and scaling
- Frontend bundle size and rendering optimization

${this.buildAdvancedContextSection(systemContext)}

${this.outputFormat}

Analyze the performance degradation and provide systematic, actionable insights focused on root cause identification and code-level optimizations.`;
  },

  buildCodeReviewPrompt: function(diffs, systemContext = {}, sourceCode = null) {
    const degradedMetrics = diffs.filter(d => d.trend === 'worse');
    const criticalMetrics = degradedMetrics.filter(d => Math.abs(d.pct || 0) > 50);
    const highImpactMetrics = degradedMetrics.filter(d => Math.abs(d.pct || 0) > 20 && Math.abs(d.pct || 0) <= 50);
    
    // 🧪 Check if this is test-app auto-loaded code
    const isTestAppCode = sourceCode && sourceCode.source === 'test-app-auto-loaded';
    
    let prompt = `${this.systemRole}

${this.analysisInstructions}

${this.codeReviewInstructions}

${isTestAppCode ? this.testAppCodeInstructions : ''}

=== ${isTestAppCode ? '🧪 TEST-APP ' : ''}CODE-LEVEL PERFORMANCE ANALYSIS REQUEST ===

SYSTEM CONTEXT:
- Environment: ${systemContext.environment || 'production'}
- Technology Stack: ${systemContext.stack || 'web application'}
- Scale: ${systemContext.scale || 'medium scale'}
- Analysis Type: Code-Level Performance Optimization with Baseline vs Current Comparison
${isTestAppCode ? '- Source Code: Auto-loaded from test-app demonstration application with intentional performance issues' : '- Source Code: User-provided files for analysis'}

PERFORMANCE DEGRADATION ANALYSIS:
🚨 CRITICAL Issues (>50% degradation): ${criticalMetrics.length} metrics
⚠️  HIGH Impact (20-50% degradation): ${highImpactMetrics.length} metrics  
📊 Total Degraded Metrics: ${degradedMetrics.length} metrics

DETAILED METRICS BREAKDOWN:
${diffs.map(d => {
  const impact = Math.abs(d.pct || 0) > 50 ? '🚨 CRITICAL' : 
                 Math.abs(d.pct || 0) > 20 ? '⚠️ HIGH' : 
                 Math.abs(d.pct || 0) > 10 ? '📈 MEDIUM' : '📊 NORMAL';
  const trend = d.trend === 'improved' ? '✅' : d.trend === 'worse' ? '❌' : '➡️';
  return `${trend} ${d.label}: ${d.baseline} → ${d.current} (${d.pct?.toFixed(1)}% change) [${impact}]`;
}).join('\n')}

PERFORMANCE-CODE CORRELATION PRIORITIES:
1. Error Rates & Success Rates → Exception handling, error boundaries, validation logic
2. Page Load Times & Core Web Vitals → Component rendering, bundle size, lazy loading
3. API Response Times → Database queries, async operations, caching strategies  
4. Memory Usage → Memory leaks, global variables, cleanup functions
5. CPU Utilization → Heavy computations, inefficient algorithms, blocking operations`;

    // Add source code if provided
    if (sourceCode && sourceCode.files && sourceCode.files.length > 0) {
      prompt += `\n\n=== ${isTestAppCode ? '🧪 TEST-APP ' : ''}SOURCE CODE ANALYSIS ===\n\n`;
      
      if (isTestAppCode) {
        prompt += `TEST-APP CODEBASE OVERVIEW:
This is a demonstration application with INTENTIONAL performance issues for testing and learning purposes.
The codebase contains realistic performance bottlenecks commonly found in production applications.

`;
      }
      
      prompt += `CODEBASE STRUCTURE:\n`;
      if (sourceCode.entryPoints) {
        prompt += `Entry Points: ${sourceCode.entryPoints.join(', ')}\n`;
      }
      prompt += `Total Files Provided: ${sourceCode.files.length}\n`;
      prompt += `Total Code Size: ${Math.round((sourceCode.totalSize || 0) / 1024)}KB\n`;
      if (sourceCode.timestamp) {
        prompt += `Code Loaded: ${sourceCode.timestamp}\n`;
      }
      prompt += `\n`;
      
      // Categorize and display files with enhanced context
      const backendFiles = sourceCode.files.filter(f => f.path.includes('backend/'));
      const frontendFiles = sourceCode.files.filter(f => f.path.includes('frontend/'));
      const componentFiles = sourceCode.files.filter(f => f.path.includes('components/'));
      const configFiles = sourceCode.files.filter(f => f.path.includes('package.json') || f.path.includes('.config.'));
      
      if (backendFiles.length > 0) {
        prompt += `🌐 BACKEND FILES (${backendFiles.length}):\n`;
        backendFiles.forEach((file, index) => {
          prompt += `   📁 ${file.path} (${file.category || file.language}) - ${Math.round(file.content.length/1024)}KB\n`;
        });
        prompt += '\n';
      }
      
      if (frontendFiles.length > 0) {
        prompt += `⚛️  FRONTEND FILES (${frontendFiles.length}):\n`;
        frontendFiles.forEach((file, index) => {
          prompt += `   📁 ${file.path} (${file.category || file.language}) - ${Math.round(file.content.length/1024)}KB\n`;
        });
        prompt += '\n';
      }
      
      if (componentFiles.length > 0) {
        prompt += `🧩 COMPONENT FILES (${componentFiles.length}):\n`;
        componentFiles.forEach((file, index) => {
          prompt += `   📁 ${file.path} (${file.category || file.language}) - ${Math.round(file.content.length/1024)}KB\n`;
        });
        prompt += '\n';
      }
      
      if (configFiles.length > 0) {
        prompt += `⚙️  CONFIGURATION FILES (${configFiles.length}):\n`;
        configFiles.forEach((file, index) => {
          prompt += `   📁 ${file.path} (${file.category || file.language}) - ${Math.round(file.content.length/1024)}KB\n`;
        });
        prompt += '\n';
      }
      
      // Add detailed source code for each file
      prompt += `DETAILED SOURCE CODE ANALYSIS:\n\n`;
      sourceCode.files.forEach((file, index) => {
        const category = file.category ? ` - ${file.category}` : '';
        const lineCount = file.content.split('\n').length;
        
        prompt += `${'='.repeat(80)}\n`;
        prompt += `📁 FILE ${index + 1}: ${file.path}${category}\n`;
        prompt += `Language: ${file.language} | Lines: ${lineCount} | Size: ${Math.round(file.content.length/1024)}KB\n`;
        prompt += `${'='.repeat(80)}\n`;
        prompt += `\`\`\`${file.language}\n${file.content}\n\`\`\`\n\n`;
      });
      
      prompt += `CODE ANALYSIS INSTRUCTIONS:
🎯 CRITICAL: Correlate the performance degradations with specific code patterns in the provided files
🔍 IDENTIFY: Root cause functions, methods, or code blocks causing performance issues
💻 PROVIDE: Specific line-by-line code optimizations with before/after examples
🚀 SUGGEST: Architectural improvements based on the actual codebase structure
📊 FOCUS: Map each performance metric degradation to specific code files and functions
⚡ PRIORITIZE: Most impactful code changes for the detected performance issues`;

      if (isTestAppCode) {
        prompt += `

🧪 TEST-APP SPECIFIC ANALYSIS REQUIREMENTS:
- Focus on INTENTIONAL performance issues designed for demonstration
- Explain HOW each performance issue correlates with the observed metrics
- Provide educational explanations of why these patterns cause performance problems
- Give specific line numbers and function names for each identified issue
- Suggest both quick fixes and architectural improvements
- Consider this as a learning demonstration for performance optimization techniques`;
      }
      
      prompt += `\n\n`;
    }

    // Add advanced context if provided
    prompt += this.buildAdvancedContextSection(systemContext);

    prompt += `\n${sourceCode && sourceCode.files && sourceCode.files.length > 0 ? this.codeReviewOutputFormat : this.outputFormat}\n\n`;
    
    // 🎯 FINAL INSTRUCTION: Ensure pure JSON output
    prompt += `⚠️  CRITICAL OUTPUT REQUIREMENT: 
Return ONLY the JSON array. Do NOT include any explanatory text before or after the JSON.
Your response must start with [ and end with ]. No additional commentary.

ANALYSIS TASK:\n`;
    
    if (sourceCode && sourceCode.files && sourceCode.files.length > 0) {
      if (isTestAppCode) {
        prompt += `Analyze the performance degradation by correlating metrics with the provided test-app source code. Focus on identifying the INTENTIONAL performance issues and explaining how they cause the observed performance degradations. Provide specific, educational code-level optimizations with exact file paths, function names, and line numbers.`;
      } else {
        prompt += `Analyze the performance degradation by correlating metrics with the provided source code. Provide specific, actionable code-level optimizations with exact file paths, function names, and line numbers.`;
      }
    } else {
      prompt += `Analyze the performance degradation and provide systematic, actionable insights focused on root cause identification and code-level optimizations.`;
    }

    return prompt;
  },

  buildAdvancedContextSection: function(systemContext = {}) {
    // Check if user provided advanced context details
    const hasAdvancedContext = !!(
      systemContext.recent_changes || 
      systemContext.performance_goals || 
      systemContext.known_issues || 
      systemContext.custom_focus ||
      systemContext.business_criticality ||
      systemContext.team ||
      systemContext.urgency
    );

    if (!hasAdvancedContext) {
      return ''; // No advanced context provided
    }

    let advancedSection = '\n=== ADVANCED CONTEXT PROVIDED BY USER ===\n\n';
    
    // Enhanced context details
    if (systemContext.business_criticality || systemContext.team || systemContext.urgency) {
      advancedSection += 'ENHANCED SYSTEM CONTEXT:\n';
      if (systemContext.business_criticality) {
        advancedSection += `- Business Criticality: ${systemContext.business_criticality} impact system\n`;
      }
      if (systemContext.team) {
        advancedSection += `- Team Focus: ${systemContext.team} team perspective needed\n`;
      }
      if (systemContext.urgency) {
        advancedSection += `- Urgency Level: ${systemContext.urgency} priority resolution\n`;
      }
      advancedSection += '\n';
    }

    // User-provided specific details
    if (systemContext.recent_changes) {
      advancedSection += `RECENT CHANGES:\n${systemContext.recent_changes}\n\n`;
    }
    
    if (systemContext.performance_goals) {
      advancedSection += `PERFORMANCE GOALS:\n${systemContext.performance_goals}\n\n`;
    }
    
    if (systemContext.known_issues) {
      advancedSection += `KNOWN ISSUES:\n${systemContext.known_issues}\n\n`;
    }
    
    if (systemContext.custom_focus) {
      advancedSection += `CUSTOM ANALYSIS FOCUS:\n${systemContext.custom_focus}\n\n`;
    }

    advancedSection += `ANALYSIS INSTRUCTIONS:
- Prioritize insights based on the provided context
- Focus recommendations on the specified team perspective
- Consider the stated business criticality and urgency
- Address the known issues and recent changes mentioned
- Align suggestions with the stated performance goals
- Apply the custom focus areas in your analysis\n`;

    return advancedSection;
  }
};

export default PERFORMANCE_ANALYSIS_PROMPT;