// AI Configuration and Environment Variables
export const AI_CONFIG = {
  // OpenRouter Configuration (Primary)
  openrouter: {
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
    baseUrl: 'https://openrouter.ai/api/v1',
    siteUrl: import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
    siteName: import.meta.env.VITE_SITE_NAME || 'Performance Insights Dashboard',
    primaryModel: import.meta.env.VITE_PRIMARY_MODEL || 'deepseek/deepseek-chat-v3-0324:free',
    freeModels: [
      {
        id: 'deepseek/deepseek-chat-v3-0324:free',
        name: 'DeepSeek V3 (Free)',
        description: 'Advanced reasoning model, excellent for analysis',
        provider: 'DeepSeek',
        tier: 'free'
      },
      {
        id: 'deepseek/deepseek-r1-0528:free',
        name: 'DeepSeek R1 (Free)',
        description: 'Latest reasoning model with enhanced capabilities',
        provider: 'DeepSeek',
        tier: 'free'
      },
      {
        id: 'google/gemini-2.0-flash-exp:free',
        name: 'Gemini 2.0 Flash (Free)',
        description: 'Fast and efficient Google model',
        provider: 'Google',
        tier: 'free'
      },
      {
        id: 'google/gemma-3-27b-it:free',
        name: 'Gemma 3 27B (Free)',
        description: 'Large context Google model',
        provider: 'Google',
        tier: 'free'
      },
      {
        id: 'google/gemma-3n-e2b-it:free',
        name: 'Gemma 3N E2B (Free)',
        description: 'Optimized Google model for efficiency',
        provider: 'Google',
        tier: 'free'
      },
      {
        id: 'openai/gpt-oss-20b:free',
        name: 'GPT OSS 20B (Free)',
        description: 'Open source style GPT model',
        provider: 'OpenAI',
        tier: 'free'
      },
      {
        id: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
        name: 'DeepSeek R1 Qwen (Free)',
        description: 'Hybrid reasoning model with Qwen base',
        provider: 'DeepSeek',
        tier: 'free'
      }
    ],
    fallbackModels: [
      'deepseek/deepseek-chat-v3-0324:free',
      'google/gemini-2.0-flash-exp:free',
      'deepseek/deepseek-r1-0528:free',
      'google/gemma-3-27b-it:free'
    ],
    maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '15000'),
    temperature: 0.3
  },

  // OpenAI Configuration (Disabled - Using Free Models Only)
  openai: {
    apiKey: '', // Disabled - using OpenRouter free models only
    baseUrl: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: 'deepseek/deepseek-chat-v3-0324:free', // Free alternative
    maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '15000'),
  },

  // Local ML Models (TensorFlow.js)
  local: {
    enabled: import.meta.env.VITE_LOCAL_ML_ENABLED === 'true',
    modelPath: import.meta.env.VITE_LOCAL_MODEL_PATH || '/models',
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
  },

  // Fallback Options
  fallback: {
    enableBasicAnalysis: true,
    enableStatisticalAnomaly: true,
    enableRuleBasedSuggestions: true,
  },


};

// Environment validation
export function validateAIConfig(): { 
  valid: boolean; 
  errors: string[]; 
  providers: {
    openrouter: boolean;
    openai: boolean;
    recommended: string;
  };
} {
  const errors: string[] = [];

  // Check for AI provider availability
  const hasOpenRouter = !!AI_CONFIG.openrouter.apiKey;
  const hasOpenAI = !!AI_CONFIG.openai.apiKey;
  
  if (AI_CONFIG.features.smartSuggestions && !hasOpenRouter && !hasOpenAI) {
    errors.push('Either OpenRouter or OpenAI API key is required for smart suggestions');
  }

  if (AI_CONFIG.api.timeout < 5000) {
    errors.push('API timeout should be at least 5 seconds');
  }

  return {
    valid: errors.length === 0,
    errors,
    providers: {
      openrouter: hasOpenRouter,
      openai: hasOpenAI,
      recommended: hasOpenRouter ? 'openrouter' : hasOpenAI ? 'openai' : 'none'
    }
  };
}

// Provider selection logic - Force OpenRouter for free models
export function getPreferredProvider(): 'openrouter' | 'openai' | 'local' {
  const validation = validateAIConfig();
  
  // Always prefer OpenRouter if API key is available (for free models)
  if (validation.providers.openrouter) {
    console.log('🌟 Using OpenRouter (free models available)');
    return 'openrouter';
  }
  
  // Fallback to local analysis (no paid models)
  console.log('🏠 No OpenRouter key - using local analysis');
  return 'local';
}

// Development setup instructions
export const SETUP_INSTRUCTIONS = `
🤖 AI Integration Setup Instructions:

1. Environment Variables (add to .env.local):
   
   🌟 RECOMMENDED: OpenRouter.ai (Multi-model access + cost control)
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
   VITE_SITE_URL=http://localhost:5173
   VITE_SITE_NAME="Performance Insights Dashboard"
   VITE_PRIMARY_MODEL=deepseek/deepseek-chat-v3-0324:free
   
   📦 OR: Direct OpenAI (Single provider)
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   
   🔧 Backend Configuration:
   VITE_AI_API_BASE_URL=http://localhost:3001/api/ai
   VITE_API_SECRET_KEY=your_secure_api_key
   
2. Feature Flags (optional):
   VITE_AI_ANOMALY_DETECTION=true
   VITE_AI_SMART_SUGGESTIONS=true
   VITE_AI_ROOT_CAUSE=true
   VITE_AI_PREDICTIONS=true

3. Backend API Server:
   - Set up Express.js server at localhost:3001
   - Configure OpenRouter/OpenAI API integration
   - Handle secure API proxying

4. OpenRouter Benefits:
   ✅ Cost controls & spending limits
   ✅ Multi-model fallback (OpenAI, Anthropic, Meta, Google)
   ✅ Enhanced security monitoring
   ✅ GitHub secret scanning integration

5. Local ML Models (fallback):
   VITE_LOCAL_ML_ENABLED=true
   VITE_LOCAL_MODEL_PATH=/models
`;
