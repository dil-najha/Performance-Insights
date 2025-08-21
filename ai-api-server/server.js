// Production Backend API Server for AI Integration
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));

// API Authentication middleware
const authenticateAPI = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.API_SECRET_KEY;
  
  if (!expectedKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.substring(7);
  if (token !== expectedKey) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
  
  next();
};

// Initialize AI clients with OpenRouter preference
let aiClient = null;
let aiProvider = 'local';

try {
  const OpenAI = require('openai');
  
  // Prefer OpenRouter if available
  if (process.env.OPENROUTER_API_KEY) {
    aiClient = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5173',
        'X-Title': process.env.SITE_NAME || 'Performance Insights Dashboard'
      }
    });
    aiProvider = 'openrouter';
    console.log('✅ OpenRouter client initialized');
    console.log('🌟 Using OpenRouter for multi-model AI access');
  } 
  // Fallback to direct OpenAI
  else if (process.env.OPENAI_API_KEY) {
    aiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    aiProvider = 'openai';
    console.log('✅ OpenAI client initialized');
    console.log('🔄 Using direct OpenAI integration');
  } 
  else {
    console.log('⚠️  No AI API keys found - AI features will use fallback methods');
    console.log('💡 Set OPENROUTER_API_KEY (recommended) or OPENAI_API_KEY to enable AI features');
  }
} catch (error) {
  console.log('⚠️  AI client initialization failed - using fallback methods:', error.message);
}

// Model configuration based on provider and user selection
function getModelName(userSelectedModel) {
  // Free tier models available on OpenRouter
  const freeModels = [
    'deepseek/deepseek-chat-v3-0324:free',
    'deepseek/deepseek-r1-0528:free',
    'google/gemini-2.0-flash-exp:free',
    'google/gemma-3-27b-it:free',
    'google/gemma-3n-e2b-it:free',
    'openai/gpt-oss-20b:free',
    'deepseek/deepseek-r1-0528-qwen3-8b:free'
  ];

  const fallbackModels = [
    'deepseek/deepseek-chat-v3-0324:free', // Default to free model
    'google/gemini-2.0-flash-exp:free',
    'deepseek/deepseek-r1-0528:free',
    'google/gemma-3-27b-it:free'
  ];

  // Use user-selected model if provided and valid
  if (userSelectedModel && (freeModels.includes(userSelectedModel) || fallbackModels.includes(userSelectedModel))) {
    console.log('🎯 Using user-selected model:', userSelectedModel);
    return userSelectedModel;
  }

  // Provider-specific defaults
  if (aiProvider === 'openrouter') {
    const defaultModel = process.env.PRIMARY_MODEL || fallbackModels[0];
    console.log('🤖 Using default OpenRouter model:', defaultModel);
    return defaultModel;
  } else if (aiProvider === 'openai') {
    console.log('🤖 Using free model fallback: deepseek/deepseek-chat-v3-0324:free');
    return 'deepseek/deepseek-chat-v3-0324:free';
  }
  
  console.log('🤖 Using fallback model:', fallbackModels[0]);
  return fallbackModels[0]; // Default to free model
}

// Get fallback models for OpenRouter
function getFallbackModels() {
  if (aiProvider === 'openrouter') {
    return [
      'deepseek/deepseek-chat-v3-0324:free',
      'google/gemini-2.0-flash-exp:free',
      'deepseek/deepseek-r1-0528:free'
    ];
  }
  return ['deepseek/deepseek-chat-v3-0324:free'];
}

// Data storage for historical reports
const DATA_DIR = path.join(__dirname, 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'historical_reports.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create data directory:', error);
  }
}

// Helper Functions

function calculateMetricDiffs(baseline, current) {
  const diffs = [];
  const allKeys = new Set([...Object.keys(baseline.metrics), ...Object.keys(current.metrics)]);
  
  for (const key of allKeys) {
    const baselineValue = baseline.metrics[key] || null;
    const currentValue = current.metrics[key] || null;
    
    let change = null;
    let pct = null;
    let trend = 'unknown';
    
    if (baselineValue !== null && currentValue !== null) {
      change = currentValue - baselineValue;
      pct = baselineValue !== 0 ? (change / baselineValue) * 100 : 0;
      
      const betterWhen = getBetterWhenForKey(key);
      if (Math.abs(pct) < 5) {
        trend = 'same';
      } else if (betterWhen === 'lower') {
        trend = change < 0 ? 'improved' : 'worse';
      } else {
        trend = change > 0 ? 'improved' : 'worse';
      }
    }
    
    diffs.push({
      key,
      label: getLabelForKey(key),
      baseline: baselineValue,
      current: currentValue,
      change,
      pct,
      betterWhen: getBetterWhenForKey(key),
      trend
    });
  }
  
  return diffs;
}

