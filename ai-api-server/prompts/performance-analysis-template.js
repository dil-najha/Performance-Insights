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
