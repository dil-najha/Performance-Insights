#!/usr/bin/env node

// Debug AI Connection - Performance Insights Dashboard
// Run with: node debug-ai-connection.js

import fetch from 'node-fetch';

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const API_SECRET_KEY = process.env.VITE_API_SECRET_KEY || 'generate_secure_random_key_here_minimum_32_chars';

console.log('\n🔍 Performance Insights - AI Connection Debug Tool\n');

async function debugConnection() {
  try {
    // Test 1: Backend Health Check
    console.log('1️⃣ Testing backend health...');
    try {
      const healthResponse = await fetch(`${BACKEND_URL}/health`);
      const healthData = await healthResponse.json();
      console.log('✅ Backend health:', healthData);
    } catch (error) {
      console.log('❌ Backend health failed:', error.message);
      return;
    }

    // Test 2: AI Analysis with Sample Data
    console.log('\n2️⃣ Testing AI analysis endpoint...');
    
    const sampleData = {
      baseline: {
        name: "Debug Test Baseline",
        metrics: {
          responseTimeAvg: 100,
          throughput: 500,
          errorRate: 1.0
        }
      },
      current: {
        name: "Debug Test Current", 
        metrics: {
          responseTimeAvg: 150,
          throughput: 450,
          errorRate: 2.0
        }
      },
      systemContext: {
        environment: 'dev',
        selectedModel: 'deepseek/deepseek-chat-v3-0324:free',
        advanced_context: 'Debug test - checking AI connectivity'
      }
    };

    try {
      console.log('📤 Sending AI analysis request...');
      console.log('🔑 Using API key:', API_SECRET_KEY.substring(0, 8) + '...');
      
      const response = await fetch(`${BACKEND_URL}/api/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_SECRET_KEY}`
        },
        body: JSON.stringify(sampleData)
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ AI analysis failed:', errorText);
        
        if (response.status === 401) {
          console.log('\n🔧 SOLUTION: Check API key mismatch between frontend and backend');
          console.log('Frontend key (VITE_API_SECRET_KEY):', API_SECRET_KEY.substring(0, 8) + '...');
          console.log('Make sure backend (ai-api-server/.env) has same API_SECRET_KEY');
        }
        return;
      }

      const result = await response.json();
      console.log('✅ AI analysis successful!');
      console.log('📊 Result summary:', {
        diffsCount: result.diffs?.length || 0,
        aiInsightsCount: result.aiInsights?.length || 0,
        hasExplanation: !!result.explanation,
        hasTimestamp: !!result.timestamp
      });
      
      if (result.aiInsights && result.aiInsights.length > 0) {
        console.log('🤖 AI insights generated - OpenRouter API is working!');
      } else {
        console.log('⚠️  No AI insights - possibly using fallback mode');
      }

    } catch (error) {
      console.log('❌ AI analysis request failed:', error.message);
    }

    // Test 3: Check Environment Variables
    console.log('\n3️⃣ Environment check...');
    console.log('Frontend API key set:', !!process.env.VITE_API_SECRET_KEY);
    console.log('Backend URL:', BACKEND_URL);
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

console.log('🎯 Starting connection test...');
console.log('📋 Make sure both frontend and backend are running:');
console.log('   Frontend: npm run dev (port 5173)');
console.log('   Backend: cd ai-api-server && npm start (port 3001)\n');

debugConnection().then(() => {
  console.log('\n🔍 Debug complete!');
  console.log('\n💡 Common issues:');
  console.log('• API key mismatch between frontend and backend');
  console.log('• Missing OPENROUTER_API_KEY in backend .env');
  console.log('• Backend not running on port 3001');
  console.log('• CORS issues (check browser console)');
});
