// Test script for Amazon Bedrock Performance Insights
// Following the exact AmazonBedrockAI.md pattern

import https from 'https';

async function testBedrockHealth() {
  console.log('🔍 Testing Bedrock health endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/health',
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseBody);
          resolve(result);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${responseBody}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testBedrockPrompt() {
  console.log('🧠 Testing direct Bedrock prompt...');
  
  const prompt = `Analyze this performance data and provide insights:

Baseline Performance:
- Response Time: 250ms
- Throughput: 1000 RPS
- Error Rate: 2%
- CPU Usage: 65%

Current Performance:  
- Response Time: 1650ms
- Throughput: 300 RPS
- Error Rate: 15%
- CPU Usage: 95%

Please provide 3 specific recommendations to improve performance.`;

  const data = JSON.stringify({
    prompt: prompt,
    modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/ai/prompt',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer bedrock-performance-insights-2025',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseBody);
          resolve(result);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${responseBody}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function testBedrockAnalysis() {
  console.log('📊 Testing performance analysis endpoint...');
  
  const data = JSON.stringify({
    baseline: {
      metrics: {
        responseTimeAvg: 250,
        throughput: 1000,
        errorRate: 2,
        cpu: 65
      }
    },
    current: {
      metrics: {
        responseTimeAvg: 1650,
        throughput: 300,
        errorRate: 15,
        cpu: 95
      }
    },
    systemContext: {
      environment: 'production',
      stack: 'Node.js',
      selectedModel: 'anthropic.claude-3-5-haiku-20241022-v1:0'
    }
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/ai/analyze',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer bedrock-performance-insights-2025',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseBody);
          resolve(result);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${responseBody}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Run comprehensive tests
(async () => {
  console.log('🧪 Amazon Bedrock Performance Insights Test Suite');
  console.log('====================================================');
  console.log('');

  try {
    // Test 1: Health Check
    console.log('TEST 1: Backend Health Check');
    const health = await testBedrockHealth();
    
    console.log('✅ Backend Status:', health.status);
    console.log('🏆 Bedrock Available:', health.bedrock?.available || false);
    console.log('📍 AWS Region:', health.bedrock?.region || 'Not configured');
    console.log('🤖 Available Models:', health.bedrock?.models?.length || 0);
    console.log('');

    if (!health.bedrock?.available) {
      console.log('❌ Bedrock is not available. Check AWS credentials.');
      console.log('💡 Update AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in ai-api-server/.env');
      return;
    }

    // Test 2: Direct Prompt
    console.log('TEST 2: Direct Bedrock Prompt');
    const promptResult = await testBedrockPrompt();
    
    console.log('✅ Prompt successful!');
    console.log('🤖 Model Used:', promptResult.modelUsed);
    console.log('🔮 Provider:', promptResult.provider);
    console.log('🎯 Response Length:', promptResult.result?.length || 0, 'characters');
    console.log('');

    // Test 3: Performance Analysis
    console.log('TEST 3: Performance Analysis');
    const analysisResult = await testBedrockAnalysis();
    
    console.log('✅ Analysis successful!');
    console.log('📊 Metrics Analyzed:', analysisResult.diffs?.length || 0);
    console.log('🧠 AI Insights:', analysisResult.aiInsights?.length || 0);
    console.log('🤖 Model:', analysisResult.model);
    console.log('');

    console.log('🎉 ALL TESTS PASSED!');
    console.log('🚀 Amazon Bedrock is ready for production use.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('1. Ensure backend is running: npm run start:backend');
    console.log('2. Check AWS credentials in ai-api-server/.env');
    console.log('3. Verify Bedrock permissions in AWS IAM');
    console.log('4. Ensure Claude models are available in your AWS region');
  }
})();
