// Example Backend API Server for AI Integration
// Run with: node backend-api-example.js

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI (you'll need to install: npm install openai)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set in your environment
});

// AI Endpoints

// 1. Anomaly Detection
app.post('/api/ai/anomalies', async (req, res) => {
  try {
    const { metrics } = req.body;
    
    // Simple statistical anomaly detection
    const anomalies = detectStatisticalAnomalies(metrics);
    
    res.json(anomalies);
  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({ error: 'Anomaly detection failed' });
  }
});

// 2. Smart Suggestions using GPT
app.post('/api/ai/suggestions', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a performance optimization expert. Analyze metrics and provide specific, actionable suggestions. Format your response as JSON array with objects containing: type, severity, title, description, actionable_steps, affected_metrics.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const suggestions = parseGPTResponse(completion.choices[0].message.content);
    res.json(suggestions);
  } catch (error) {
    console.error('Smart suggestions error:', error);
    res.status(500).json({ error: 'Smart suggestions failed' });
  }
});

// 3. Root Cause Analysis
app.post('/api/ai/root-cause', async (req, res) => {
  try {
    const { metrics, correlations } = req.body;
    
    // Analyze correlations and generate root cause insights
    const rootCauses = analyzeRootCauses(metrics, correlations);
    
    res.json(rootCauses);
  } catch (error) {
    console.error('Root cause analysis error:', error);
    res.status(500).json({ error: 'Root cause analysis failed' });
  }
});

// 4. Performance Predictions
app.post('/api/ai/predict', async (req, res) => {
  try {
    const { current, historical } = req.body;
    
    // Simple trend-based predictions
    const predictions = generateTrendPredictions(current, historical);
    
    res.json(predictions);
  } catch (error) {
    console.error('Performance prediction error:', error);
    res.status(500).json({ error: 'Performance prediction failed' });
  }
});

// 5. Natural Language Explanations
app.post('/api/ai/explain', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Explain performance metrics in simple, business-friendly language. Keep it concise and actionable."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    res.json({ explanation: completion.choices[0].message.content });
  } catch (error) {
    console.error('Explanation error:', error);
    res.status(500).json({ error: 'Explanation failed' });
  }
});

// Helper Functions

function detectStatisticalAnomalies(metrics) {
  return metrics
    .filter(metric => {
      if (metric.pct === null) return false;
      
      // Anomaly if change is > 2 standard deviations
      const changeThreshold = 25; // 25% change
      return Math.abs(metric.pct) > changeThreshold;
    })
    .map(metric => ({
      type: 'anomaly',
      severity: Math.abs(metric.pct) > 50 ? 'high' : 'medium',
      confidence: 0.8,
      title: `Anomalous change in ${metric.label}`,
      description: `${metric.label} changed by ${metric.pct.toFixed(1)}% - this exceeds normal variation.`,
      actionable_steps: [
        'Review recent deployments or configuration changes',
        'Check system resource utilization',
        'Analyze error logs for this time period'
      ],
      affected_metrics: [metric.key]
    }));
}

function analyzeRootCauses(metrics, correlations) {
  const rootCauses = [];
  
  // Find strongly correlated metrics that degraded together
  Object.entries(correlations).forEach(([pair, correlation]) => {
    if (Math.abs(correlation) > 0.7) {
      const [metric1, metric2] = pair.split('-');
      const m1 = metrics.find(m => m.key === metric1);
      const m2 = metrics.find(m => m.key === metric2);
      
      if (m1?.trend === 'worse' && m2?.trend === 'worse') {
        rootCauses.push({
          type: 'root_cause',
          severity: 'medium',
          confidence: 0.7,
          title: `Correlated performance degradation`,
          description: `${m1.label} and ${m2.label} degraded together, suggesting a common root cause.`,
          actionable_steps: [
            'Investigate shared dependencies between these metrics',
            'Check if a common resource is constrained',
            'Review recent changes affecting both areas'
          ],
          affected_metrics: [metric1, metric2]
        });
      }
    }
  });
  
  return rootCauses;
}

function generateTrendPredictions(current, historical) {
  if (!historical || historical.length < 3) {
    return [];
  }
  
  const predictions = [];
  
  // Simple linear trend analysis
  Object.keys(current.metrics).forEach(key => {
    const values = historical.map(h => h.metrics[key]).filter(v => v !== undefined);
    if (values.length >= 3) {
      const trend = calculateTrend(values);
      
      if (Math.abs(trend) > 0.05) { // 5% trend
        predictions.push({
          type: 'prediction',
          severity: trend > 0 ? 'medium' : 'low',
          confidence: 0.6,
          title: `${key} trend prediction`,
          description: `Based on historical data, ${key} is trending ${trend > 0 ? 'upward' : 'downward'} by ${(trend * 100).toFixed(1)}% per measurement.`,
          actionable_steps: [
            trend > 0 ? 'Monitor for continued increase' : 'Consider optimizations to improve this metric',
            'Plan capacity if trend continues'
          ],
          affected_metrics: [key]
        });
      }
    }
  });
  
  return predictions;
}

function calculateTrend(values) {
  const n = values.length;
  const x = Array.from({length: n}, (_, i) => i);
  const y = values;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const avgY = sumY / n;
  
  return slope / avgY; // Normalized slope
}

function parseGPTResponse(content) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback: parse as plain text and structure it
    return [{
      type: 'suggestion',
      severity: 'medium',
      confidence: 0.7,
      title: 'AI Suggestion',
      description: content,
      actionable_steps: [content],
      affected_metrics: []
    }];
  } catch (error) {
    console.error('Failed to parse GPT response:', error);
    return [];
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Performance Insights API Server running on port ${PORT}`);
  console.log(`💡 Make sure to set OPENAI_API_KEY environment variable`);
  console.log(`🔗 Frontend should point to: http://localhost:${PORT}/api/ai`);
});

// Package.json dependencies needed:
/*
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "openai": "^4.0.0"
  }
}
*/
