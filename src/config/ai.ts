// AI Configuration and Environment Variables
export const AI_CONFIG = {
  // OpenAI Configuration
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    baseUrl: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '2000'),
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
  }
};

// Environment validation
export function validateAIConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (AI_CONFIG.features.smartSuggestions && !AI_CONFIG.openai.apiKey) {
    errors.push('OpenAI API key is required for smart suggestions');
  }

  if (AI_CONFIG.api.timeout < 5000) {
    errors.push('API timeout should be at least 5 seconds');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Development setup instructions
export const SETUP_INSTRUCTIONS = `
🤖 AI Integration Setup Instructions:

1. Environment Variables (add to .env.local):
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   VITE_AI_API_BASE_URL=http://localhost:3001/api/ai
   VITE_OPENAI_MODEL=gpt-4
   
2. Optional Features:
   VITE_AI_ANOMALY_DETECTION=true
   VITE_AI_SMART_SUGGESTIONS=true
   VITE_AI_ROOT_CAUSE=true
   VITE_AI_PREDICTIONS=true

3. Backend API Server:
   - Set up Express.js server at localhost:3001
   - Implement /api/ai/* endpoints
   - Handle OpenAI API proxying for security

4. Local ML Models (optional):
   VITE_LOCAL_ML_ENABLED=true
   VITE_LOCAL_MODEL_PATH=/models
`;
