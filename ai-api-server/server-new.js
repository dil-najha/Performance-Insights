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

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const prompt = buildInsightsPrompt(diffs, systemContext);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a performance optimization expert. Analyze performance metrics and provide specific, actionable insights. 
          Respond with a JSON array of insights, each having: 
          - type: "anomaly" | "suggestion" | "prediction" | "root_cause"
          - severity: "low" | "medium" | "high" | "critical"
          - confidence: number between 0-1
          - title: string
          - description: string
          - actionable_steps: array of strings
          - affected_metrics: array of metric keys`
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
  
  return `
Performance Analysis Context:
- Environment: ${systemContext.environment || 'production'}
- Technology Stack: ${systemContext.stack || 'not specified'}
- Scale: ${systemContext.scale || 'medium'}

Metrics Analysis:
${diffs.map(d => `- ${d.label}: ${d.baseline} → ${d.current} (${d.pct?.toFixed(1)}% change, trend: ${d.trend})`).join('\n')}

Key Concerns:
${degradedMetrics.length > 0 ? 
  degradedMetrics.map(d => `- ${d.label} degraded by ${Math.abs(d.pct || 0).toFixed(1)}%`).join('\n') : 
  'No significant degradations detected'}

Please provide 3-5 specific insights focusing on the most critical performance issues and actionable optimization recommendations.
`;
}

async function generatePredictions(current, systemContext) {
  try {
    const prompt = `Based on current performance metrics, predict potential future issues:
    
Current Metrics: ${JSON.stringify(current.metrics, null, 2)}
System Context: ${JSON.stringify(systemContext, null, 2)}

Provide predictions as JSON array with type: "prediction", severity, confidence, title, description, actionable_steps, affected_metrics.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

async function generateExplanation(diffs, insights) {
  try {
    const prompt = `Provide a concise natural language explanation of the performance analysis:
    
Metrics Changes: ${diffs.filter(d => d.trend !== 'same').map(d => `${d.label}: ${d.trend} by ${Math.abs(d.pct || 0).toFixed(1)}%`).join(', ')}
Key Insights: ${insights.map(i => i.title).join(', ')}

Provide a 2-3 sentence summary explanation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
    const explanation = await generateExplanation(diffs, insights);
    
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
    console.log(`🤖 OpenAI Integration: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'DISABLED - Set OPENAI_API_KEY!'}`);
  });
}

startServer().catch(console.error);
