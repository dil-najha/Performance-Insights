// Amazon Bedrock AI Configuration
// Clean implementation with only Bedrock support

export const AI_CONFIG = {
  // AWS Bedrock Configuration (Only AI Provider)
  bedrock: {
    enabled: import.meta.env.VITE_BEDROCK_ENABLED !== 'false', // Default enabled
    region: import.meta.env.VITE_AWS_REGION || 'us-west-2',
    primaryModel: import.meta.env.VITE_BEDROCK_MODEL || 'anthropic.claude-3-5-haiku-20241022-v1:0',
    models: [
      {
        id: 'anthropic.claude-3-5-haiku-20241022-v1:0',
        name: 'Claude 3.5 Haiku',
        description: 'Latest fast and cost-effective model with enhanced capabilities',
        provider: 'AWS Bedrock',
        tier: 'enterprise',
        maxTokens: 200000,
        cost: 'low',
        speed: 'very-fast'
      },
      {
        id: 'anthropic.claude-3-haiku-20240307-v1:0',
        name: 'Claude 3 Haiku',
        description: 'Fast and cost-effective for analysis',
        provider: 'AWS Bedrock',
        tier: 'enterprise',
        maxTokens: 200000,
        cost: 'low',
        speed: 'fast'
      },
      {
        id: 'anthropic.claude-sonnet-4-20250514-v1:0',
        name: 'Claude 3.5 Sonnet',
        description: 'Latest high-performance model (requires inference profile)',
        provider: 'AWS Bedrock',
        tier: 'enterprise',
        maxTokens: 200000,
        cost: 'medium',
        speed: 'fast'
      },
      {
        id: 'anthropic.claude-3-sonnet-20240229-v1:0',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance and capability',
        provider: 'AWS Bedrock', 
        tier: 'enterprise',
        maxTokens: 200000,
        cost: 'medium',
        speed: 'medium'
      },
      {
        id: 'anthropic.claude-3-opus-20240229-v1:0',
        name: 'Claude 3 Opus',
        description: 'Highest capability for complex analysis',
        provider: 'AWS Bedrock',
        tier: 'enterprise', 
        maxTokens: 200000,
        cost: 'high',
        speed: 'slow'
      }
    ],
    maxTokens: 200000,
    temperature: 0.3
  },

  // API Endpoints
  api: {
    baseUrl: import.meta.env.VITE_AI_API_BASE_URL || '/api/ai',
    timeout: parseInt(import.meta.env.VITE_AI_API_TIMEOUT || '30000'),
  },

  // Feature Flags
  features: {
    anomalyDetection: import.meta.env.VITE_AI_ANOMALY_DETECTION !== 'false',
    smartSuggestions: import.meta.env.VITE_AI_SMART_SUGGESTIONS !== 'false',
    rootCauseAnalysis: import.meta.env.VITE_AI_ROOT_CAUSE !== 'false',
    predictions: import.meta.env.VITE_AI_PREDICTIONS !== 'false',
    naturalLanguage: import.meta.env.VITE_AI_NATURAL_LANGUAGE !== 'false',
  }
};

// Environment validation
export function validateAIConfig(): { 
  valid: boolean; 
  errors: string[]; 
  providers: {
    bedrock: boolean;
    recommended: string;
  };
} {
  const errors: string[] = [];

  // Check for Bedrock availability
  const hasBedrock = AI_CONFIG.bedrock.enabled;
  
  if (AI_CONFIG.features.smartSuggestions && !hasBedrock) {
    errors.push('AWS Bedrock is required for AI-powered smart suggestions');
  }

  if (AI_CONFIG.api.timeout < 5000) {
    errors.push('API timeout should be at least 5 seconds');
  }

  // Bedrock-specific validations
  if (hasBedrock) {
    if (!AI_CONFIG.bedrock.region) {
      errors.push('AWS region is required when Bedrock is enabled');
    }
    if (!AI_CONFIG.bedrock.primaryModel) {
      errors.push('Primary Bedrock model must be specified');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    providers: {
      bedrock: hasBedrock,
      recommended: hasBedrock ? 'bedrock' : 'none'
    }
  };
}

// Provider selection logic - Bedrock only
export function getPreferredProvider(): 'bedrock' | 'local' {
  const validation = validateAIConfig();
  
  // Always prefer Bedrock if enabled
  if (validation.providers.bedrock) {
    console.log('🏆 Using AWS Bedrock (enterprise Claude models)');
    return 'bedrock';
  }
  
  // Fallback to local analysis (no AI)
  console.log('🏠 No AWS Bedrock - using local analysis only');
  return 'local';
}

// Get available models (Bedrock only)
export function getAvailableModels() {
  return AI_CONFIG.bedrock.models;
}

// Get model by ID
export function getModelById(modelId: string) {
  return AI_CONFIG.bedrock.models.find(model => model.id === modelId);
}

// Development setup instructions
export const SETUP_INSTRUCTIONS = `
🏆 Amazon Bedrock Setup Instructions:

1. Environment Variables (add to .env.local):
   
   🔧 Frontend Configuration:
   VITE_BEDROCK_ENABLED=true
   VITE_AWS_REGION=us-west-2
   VITE_BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0
   VITE_AI_API_BASE_URL=http://localhost:3001/api
   VITE_API_SECRET_KEY=your_secure_api_key
   
2. Backend Configuration (ai-api-server/.env):
   
   🔑 AWS Credentials:
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=us-west-2
   
   🔧 Server Settings:
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   API_SECRET_KEY=your_secure_api_key
   
3. AWS Setup Requirements:
   
   ✅ Create AWS IAM user with Bedrock permissions:
      - bedrock:InvokeModel
      - bedrock:ListModels (optional)
   
   ✅ Enable Bedrock access in your AWS region
   
   ✅ Ensure Claude models are available in your region

4. Available Models:
   
   🚀 Claude 3 Haiku (Fast & Cost-effective)
      - Model: anthropic.claude-3-haiku-20240307-v1:0
      - Best for: Quick analysis, high throughput
   
   ⚖️ Claude 3 Sonnet (Balanced)
      - Model: anthropic.claude-3-sonnet-20240229-v1:0
      - Best for: Balanced performance and capability
   
   🧠 Claude 3 Opus (Highest Capability)
      - Model: anthropic.claude-3-opus-20240229-v1:0
      - Best for: Complex analysis, detailed insights

5. Installation:
   
   cd ai-api-server
   npm install @aws-sdk/client-bedrock-runtime @aws-sdk/credential-providers
   npm run start
   
6. Testing:
   
   curl http://localhost:3001/health
   curl -H "Authorization: Bearer your-api-key" http://localhost:3001/health/bedrock

7. Benefits:
   
   ✅ Enterprise-grade security & compliance
   ✅ Latest Claude 3 models with 200K context
   ✅ Advanced reasoning capabilities  
   ✅ AWS infrastructure reliability
   ✅ Pay-per-use pricing model
`;