function getBetterWhenForKey(key) {
  const lowerIsBetter = /(latency|response|time|p\d+|error|fail|cpu|mem(ory)?)/i;
  const higherIsBetter = /(throughput|rps|tps|success|pass)/i;
  
  if (higherIsBetter.test(key)) return 'higher';
  return 'lower';
}

function getLabelForKey(key) {
  const friendlyLabels = {
    responseTimeAvg: 'Avg Response Time (ms)',
    responseTimeP95: 'p95 Response Time (ms)',
    responseTimeP99: 'p99 Response Time (ms)',
    latencyAvg: 'Avg Latency (ms)',
    throughput: 'Throughput (req/s)',
    rps: 'Requests per Second',
    errorRate: 'Error Rate (%)',
    failures: 'Failures (%)',
    cpu: 'CPU (%)',
    memory: 'Memory (MB)',
  };
  
  return friendlyLabels[key] || key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
}

function calculateSummary(diffs) {
  const summary = { improved: 0, worse: 0, same: 0, unknown: 0 };
  diffs.forEach(diff => {
    summary[diff.trend]++;
  });
  return summary;
}

async function generateAIInsights(diffs, systemContext) {
  try {
    if (!aiClient) {
      console.log('🔄 Using fallback insights generation');
      return generateFallbackInsights(diffs);
    }

    const prompt = buildInsightsPrompt(diffs, systemContext);
    const selectedModel = systemContext?.selectedModel;
    
    const completion = await aiClient.chat.completions.create({
      model: getModelName(selectedModel),
      messages: [
        {
          role: "system",
          content: `You are a senior performance optimization expert with 10+ years of experience in web applications, microservices, and cloud infrastructure. 

          Focus on providing business-impact-driven insights that consider:
          - User experience implications
          - Cost optimization opportunities  
          - Technical debt identification
          - Scalability bottlenecks
          - Security performance impacts

          Prioritize actionable recommendations with clear ROI and implementation effort estimates.
          
          Respond with a JSON array of insights, each having: 
          - type: "anomaly" | "suggestion" | "prediction" | "root_cause"
          - severity: "low" | "medium" | "high" | "critical"
          - confidence: number between 0-1
          - title: string
          - description: string
          - actionable_steps: array of strings
          - affected_metrics: array of metric keys
          - business_impact: string (optional)
          - effort_estimate: "low" | "medium" | "high" (optional)`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    const content = completion.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('AI Insights generation error:', error);
    return generateFallbackInsights(diffs);
  }
}

function buildInsightsPrompt(diffs, systemContext = {}) {
  const degradedMetrics = diffs.filter(d => d.trend === 'worse');
  const improvedMetrics = diffs.filter(d => d.trend === 'improved');
  const criticalMetrics = degradedMetrics.filter(d => Math.abs(d.pct || 0) > 20);
  
  return `
===== PERFORMANCE ANALYSIS REQUEST =====

SYSTEM CONTEXT:
- Environment: ${systemContext.environment || 'production'} (${getEnvironmentDetails(systemContext.environment)})
- Technology Stack: ${systemContext.stack || 'not specified'}
- Scale: ${systemContext.scale || 'medium'} (${getScaleDetails(systemContext.scale)})
- Business Criticality: ${systemContext.business_criticality || 'medium'} impact
- Team Focus: ${systemContext.team || 'general'} team perspective
- Urgency Level: ${systemContext.urgency || 'medium'} priority
- Deployment ID: ${systemContext.deployment_id || 'unknown'}
- Analysis Time: ${new Date().toISOString()}

ADDITIONAL CONTEXT:
${systemContext.recent_changes ? `🔄 Recent Changes: ${systemContext.recent_changes}` : ''}
${systemContext.performance_goals ? `🎯 Performance Goals: ${systemContext.performance_goals}` : ''}
${systemContext.known_issues ? `⚠️ Known Issues: ${systemContext.known_issues}` : ''}
${systemContext.custom_focus ? `🔍 Custom Focus: ${systemContext.custom_focus}` : ''}

METRICS CHANGES SUMMARY:
📈 Improved: ${improvedMetrics.length} metrics
📉 Degraded: ${degradedMetrics.length} metrics  
🚨 Critical: ${criticalMetrics.length} metrics (>20% degradation)

DETAILED METRICS ANALYSIS:
${diffs.map(d => {
  const emoji = d.trend === 'improved' ? '✅' : d.trend === 'worse' ? '❌' : '➡️';
  const impact = Math.abs(d.pct || 0) > 20 ? '🚨 CRITICAL' : Math.abs(d.pct || 0) > 10 ? '⚠️ HIGH' : '📊 NORMAL';
  return `${emoji} ${d.label}: ${d.baseline} → ${d.current} (${d.pct?.toFixed(1)}% change) [${impact}]`;
}).join('\n')}

PRIORITY CONCERNS:
${criticalMetrics.length > 0 ? 
  criticalMetrics.map(d => `🚨 ${d.label}: ${Math.abs(d.pct || 0).toFixed(1)}% degradation - ${getMetricContext(d.key)}`).join('\n') : 
  degradedMetrics.length > 0 ?
  degradedMetrics.map(d => `⚠️ ${d.label}: ${Math.abs(d.pct || 0).toFixed(1)}% degradation`).join('\n') :
  '✅ No significant performance degradations detected'}

ANALYSIS REQUIREMENTS:
1. ${getBusinessFocus(systemContext.business_criticality)} - ${systemContext.business_criticality || 'medium'} business impact
2. ${getTeamFocus(systemContext.team)} perspective and recommendations
3. ${getUrgencyFocus(systemContext.urgency)} - ${systemContext.urgency || 'medium'} priority response
4. Root cause analysis for critical issues with ${systemContext.stack || 'general'} context
5. Implementation effort estimates (Low/Medium/High) for ${systemContext.environment || 'production'}
6. ${systemContext.performance_goals ? `Align with goals: ${systemContext.performance_goals}` : 'Focus on general performance optimization'}
7. ${systemContext.known_issues ? `Consider known issues: ${systemContext.known_issues}` : 'Identify potential unknown issues'}

Please provide 3-5 prioritized insights with clear action items.
`;
}

// Helper functions for enhanced context
function getEnvironmentDetails(env) {
  const details = {
    'prod': 'Live user traffic, high reliability required',
    'staging': 'Pre-production testing, mirrors production',
    'dev': 'Development environment, experimental changes'
  };
  return details[env] || 'unknown environment type';
}

function getScaleDetails(scale) {
  const details = {
    'small': '< 100 RPS, single server likely',
    'medium': '100-1K RPS, load balanced setup',
    'large': '> 1K RPS, distributed architecture'
  };
  return details[scale] || 'unknown scale';
}

function getMetricContext(metricKey) {
  const contexts = {
    'responseTimeAvg': 'affects user experience directly',
    'responseTimeP95': 'impacts 95% of users',
    'responseTimeP99': 'affects slowest users',
    'throughput': 'capacity and revenue impact',
    'errorRate': 'user experience and reliability',
    'cpu': 'cost and scalability concern',
    'memory': 'stability and performance risk'
  };
  return contexts[metricKey] || 'performance impact';
}

function getBusinessFocus(criticality) {
  const focuses = {
    'low': 'Cost optimization and efficiency',
    'medium': 'Balance performance and resource usage',
    'high': 'User experience and reliability priority',
    'critical': 'Mission-critical system stability and immediate fixes'
  };
  return focuses[criticality] || 'Balanced performance optimization';
}

function getTeamFocus(team) {
  const focuses = {
    'frontend': 'UI performance, rendering, and user experience',
    'backend': 'API performance, database optimization, and scalability',
    'devops': 'Infrastructure, deployment, and system-level optimization',
    'fullstack': 'End-to-end performance across frontend and backend'
  };
  return focuses[team] || 'General development team';
}

function getUrgencyFocus(urgency) {
  const focuses = {
    'low': 'Comprehensive analysis with long-term improvements',
    'medium': 'Balanced approach with actionable recommendations',
    'high': 'Quick wins and immediate impact solutions',
    'emergency': 'Critical issue resolution and hotfixes'
  };
  return focuses[urgency] || 'Standard analysis approach';
}

async function generatePredictions(current, systemContext) {
  try {
    if (!aiClient) {
      console.log('🔄 Using fallback predictions');
      return [];
    }

    const prompt = `Based on current performance metrics, predict potential future issues:
    
Current Metrics: ${JSON.stringify(current.metrics, null, 2)}
System Context: ${JSON.stringify(systemContext, null, 2)}

Provide predictions as JSON array with type: "prediction", severity, confidence, title, description, actionable_steps, affected_metrics.`;

    const selectedModel = systemContext?.selectedModel;
    const completion = await aiClient.chat.completions.create({
      model: getModelName(selectedModel),
      messages: [
        {
          role: "system",
          content: "You are a performance prediction expert. Analyze current metrics and predict potential future performance issues."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Predictions generation error:', error);
    return [];
  }
}

async function generateExplanation(diffs, insights, systemContext) {
  try {
    if (!aiClient) {
      console.log('🔄 Using fallback explanation');
      return 'Performance analysis completed. Review the detailed insights above for specific recommendations.';
    }

    const prompt = `Provide a concise natural language explanation of the performance analysis:
    
Metrics Changes: ${diffs.filter(d => d.trend !== 'same').map(d => `${d.label}: ${d.trend} by ${Math.abs(d.pct || 0).toFixed(1)}%`).join(', ')}
Key Insights: ${insights.map(i => i.title).join(', ')}

Provide a 2-3 sentence summary explanation.`;

    const selectedModel = systemContext?.selectedModel;
    const completion = await aiClient.chat.completions.create({
      model: getModelName(selectedModel),
      messages: [
        {
          role: "system",
          content: "You are a performance analyst. Provide clear, concise explanations of performance analysis results."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Explanation generation error:', error);
    return 'Performance analysis completed. Review the detailed insights above for specific recommendations.';
  }
}

function generateFallbackInsights(diffs) {
  const insights = [];
  
  diffs.forEach(diff => {
    if (diff.trend === 'worse' && Math.abs(diff.pct || 0) > 20) {
      insights.push({
        type: 'anomaly',
        severity: Math.abs(diff.pct || 0) > 50 ? 'high' : 'medium',
        confidence: 0.8,
        title: `Significant degradation in ${diff.label}`,
        description: `${diff.label} has degraded by ${Math.abs(diff.pct || 0).toFixed(1)}%, which exceeds normal variation.`,
        actionable_steps: [
          'Review recent deployments or configuration changes',
          'Check system resource utilization',
          'Analyze error logs for this time period'
        ],
        affected_metrics: [diff.key]
      });
    }
  });
  
  return insights;
}

async function storeHistoricalData(baseline, current, insights) {
  try {
    await ensureDataDir();
    
    let history = [];
    try {
      const data = await fs.readFile(REPORTS_FILE, 'utf8');
      history = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start with empty array
    }
    
    const record = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      baseline,
      current,
      insights,
      summary: calculateSummary(calculateMetricDiffs(baseline, current))
    };
    
    history.unshift(record);
    
    // Keep only last 1000 records
    if (history.length > 1000) {
      history = history.slice(0, 1000);
    }
    
    await fs.writeFile(REPORTS_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Failed to store historical data:', error);
  }
}

async function getHistoricalReports(limit = 50, offset = 0) {
  try {
    await ensureDataDir();
    const data = await fs.readFile(REPORTS_FILE, 'utf8');
    const history = JSON.parse(data);
    
    return {
      reports: history.slice(offset, offset + limit),
      total: history.length,
      limit,
      offset
    };
  } catch (error) {
    return { reports: [], total: 0, limit, offset };
  }
}

async function exportReport(data, format) {
  if (format === 'csv') {
    return generateCSV(data);
  } else if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }
  throw new Error('Unsupported export format');
}

function generateCSV(data) {
  if (!data.diffs) return '';
  
  const headers = ['Metric', 'Baseline', 'Current', 'Change', 'Percentage Change', 'Trend'];
  const rows = data.diffs.map(diff => [
    diff.label,
    diff.baseline || 'N/A',
    diff.current || 'N/A',
    diff.change || 'N/A',
    diff.pct ? `${diff.pct.toFixed(2)}%` : 'N/A',
    diff.trend
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// API Endpoints

// 1. Complete AI Analysis (main endpoint)
app.post('/api/ai/analyze', authenticateAPI, async (req, res) => {
  try {
    const { baseline, current, systemContext } = req.body;
    
    // Validate input
    if (!baseline || !current || !baseline.metrics || !current.metrics) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Calculate basic diffs
    const diffs = calculateMetricDiffs(baseline, current);
    
    // Generate AI insights
    const insights = await generateAIInsights(diffs, systemContext);
    
    // Generate predictions
    const predictions = await generatePredictions(current, systemContext);
    
    // Generate explanation
    const explanation = await generateExplanation(diffs, insights, systemContext);
    
    // Store for historical analysis
    await storeHistoricalData(baseline, current, insights);
    
    res.json({
      diffs,
      summary: calculateSummary(diffs),
      aiInsights: insights,
      predictions,
      explanation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI Analysis error:', error);
    res.status(500).json({ error: 'AI analysis failed', details: error.message });
  }
});

// 2. Historical Data endpoint
app.get('/api/reports/history', authenticateAPI, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const history = await getHistoricalReports(parseInt(limit), parseInt(offset));
    res.json(history);
  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

// 3. Export reports
app.post('/api/reports/export', authenticateAPI, async (req, res) => {
  try {
    const { format, data } = req.body;
    const exportData = await exportReport(data, format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=performance-report.csv');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=performance-report.json');
    }
    
    res.send(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// 4. Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
async function startServer() {
  await ensureDataDir();
  
  app.listen(PORT, () => {
    console.log(`🚀 AI Performance Insights API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔑 API Authentication: ${process.env.API_SECRET_KEY ? 'Enabled' : 'DISABLED - Set API_SECRET_KEY!'}`);
    console.log(`🤖 OpenRouter Integration: ${process.env.OPENROUTER_API_KEY ? 'Enabled (Free Models)' : 'DISABLED - Set OPENROUTER_API_KEY!'}`);
  });
}

startServer().catch(console.error);
