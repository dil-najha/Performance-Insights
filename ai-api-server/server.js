// Amazon Bedrock Performance Insights API Server
// Following AmazonBedrockAI.md pattern exactly

import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// AWS Bedrock imports
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { fromEnv } from '@aws-sdk/credential-providers';

// Performance analysis prompt template
import { PERFORMANCE_ANALYSIS_PROMPT } from './prompts/performance-analysis-template.js';

// Backend data validation
import { BackendDataValidator } from './utils/dataValidation.js';

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

// Test Bedrock availability (optional - following sample pattern)
async function testBedrockConnection() {
  try {
    console.log('🔍 Testing Bedrock connection...');
    
    // Use the exact sample pattern for testing
    const result = await invokeModel('Hello', 'anthropic.claude-3-5-haiku-20241022-v1:0');
    
    console.log('✅ AWS Bedrock connection successful');
    console.log(`📍 Region: ${process.env.AWS_REGION || 'us-west-2'}`);
    return true;
  } catch (error) {
    console.error('❌ Bedrock connection failed:', error.message);
    return false;
  }
}

// Available Bedrock models
const BEDROCK_MODELS = {
  'anthropic.claude-3-5-haiku-20241022-v1:0': {
    name: 'Claude 3.5 Haiku',
    description: 'Latest fast and cost-effective model with enhanced capabilities',
    maxTokens: 200000,
    cost: 'low',
    speed: 'very-fast'
  },
  'anthropic.claude-3-haiku-20240307-v1:0': {
    name: 'Claude 3 Haiku',
    description: 'Fast and cost-effective for analysis',
    maxTokens: 200000,
    cost: 'low',
    speed: 'fast'
  },
  'anthropic.claude-sonnet-4-20250514-v1:0': {
    name: 'Claude 3.5 Sonnet',
    description: 'Latest high-performance model (requires inference profile)',
    maxTokens: 200000,
    cost: 'medium',
    speed: 'fast'
  },
  'anthropic.claude-3-sonnet-20240229-v1:0': {
    name: 'Claude 3 Sonnet',
    description: 'Balanced performance and capability',
    maxTokens: 200000,
    cost: 'medium',
    speed: 'medium'
  },
  'anthropic.claude-3-opus-20240229-v1:0': {
    name: 'Claude 3 Opus',
    description: 'Highest capability for complex analysis',
    maxTokens: 200000,
    cost: 'high',
    speed: 'slow'
  }
};

/**
 * AWS Bedrock Client for AI model invocation
 * Following the exact pattern from AmazonBedrockAI.md sample
 * 
 * @param {string} prompt - The input text prompt for the model to complete.
 * @param {string} [modelId] - The ID of the model to use. Defaults to "anthropic.claude-3-5-haiku-20241022-v1:0".
 */
const invokeModel = async (prompt, modelId = 'anthropic.claude-3-5-haiku-20241022-v1:0') => {
  try {
    // Create a new Bedrock Runtime client instance (exactly like sample)
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-west-2',
      credentials: fromEnv(),
    });

    // Prepare the payload for the model
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 200000, // Maximum allowed for Claude models
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
    };

    // Invoke Claude with the payload and wait for the response
    const command = new InvokeModelCommand({
      contentType: 'application/json',
      body: JSON.stringify(payload),
      modelId,
    });

    // Add timeout wrapper to prevent hanging
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Bedrock API timeout after 5 minutes')), 5 * 60 * 1000)
    );

    const apiResponse = await Promise.race([
      client.send(command),
      timeout
    ]);

    // Decode and return the response(s)
    const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
    const responseBody = JSON.parse(decodedResponseBody);
    
    return responseBody.content.map((item) => item.text).join('\n');
    
  } catch (error) {
    if (error.name === 'UnrecognizedClientException') {
      throw new Error(`AWS Authentication Error: ${error.message}`);
    }

    if (error.name === 'AccessDeniedException') {
      throw new Error(`AWS Bedrock Access Error: ${error.message}`);
    }

    throw error;
  }
};

// Data storage for historical reports
const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

// Helper functions for performance analysis
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

// Build comprehensive AI analysis prompt
function buildAnalysisPrompt(diffs, systemContext = {}) {
  // Check if advanced context is provided
  const hasAdvancedContext = !!(
    systemContext.recent_changes || 
    systemContext.performance_goals || 
    systemContext.known_issues || 
    systemContext.custom_focus ||
    systemContext.business_criticality ||
    systemContext.team ||
    systemContext.urgency
  );

  // Always use systematic prompt, but log different messages based on context
  if (hasAdvancedContext) {
    console.log('🎯🔧 Using systematic prompt with advanced user context');
  } else {
    console.log('🎯 Using systematic performance analysis prompt (basic context)');
  }

  // Always use the systematic prompt template
  return PERFORMANCE_ANALYSIS_PROMPT.buildPrompt(diffs, systemContext);
}

