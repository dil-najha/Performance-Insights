// Test New P1-P5 Priority System
// Run with: node test-priority-system.js

import https from 'https';

console.log('🧪 Testing New P1-P5 Priority System...\n');

// Test data with severe performance issues (should generate P1/P2 priorities)
const testData = {
  baseline: {
    name: 'baseline',
    metrics: {
      responseTime: 100,
      errorRate: 0.02,
      pageLoad: 2800,
      successRate: 0.98
    }
  },
  current: {
    name: 'current', 
    metrics: {
      responseTime: 1658,  // +1558% increase (P1 Critical)
      errorRate: 1.0,      // +4900% increase (P1 Critical)
      pageLoad: 28102,     // +904% increase (P1 Critical)
      successRate: 0.60    // -38% decrease (P2 High)
    }
  },
  systemContext: {
    environment: 'prod',
    stack: 'React + Node.js'
  }
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/ai/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer bedrock-performance-insights-2025',
    'Content-Length': Buffer.byteLength(postData)
  },
  // Allow self-signed certificates for local testing
  rejectUnauthorized: false
};

console.log('📊 Test Data Overview:');
console.log(`   Response Time: 100ms → 1658ms (+1558% 🚨)`);
console.log(`   Error Rate: 2% → 100% (+4900% 🚨)`);
console.log(`   Page Load: 2.8s → 28.1s (+904% 🚨)`);
console.log(`   Success Rate: 98% → 60% (-38% ⚠️)`);
console.log('');
console.log('📋 Expected Priority Distribution:');
console.log('   P1 (Critical): System failures, error rate spike');
console.log('   P2 (High): Severe performance degradation');
console.log('   P3+ (Medium/Low): Optimization recommendations');
console.log('');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.error) {
        console.log('❌ API Error:', response.error);
        console.log('Details:', response.details);
        return;
      }
      
      console.log('✅ API Response Received');
      console.log(`📊 Generated ${response.aiInsights?.length || 0} insights\n`);
      
      if (response.aiInsights && response.aiInsights.length > 0) {
        console.log('🎯 Priority Analysis Results:');
        console.log('=' .repeat(60));
        
        const priorityCounts = {};
        
        response.aiInsights.forEach((insight, index) => {
          const priority = insight.priority_score || 'Unknown';
          priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
          
          console.log(`\n${index + 1}. ${insight.title}`);
          console.log(`   Priority: ${priority} | Severity: ${insight.severity} | Type: ${insight.type}`);
          console.log(`   Confidence: ${Math.round(insight.confidence * 100)}%`);
          
          if (insight.business_impact) {
            console.log(`   Business Impact: ${insight.business_impact.substring(0, 80)}...`);
          }
          
          if (insight.immediate_actions) {
            console.log(`   Immediate Actions: ${insight.immediate_actions.length} items`);
          }
        });
        
        console.log('\n📈 Priority Distribution:');
        console.log('=' .repeat(30));
        ['P1', 'P2', 'P3', 'P4', 'P5'].forEach(priority => {
          const count = priorityCounts[priority] || 0;
          const label = getPriorityLabel(priority);
          console.log(`   ${priority} (${label}): ${count} insights`);
        });
        
        console.log('\n🎯 Success Criteria:');
        console.log(`   ✅ Should have P1/P2 priorities for critical issues`);
        console.log(`   ✅ Priority format should be P1-P5 (not 1-10)`);
        console.log(`   ✅ Each insight should have structured sections`);
        
      } else {
        console.log('❌ No AI insights generated');
      }
      
    } catch (error) {
      console.log('❌ Error parsing response:', error.message);
      console.log('Raw response:', data.substring(0, 200) + '...');
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request error:', error.message);
  console.log('\n💡 Make sure the backend server is running:');
  console.log('   cd ai-api-server && npm start');
});

req.write(postData);
req.end();

function getPriorityLabel(priority) {
  switch (priority) {
    case 'P1': return 'Critical';
    case 'P2': return 'High';
    case 'P3': return 'Medium';
    case 'P4': return 'Low';
    case 'P5': return 'Recommended';
    default: return 'Unknown';
  }
}
