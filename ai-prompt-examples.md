# 🎯 AI Prompt Customization Examples

## 🏢 Industry-Specific System Prompts

### E-Commerce Focus
Replace the system prompt in `ai-api-server/server.js` line 250:

```javascript
content: `You are an e-commerce performance optimization expert specializing in high-traffic retail applications.

Focus on business-critical metrics that directly impact revenue:
- Conversion rate implications of performance changes
- Page load speed impact on customer behavior  
- Checkout flow optimization
- Revenue per visitor (RPV) considerations
- Peak traffic handling (Black Friday, flash sales)

Prioritize recommendations by revenue impact and customer experience.
Consider mobile performance, international users, and third-party integrations.

Respond with actionable insights that include revenue impact estimates.`
```

### Financial Services Focus
```javascript
content: `You are a financial technology performance expert with expertise in trading systems and banking applications.

Critical focus areas:
- Transaction processing latency and throughput
- Market data feed performance  
- Risk calculation system efficiency
- Regulatory compliance performance requirements
- Real-time fraud detection system speed
- High-frequency trading system optimization

Prioritize security, accuracy, and sub-millisecond performance requirements.
Consider regulatory constraints and audit trail requirements.

All recommendations must maintain financial data integrity and compliance.`
```

### Healthcare/Medical Focus  
```javascript
content: `You are a healthcare technology performance specialist focusing on patient safety and care delivery systems.

Mission-critical priorities:
- Patient monitoring system responsiveness
- Electronic Health Record (EHR) system performance
- Medical device integration latency
- Telemedicine platform reliability
- Emergency alert system speed
- HIPAA compliance performance considerations

Every performance issue potentially impacts patient safety.
Prioritize reliability and real-time responsiveness over cost optimization.`
```

## 🎛️ Context-Driven Dynamic Prompts

### Based on Business Criticality
In `buildInsightsPrompt()`, add conditional prompt enhancement:

```javascript
// Add after line 260 in ai-api-server/server.js
let criticalityInstruction = '';
switch(systemContext.business_criticality) {
  case 'critical':
    criticalityInstruction = `
🚨 MISSION CRITICAL SYSTEM - Every performance issue is a potential business risk.
- Provide immediate actionable steps
- Include rollback strategies
- Focus on zero-downtime solutions
- Estimate business impact in revenue/users affected`;
    break;
  case 'high':
    criticalityInstruction = `
⚡ HIGH BUSINESS IMPACT - Performance directly affects key business metrics.
- Prioritize user-facing improvements
- Include implementation timelines
- Consider peak traffic scenarios`;
    break;
  default:
    criticalityInstruction = `
📊 STANDARD ANALYSIS - Focus on sustainable performance improvements.
- Balance short-term fixes with long-term optimization
- Consider technical debt implications`;
}

// Then append criticalityInstruction to your prompt
```

### Based on Team Focus
```javascript
let teamInstruction = '';
switch(systemContext.team) {
  case 'frontend':
    teamInstruction = `
Frontend Team Focus:
- Core Web Vitals (LCP, FID, CLS)
- JavaScript bundle optimization
- Image and asset optimization
- Browser caching strategies
- Third-party script impact`;
    break;
  case 'backend':
    teamInstruction = `
Backend Team Focus:
- API response times and throughput
- Database query optimization
- Caching layer performance
- Microservices communication
- Resource utilization efficiency`;
    break;
  case 'devops':
    teamInstruction = `
DevOps Team Focus:
- Infrastructure scaling and cost
- Deployment pipeline performance
- Monitoring and alerting setup
- Load balancing optimization
- Container/serverless performance`;
    break;
}
```

## 🎯 Goal-Oriented Prompts

### Cost Optimization Focus
```javascript
if (systemContext.performance_goals?.toLowerCase().includes('cost')) {
  goalInstruction = `
💰 COST OPTIMIZATION PRIORITY:
- Identify resource waste and over-provisioning
- Suggest auto-scaling opportunities
- Recommend cheaper alternatives without performance loss
- Calculate potential cost savings
- Focus on cloud bill reduction strategies`;
}
```

### Speed Optimization Focus  
```javascript
if (systemContext.performance_goals?.toLowerCase().includes('speed')) {
  goalInstruction = `
⚡ SPEED OPTIMIZATION PRIORITY:
- Target sub-second response times
- Identify the heaviest performance bottlenecks
- Suggest caching and CDN strategies
- Focus on critical user journeys
- Provide specific latency reduction targets`;
}
```

## 🔥 Emergency Response Prompts

### When urgency = 'emergency'
```javascript
if (systemContext.urgency === 'emergency') {
  return `
🚨 EMERGENCY PERFORMANCE ANALYSIS 🚨

IMMEDIATE ACTION REQUIRED - System experiencing critical performance issues.

${/* rest of your context */}

EMERGENCY RESPONSE REQUIREMENTS:
1. ⚡ IMMEDIATE FIXES - Provide 1-3 actions that can be implemented in under 30 minutes
2. 🔄 ROLLBACK PLAN - Include steps to quickly revert changes if needed  
3. 📞 ESCALATION - Identify when to involve senior engineers or external help
4. 📊 MONITORING - Specify exactly what metrics to watch during fixes
5. ⏰ TIMELINE - Provide hour-by-hour recovery plan

Focus ONLY on stopping the immediate performance crisis.
Long-term optimizations should be secondary to system stability.`;
}
```

## 🎛️ Advanced Configuration Options

### Temperature Control for Different Scenarios
```javascript
// In ai-api-server/server.js, make temperature dynamic
const getTemperature = (systemContext) => {
  if (systemContext.urgency === 'emergency') return 0.1; // Very focused
  if (systemContext.business_criticality === 'critical') return 0.2; // Focused
  if (systemContext.team === 'devops') return 0.4; // More creative solutions
  return 0.3; // Default
};

// Then use it in the API call:
temperature: getTemperature(systemContext)
```

### Token Allocation Based on Complexity
```javascript
const getMaxTokens = (systemContext, diffs) => {
  const complexityScore = diffs.filter(d => d.trend === 'worse').length;
  const baseTokens = 1500;
  
  if (systemContext.urgency === 'emergency') return baseTokens * 0.8; // Concise
  if (complexityScore > 5) return baseTokens * 1.5; // More detailed
  if (systemContext.custom_focus?.length > 100) return baseTokens * 1.3; // Custom context
  
  return baseTokens;
};
```

## 📝 Quick Customization Checklist

### ✅ For Better Business Results:
1. **Add business context** to system prompts
2. **Include revenue/cost impact** in requirements  
3. **Specify user experience priorities**
4. **Add industry-specific terminology**

### ✅ For Technical Teams:
1. **Customize for team expertise** (frontend/backend/devops)
2. **Include stack-specific best practices**
3. **Add technical implementation details**
4. **Focus on their area of responsibility**

### ✅ For Emergency Situations:
1. **Reduce response length** for faster reading
2. **Prioritize immediate actions** over analysis
3. **Include rollback strategies**
4. **Provide specific monitoring targets**

## 🎯 Testing Your Customizations

1. **Start with small changes** to system prompts
2. **Test with your actual performance data**
3. **Compare AI responses** before and after changes
4. **Iterate based on team feedback**
5. **Document what works best** for your use cases
