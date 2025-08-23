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

// ===============================================
// 🧪 TEST-APP CODE LOADER (ISOLATED FEATURE)
// ===============================================
import { TestAppCodeLoader } from './services/testAppCodeLoader.js';

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

// ===============================================
// 🧪 AUTO-LOAD TEST-APP CODE (ISOLATED FEATURE)
// ===============================================

// Build comprehensive AI analysis prompt with auto-loaded test-app code
function buildAnalysisPrompt(diffs, systemContext = {}, sourceCode = null) {
  // Check if code review mode is enabled
  const isCodeReviewMode = !!(systemContext.enableCodeReview && sourceCode && sourceCode.files && sourceCode.files.length > 0);
  
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

  // Log appropriate message based on mode and context
  if (isCodeReviewMode && hasAdvancedContext) {
    console.log('🎯💻🔧 Using CODE REVIEW mode with systematic prompt + advanced user context + source code analysis');
  } else if (isCodeReviewMode) {
    console.log('🎯💻 Using CODE REVIEW mode with systematic prompt + source code analysis (basic context)');
  } else if (hasAdvancedContext) {
    console.log('🎯🔧 Using systematic prompt with advanced user context');
  } else {
    console.log('🎯 Using systematic performance analysis prompt (basic context)');
  }

  // 🧪 Log test-app code loading status
  if (sourceCode && sourceCode.source === 'test-app-auto-loaded') {
    console.log(`🧪 TEST-APP: Auto-loaded ${sourceCode.files.length} files (${Math.round(sourceCode.totalSize/1024)}KB) for AI analysis`);
  }

  // Use appropriate prompt template based on code review mode
  if (isCodeReviewMode) {
    return PERFORMANCE_ANALYSIS_PROMPT.buildCodeReviewPrompt(diffs, systemContext, sourceCode);
  } else {
    return PERFORMANCE_ANALYSIS_PROMPT.buildPrompt(diffs, systemContext);
  }
}

// Simple JSON cleaning (AI now generates proper format)
function cleanJsonString(jsonStr) {
  return jsonStr
    // Remove trailing commas before closing brackets/braces
    .replace(/,(\s*[}\]])/g, '$1')
    // Clean up excessive whitespace but preserve structure
    .trim();
}

function extractMetricsFromText(text) {
  const metrics = [];
  const metricPatterns = [
    /(\w+_response_time|\w+_load_time|\w+_usage|\w+_rate)/gi,
    /"affected_metrics":\s*\[(.*?)\]/gi,
    /"metric_key\d*":\s*"([^"]+)"/gi
  ];
  
  for (const pattern of metricPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        metrics.push(match[1]);
      }
    }
  }
  
  return [...new Set(metrics)].slice(0, 10); // Unique metrics, max 10
}

function extractJsonByTypePattern(text) {
  console.log('🎯 Looking for JSON with "type" objects...');
  
  try {
    // Find the largest JSON array in the text
    const arrayStart = text.indexOf('[');
    const arrayEnd = text.lastIndexOf(']');
    
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      const jsonArray = text.substring(arrayStart, arrayEnd + 1);
      console.log(`🎯 Extracted array: ${jsonArray.length} chars`);
      
      try {
        const parsed = JSON.parse(jsonArray);
        console.log(`✅ Type pattern extraction successful! Objects: ${parsed.length}`);
        return parsed;
      } catch (parseError) {
        console.log('🔄 Type pattern parsing failed:', parseError.message);
      }
    }
    
  } catch (error) {
    console.log('🔄 Type pattern extraction failed:', error.message);
  }
  
  return null;
}

