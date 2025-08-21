#!/usr/bin/env node

// Setup AI Environment - Performance Insights Dashboard
// Run with: node setup-ai-environment.js

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🔧 Performance Insights - AI Environment Setup\n');

function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

async function setupEnvironment() {
  try {
    // Generate a secure API key
    const apiSecretKey = generateSecureKey(32);
    console.log('🔑 Generated secure API key');

    // Frontend environment file
    const frontendEnv = `# AI Performance Insights - Frontend Configuration

# === SECURE: All AI Processing via Backend Only ===
# No frontend API keys needed - backend handles all AI calls securely
VITE_SITE_URL=http://localhost:5173
VITE_SITE_NAME=Performance Insights Dashboard
VITE_PRIMARY_MODEL=deepseek/deepseek-chat-v3-0324:free

# === Backend API Configuration ===
VITE_AI_API_BASE_URL=http://localhost:3001/api
VITE_API_SECRET_KEY=${apiSecretKey}
VITE_AI_API_TIMEOUT=30000

# === Feature Flags ===
VITE_AI_ANOMALY_DETECTION=true
VITE_AI_SMART_SUGGESTIONS=true
VITE_AI_ROOT_CAUSE=true
VITE_AI_PREDICTIONS=true
VITE_AI_NATURAL_LANGUAGE=true

# === Development Settings ===
VITE_AI_DEBUG=true
`;

    // Backend environment file
    const backendEnv = `# AI Performance Insights Backend Configuration

# === PRIMARY: OpenRouter Configuration ===
# Get your API key from: https://openrouter.ai/keys
OPENROUTER_API_KEY=your_openrouter_api_key_here
PRIMARY_MODEL=deepseek/deepseek-chat-v3-0324:free
SITE_URL=http://localhost:5173
SITE_NAME=Performance Insights Dashboard

# === Server Configuration ===
PORT=3001
FRONTEND_URL=http://localhost:5173
API_SECRET_KEY=${apiSecretKey}

# === Environment ===
NODE_ENV=development

# === Important: No OpenAI API Key - Using Free Models Only ===
# OPENAI_API_KEY is intentionally left empty to force free model usage
`;

    // Write frontend .env.local
    fs.writeFileSync('.env.local', frontendEnv);
    console.log('✅ Created .env.local for frontend');

    // Write backend .env
    const backendDir = path.join(__dirname, 'ai-api-server');
    if (!fs.existsSync(backendDir)) {
      fs.mkdirSync(backendDir);
    }
    fs.writeFileSync(path.join(backendDir, '.env'), backendEnv);
    console.log('✅ Created ai-api-server/.env for backend');

    console.log('\n🎯 Next Steps:');
    console.log('1. Get your OpenRouter API key from: https://openrouter.ai/keys');
    console.log('2. Replace "your_openrouter_api_key_here" in ai-api-server/.env');
    console.log('3. Start the backend: cd ai-api-server && npm start');
    console.log('4. Start the frontend: npm run dev');
    console.log('5. Test AI functionality in the dashboard');

    console.log('\n🔒 Security:');
    console.log('• API keys are now properly separated');
    console.log('• Frontend does not expose any AI API keys');
    console.log('• Backend handles all AI processing securely');
    console.log('• Generated secure API_SECRET_KEY for frontend↔backend auth');

    console.log('\n🐛 Debug Tools:');
    console.log('• Run: node debug-ai-connection.js (to test connectivity)');
    console.log('• Check backend logs for AI processing status');
    console.log('• Check browser console for frontend errors');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupEnvironment();
