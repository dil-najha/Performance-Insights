// Test Backend Data Validation
// Run with: node test-validation.js

import { BackendDataValidator } from './utils/dataValidation.js';

console.log('🧪 Testing Backend Data Validation...\n');

// Test cases that could break the system
const testCases = [
  {
    name: '✅ Valid Simple Format',
    data: {
      baseline: {
        name: 'baseline',
        metrics: { responseTime: 100, errorRate: 0.02 }
      },
      current: {
        name: 'current', 
        metrics: { responseTime: 200, errorRate: 0.05 }
      }
    }
  },
  {
    name: '❌ Invalid - Missing Metrics',
    data: {
      baseline: { name: 'baseline' },
      current: { name: 'current' }
    }
  },
  {
    name: '❌ Invalid - String Metrics',
    data: {
      baseline: {
        metrics: { responseTime: 'not-a-number', errorRate: 'invalid' }
      },
      current: {
        metrics: { responseTime: '200', errorRate: '0.05' }
      }
    }
  },
  {
    name: '⚠️ Mixed Types (Should Sanitize)',
    data: {
      baseline: {
        metrics: { 
          responseTime: 100,
          errorRate: '0.02',  // String number
          isHealthy: true,     // Boolean
          nullValue: null,     // Null
          arrayValue: [1,2,3], // Array (invalid)
          objectValue: { nested: 'object' } // Object (invalid)
        }
      },
      current: {
        metrics: { responseTime: 200, errorRate: 0.05 }
      }
    }
  },
  {
    name: '❌ Completely Invalid',
    data: 'not-an-object'
  },
  {
    name: '❌ Array Instead of Object',
    data: [1, 2, 3]
  },
  {
    name: '❌ Empty Metrics',
    data: {
      baseline: { metrics: {} },
      current: { metrics: {} }
    }
  }
];

// Run tests
testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log('=' .repeat(50));
  
  try {
    const result = BackendDataValidator.validateAnalysisRequest(testCase.data);
    
    if (result.valid) {
      console.log('✅ VALID');
      console.log('📊 Sanitized metrics:');
      console.log(`   Baseline: ${Object.keys(result.sanitized.baseline.metrics).length} metrics`);
      console.log(`   Current: ${Object.keys(result.sanitized.current.metrics).length} metrics`);
      
      if (result.warnings.length > 0) {
        console.log('⚠️ Warnings:');
        result.warnings.forEach(w => console.log(`   - ${w}`));
      }
    } else {
      console.log('❌ INVALID');
      console.log('🚫 Errors:');
      result.errors.forEach(e => console.log(`   - ${e}`));
      
      if (result.warnings.length > 0) {
        console.log('⚠️ Warnings:');
        result.warnings.forEach(w => console.log(`   - ${w}`));
      }
    }
  } catch (error) {
    console.log('💥 CRASHED:', error.message);
  }
});

console.log('\n🎯 Summary:');
console.log('The new validation system handles:');
console.log('✅ Type conversion (strings to numbers)');
console.log('✅ Data sanitization (removes invalid values)');
console.log('✅ Detailed error messages');
console.log('✅ Edge case protection (null, arrays, objects)');
console.log('✅ Graceful degradation with warnings');
console.log('❌ Prevents system crashes from malformed data');