function parseFromText(text) {
  try {
    // Extract key information from text using patterns
    const titleMatch = text.match(/title[":]\s*"([^"]+)"/i);
    const severityMatch = text.match(/severity[":]\s*"([^"]+)"/i);
    const typeMatch = text.match(/type[":]\s*"([^"]+)"/i);
    const descriptionMatch = text.match(/description[":]\s*"([^"]+)"/i);
    
    if (titleMatch) {
      return [{
        type: typeMatch ? typeMatch[1] : 'analysis',
        severity: severityMatch ? severityMatch[1] : 'medium',
        confidence: 0.7,
        title: titleMatch[1],
        description: descriptionMatch ? descriptionMatch[1] : 'Performance analysis completed - check logs for details',
        actionable_steps: ['Review detailed analysis in backend logs'],
        affected_metrics: extractMetricsFromText(text),
        business_impact: 'Performance analysis insights available',
        priority_score: 'P3',
        effort_estimate: 'medium'
      }];
    }
  } catch (parseError) {
    console.log('🔄 Text parsing failed:', parseError.message);
  }
  
  return null;
}

// Generate AI insights using Bedrock with auto-loaded test-app code
async function generateAIInsights(diffs, systemContext, sourceCode = null) {
  try {
    let finalSourceCode = sourceCode;

    // 🧪 AUTO-LOAD TEST-APP CODE: If code review is enabled but no source code provided,
    // automatically load test-app code for analysis
    console.log('\n🧪 ==================== CODE REVIEW MODE DEBUG ====================');
    console.log(`🎯 Code Review Enabled: ${systemContext.enableCodeReview}`);
    console.log(`📁 Source Code Provided: ${sourceCode ? 'Yes' : 'No'}`);
    if (sourceCode) {
      console.log(`📁 Source Code Files: ${sourceCode.files?.length || 0}`);
      console.log(`📁 Source Code Source: ${sourceCode.source || 'unknown'}`);
    }
    console.log(`🧪 TestAppCodeLoader Available: ${TestAppCodeLoader?.isEnabled() ? 'Yes' : 'No'}`);
    
    if (systemContext.enableCodeReview && (!sourceCode || !sourceCode.files || sourceCode.files.length === 0)) {
      if (TestAppCodeLoader?.isEnabled()) {
        console.log('🧪 Code Review enabled but no source code provided - attempting to auto-load test-app code...');
        
        try {
          const autoLoadedCode = await TestAppCodeLoader.loadTestAppCode();
          if (autoLoadedCode) {
            finalSourceCode = autoLoadedCode;
            console.log(`✅ Successfully auto-loaded test-app code: ${autoLoadedCode.files.length} files, ${Math.round(autoLoadedCode.totalSize/1024)}KB`);
            console.log('📁 Auto-loaded files:');
            autoLoadedCode.files.forEach(file => {
              console.log(`   - ${file.path} (${file.category || 'unknown'}, ${Math.round(file.size/1024)}KB)`);
            });
          } else {
            console.log('❌ Test-app code could not be auto-loaded (directory not found or empty)');
          }
        } catch (error) {
          console.error('❌ Test-app auto-loading failed:', error.message);
          console.error('   Stack:', error.stack);
        }
      } else {
        console.log('❌ Test-app code loader is disabled');
      }
    } else if (systemContext.enableCodeReview) {
      console.log('ℹ️ Code review enabled and source code already provided - using existing source code');
    } else {
      console.log('ℹ️ Code review mode disabled - standard analysis mode');
    }
    
    console.log(`🎯 Final Source Code: ${finalSourceCode ? `${finalSourceCode.files?.length || 0} files` : 'None'}`);
    console.log('🧪 ==================== END CODE REVIEW DEBUG ====================\n');

    const prompt = buildAnalysisPrompt(diffs, systemContext, finalSourceCode);
    console.log('🎯 ==================== FINAL DEBUG SUMMARY ====================');
    console.log('📊 Analysis Summary Before AI Call:');
    console.log(`   - Total Metrics: ${diffs.length}`);
    console.log(`   - Degraded Metrics: ${diffs.filter(d => d.trend === 'worse').length}`);
    console.log(`   - Improved Metrics: ${diffs.filter(d => d.trend === 'improved').length}`);
    console.log(`   - Unchanged Metrics: ${diffs.filter(d => d.trend === 'same').length}`);
    console.log(`   - Code Review Mode: ${finalSourceCode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   - Source Files: ${finalSourceCode ? finalSourceCode.files.length : 0}`);
    console.log(`   - Prompt Mode: ${finalSourceCode ? 'CODE REVIEW' : 'STANDARD ANALYSIS'}`);
    console.log('🎯 ==================== END FINAL SUMMARY ====================\n');
    const modelId = systemContext?.selectedModel || 'anthropic.claude-3-5-haiku-20241022-v1:0';
    
    // 🔍 DEBUG: Log prompt details
    console.log(`🧠 Analyzing performance with Bedrock model: ${modelId}`);
    console.log(`🔍 Generated prompt length: ${prompt.length} characters`);
    console.log(`📊 Metrics in diffs: ${diffs.length} metrics`);
    console.log(`🎯 Sample metrics: ${diffs.slice(0, 5).map(d => `${d.key}:${d.baseline}→${d.current}`).join(', ')}`);
    
    // 🔍 DEBUG: Log full prompt and analysis details
    console.log('\n🔍 ==================== AI ANALYSIS DEBUG ====================');
    console.log('🤖 AI CALL INITIATED');
    console.log(`📝 Prompt length: ${prompt.length} characters`);
    console.log(`🎯 Model: ${modelId}`);
    console.log(`⚙️ Context: ${JSON.stringify(systemContext, null, 2)}`);
    
    if (process.env.DEBUG_PROMPTS === 'true' || true) { // Always show full prompt for debugging
      console.log('\n📋 ==== FULL GENERATED PROMPT ====');
      console.log(prompt);
      console.log('📋 ==== END FULL PROMPT ====\n');
    }
    
    console.log('🚀 Sending request to AWS Bedrock...');
    
    // Use the exact invokeModel pattern from AmazonBedrockAI.md
    const result = await invokeModel(prompt, modelId);
    
    // 🔍 DEBUG: Log AI response
    console.log('\n📤 ==== AI RESPONSE RECEIVED ====');
    console.log(`📏 Response length: ${result.length} characters`);
    console.log('🤖 Raw AI Response:');
    console.log(result);
    console.log('📤 ==== END AI RESPONSE ====\n');
    
    // 🎯 SIMPLIFIED JSON PARSER (AI now generates clean JSON per updated prompt)
    let parsedResult = null;
    
    console.log('🔄 Starting simplified JSON parsing...');
    console.log(`🔍 Response starts with: ${result.substring(0, 100)}`);
    console.log(`🔍 Response length: ${result.length} characters`);
    
    // Strategy 1: Direct JSON parsing (should work with new prompt format)
    try {
      parsedResult = JSON.parse(result);
      console.log('✅ Direct JSON parsing successful');
    } catch (directError) {
      console.log('🔄 Direct parsing failed:', directError.message);
      
      // Strategy 2: Extract JSON array from text (most common case)
      console.log('🔄 Attempting array extraction...');
      const arrayStart = result.indexOf('[');
      const arrayEnd = result.lastIndexOf(']');
      
      if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
        const jsonArray = result.substring(arrayStart, arrayEnd + 1);
        console.log(`🎯 Extracted array: ${jsonArray.length} chars`);
        
        try {
          parsedResult = JSON.parse(jsonArray);
          console.log('✅ Array extraction successful!');
        } catch (arrayError) {
          console.log('🔄 Array extraction failed:', arrayError.message);
          
          // Strategy 3: Type-to-improvement pattern (your custom strategy)
          console.log('🔄 Attempting type-to-improvement pattern extraction...');
          parsedResult = extractJsonByTypePattern(result);
          if (parsedResult) {
            console.log('✅ JSON extracted using type-to-improvement pattern!');
          }
        }
      }
      
      // Final fallback with enhanced error info
      if (!parsedResult) {
        console.error('❌ All parsing strategies failed');
        console.log('🔄 Creating enhanced fallback...');
        
        parsedResult = [{
          type: 'parsing_issue',
          severity: 'medium', 
          confidence: 0.6,
          title: 'AI Analysis Generated (Format Issue)', 
          description: 'AI provided detailed performance analysis but output format needs adjustment. Check backend logs for complete analysis.',
          immediate_actions: [
            'Review backend console for complete AI analysis',
            'Check JSON formatting in AI response',
            'Verify prompt format compliance'
          ],
          affected_metrics: extractMetricsFromText(result),
          business_impact: 'Performance insights available - see logs for detailed recommendations',
          priority_score: 'P3',
          effort_estimate: 'low',
          expected_improvement: 'Display formatting fix needed'
        }];
        
        console.log('⚠️ Using enhanced fallback with extracted insights');
      }
    }
    
    // Validate and display results
    if (parsedResult && Array.isArray(parsedResult)) {
      console.log(`📊 Insights generated: ${parsedResult.length}`);
      console.log('\n🎯 INSIGHTS SUMMARY:');
      parsedResult.forEach((insight, index) => {
        console.log(`   ${index + 1}. [${insight.priority_score || insight.severity}] ${insight.title}`);
        console.log(`      Type: ${insight.type}`);
        if (insight.affected_metrics) {
          console.log(`      Metrics: ${insight.affected_metrics.slice(0, 3).join(', ')}${insight.affected_metrics.length > 3 ? '...' : ''}`);
        }
      });
    } else if (parsedResult) {
      console.log('📊 AI Response parsed but not an array format');
      console.log('🔄 Converting to array format...');
      parsedResult = [parsedResult];
    }
    
    return parsedResult;
    
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
    const { baseline, current, systemContext, sourceCode } = validation.sanitized;
    
    console.log(`✅ Data validated successfully. Baseline: ${Object.keys(baseline.metrics).length} metrics, Current: ${Object.keys(current.metrics).length} metrics`);
    
    // 🔍 DEBUG: Log sample extracted metrics  
    const baselineKeys = Object.keys(baseline.metrics);
    const currentKeys = Object.keys(current.metrics);
    console.log(`🔍 Sample baseline metrics: ${baselineKeys.slice(0, 10).join(', ')}`);
    console.log(`🔍 Sample current metrics: ${currentKeys.slice(0, 10).join(', ')}`);
    
    // 🔍 Check if test-app metrics are present
    const testAppMetrics = baselineKeys.filter(key => key.includes('test_app') || key.includes('login_response') || key.includes('dashboard_load'));
    console.log(`🧪 Test-app specific metrics found: ${testAppMetrics.length} (${testAppMetrics.slice(0, 5).join(', ')})`);
    
    // 🧪 Enhanced logging for test-app code loading
    if (systemContext.enableCodeReview) {
      if (sourceCode && sourceCode.files && sourceCode.files.length > 0) {
        if (sourceCode.source === 'test-app-auto-loaded') {
          console.log(`🎯🧪 Code Review Mode: Enabled with auto-loaded test-app code (${sourceCode.files.length} files)`);
        } else {
          console.log(`🎯💻 Code Review Mode: Enabled with manually uploaded code (${sourceCode.files.length} files)`);
        }
      } else {
        console.log(`🎯💻 Code Review Mode: Enabled - will attempt test-app auto-loading`);
      }
    } else {
      console.log(`🎯 Code Review Mode: Disabled - using standard analysis`);
    }

    // Calculate basic diffs
    const diffs = calculateMetricDiffs(baseline, current);
    
    // 🔍 DEBUG: Log diff calculation results
    console.log(`📊 Calculated ${diffs.length} metric diffs`);
    const worseDiffs = diffs.filter(d => d.trend === 'worse');
    const improvedDiffs = diffs.filter(d => d.trend === 'improved'); 
    const sameDiffs = diffs.filter(d => d.trend === 'same');
    console.log(`📈 Performance changes: ${improvedDiffs.length} improved, ${worseDiffs.length} worse, ${sameDiffs.length} same`);
    
    if (worseDiffs.length > 0) {
      console.log(`🔻 Top degraded metrics: ${worseDiffs.slice(0, 5).map(d => `${d.key}(${d.pct?.toFixed(1)}%)`).join(', ')}`);
    }
    if (improvedDiffs.length > 0) {
      console.log(`🔺 Top improved metrics: ${improvedDiffs.slice(0, 5).map(d => `${d.key}(${d.pct?.toFixed(1)}%)`).join(', ')}`);
    }
    
    // Generate AI insights using Bedrock (with auto-loaded test-app code if needed)
    const insights = await generateAIInsights(diffs, systemContext, sourceCode);
    
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

// ===============================================
// 🧪 TEST-APP STATUS ENDPOINT (ISOLATED FEATURE)
// ===============================================

// 7. Test-App Code Loader Status (Isolated Feature)
app.get('/api/testapp/status', authenticateAPI, async (req, res) => {
  try {
    if (!TestAppCodeLoader) {
      return res.json({
        enabled: false,
        available: false,
        message: 'Test-app code loader is disabled',
        feature: 'test-app-code-loader'
      });
    }

    const stats = await TestAppCodeLoader.getStats();
    
  res.json({ 
      ...stats,
      message: stats.enabled && stats.available 
        ? 'Test-app code loader is ready for automatic code loading'
        : stats.enabled 
          ? 'Test-app code loader is enabled but test-app directory not found'
          : 'Test-app code loader is disabled',
      feature: 'test-app-code-loader',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test-app status error:', error);
    res.status(500).json({ 
      error: 'Failed to check test-app status',
      feature: 'test-app-code-loader'
    });
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
    },
    features: {
      test_app_code_loader: TestAppCodeLoader?.isEnabled() || false
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
    
    // 🧪 Test-App Code Loader Status
    if (TestAppCodeLoader?.isEnabled()) {
      console.log('');
      console.log('🧪 TEST-APP CODE LOADER:');
      console.log('   Status: ✅ Enabled (Automatic code loading for AI analysis)');
      console.log('   Feature: Auto-loads test-app source code when "Code Level Suggestions" is enabled');
      console.log('   Isolation: Can be easily disabled by setting FEATURE_ENABLED = false');
      
      try {
        const stats = await TestAppCodeLoader.getStats();
        if (stats.available) {
          console.log(`   Directory: ${stats.baseDirectory}`);
          console.log(`   Files: ${stats.configuredFiles} configured files ready for analysis`);
        } else {
          console.log('   Warning: Test-app directory not found - manual file upload still available');
        }
      } catch (error) {
        console.log('   Warning: Could not check test-app availability');
      }
    } else {
      console.log('');
      console.log('🧪 TEST-APP CODE LOADER: ❌ Disabled');
      console.log('   Note: Only manual file upload available for code review');
    }
    
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