// Generate AI insights using Bedrock
async function generateAIInsights(diffs, systemContext) {
  try {
    const prompt = buildAnalysisPrompt(diffs, systemContext);
    const modelId = systemContext?.selectedModel || 'anthropic.claude-3-5-haiku-20241022-v1:0';
    
    console.log(`🧠 Analyzing performance with Bedrock model: ${modelId}`);
    
    // Use the exact invokeModel pattern from AmazonBedrockAI.md
    const result = await invokeModel(prompt, modelId);
    
    // Try to parse as JSON
    try {
      return JSON.parse(result);
    } catch {
      // If not valid JSON, create structured response
      return [{
        type: 'suggestion',
        severity: 'medium',
        confidence: 0.8,
        title: 'Performance Analysis Completed',
        description: result.substring(0, 500) + '...',
        actionable_steps: ['Review the full analysis results'],
        affected_metrics: [],
        business_impact: 'Performance analysis insights provided'
      }];
    }
    
  } catch (error) {
    console.error('❌ Bedrock analysis failed:', error);
    return generateFallbackInsights(diffs);
  }
}

// Fallback insights when Bedrock is unavailable
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

// Historical data storage
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

// Export functionality
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

// =============================================================================
// API ENDPOINTS
// =============================================================================

// 1. Performance Analysis with Bedrock AI
app.post('/api/ai/analyze', authenticateAPI, async (req, res) => {
  try {
    // 🔧 ROBUST VALIDATION - Validate entire request structure
    const validation = BackendDataValidator.validateAnalysisRequest(req.body);
    
    if (!validation.valid) {
      console.error('❌ Data validation failed:', validation.errors);
      return res.status(400).json({ 
        error: 'Data validation failed', 
        details: validation.errors,
        warnings: validation.warnings
      });
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Data validation warnings:', validation.warnings);
    }

    // Use sanitized data
    const { baseline, current, systemContext } = validation.sanitized;
    
    console.log(`✅ Data validated successfully. Baseline: ${Object.keys(baseline.metrics).length} metrics, Current: ${Object.keys(current.metrics).length} metrics`);

    // Calculate basic diffs
    const diffs = calculateMetricDiffs(baseline, current);
    
    // Generate AI insights using Bedrock
    const insights = await generateAIInsights(diffs, systemContext);
    
    // Store for historical analysis
    await storeHistoricalData(baseline, current, insights);
    
    res.json({
      diffs,
      summary: calculateSummary(diffs),
      aiInsights: insights,
      provider: 'bedrock',
      model: systemContext?.selectedModel || 'anthropic.claude-3-5-haiku-20241022-v1:0',
      timestamp: new Date().toISOString(),
      validation: {
        warnings: validation.warnings,
        metricsCount: {
          baseline: Object.keys(baseline.metrics).length,
          current: Object.keys(current.metrics).length
        }
      }
    });
    
  } catch (error) {
    console.error('AI Analysis error:', error);
    res.status(500).json({ error: 'AI analysis failed', details: error.message });
  }
});

// 2. Direct Bedrock prompt endpoint (following AmazonBedrockAI.md pattern)
app.post('/api/ai/prompt', authenticateAPI, async (req, res) => {
  try {
    const { prompt, modelId } = req.body;
    
    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }



    console.log('🔄 Direct prompt request received');
    
    // Use the exact invokeModel pattern from AmazonBedrockAI.md
    const result = await invokeModel(prompt, modelId);
    
    res.json({
      result,
      modelUsed: modelId || 'anthropic.claude-3-5-haiku-20241022-v1:0',
      timestamp: new Date().toISOString(),
      provider: 'bedrock'
    });
    
  } catch (error) {
    console.error('Direct prompt error:', error);
    res.status(500).json({ 
      error: 'Prompt processing failed', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 3. Historical Data endpoint
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

// 4. Export reports
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

// 5. Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    bedrock: {
      region: process.env.AWS_REGION || 'us-west-2',
      models: Object.keys(BEDROCK_MODELS)
    }
  };

  res.json(health);
});

// 6. Bedrock-specific health endpoint
app.get('/health/bedrock', authenticateAPI, async (req, res) => {
  try {
    // Test Bedrock connection using sample pattern
    const isConnected = await testBedrockConnection();
    
    if (isConnected) {
      res.json({
        status: 'healthy',
        models: BEDROCK_MODELS,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'unavailable',
        reason: 'Bedrock connection failed',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      reason: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
async function startServer() {
  await ensureDataDir();
  
  app.listen(PORT, async () => {
    console.log(`🚀 Amazon Bedrock Performance Insights API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔑 API Authentication: ${process.env.API_SECRET_KEY ? 'Enabled' : 'DISABLED - Set API_SECRET_KEY!'}`);
    console.log('');
    console.log('🤖 AI PROVIDER: Amazon Bedrock (Following AmazonBedrockAI.md pattern)');
    console.log(`   Region: ${process.env.AWS_REGION || 'us-west-2'}`);
    console.log(`   Models: ${Object.keys(BEDROCK_MODELS).length} Claude models available`);
    console.log('');
    
    // Test connection on startup (optional)
    console.log('🔍 Testing Bedrock connection...');
    const isConnected = await testBedrockConnection();
    
    if (!isConnected) {
      console.log('');
      console.log('⚠️  AWS Bedrock Setup Required:');
      console.log('   1. Set AWS_ACCESS_KEY_ID in environment');
      console.log('   2. Set AWS_SECRET_ACCESS_KEY in environment');
      console.log('   3. Ensure Bedrock access is enabled in AWS region');
      console.log('   4. Enable Claude models in AWS Bedrock console');
    }
  });
}

startServer().catch(console.error);