@echo off
echo Creating .env.local with OpenRouter configuration...

(
echo # AI Performance Insights - Frontend Configuration
echo.
echo # === SECURE: All AI Processing via Backend Only ===
echo # VITE_OPENROUTER_API_KEY is no longer needed - backend handles all AI API calls securely
echo VITE_SITE_URL=http://localhost:5173
echo VITE_SITE_NAME=Performance Insights Dashboard
echo VITE_PRIMARY_MODEL=deepseek/deepseek-chat-v3-0324:free
echo.
echo # === Backend API Configuration ===
echo VITE_AI_API_BASE_URL=http://localhost:3001/api
echo VITE_API_SECRET_KEY=generate_secure_random_key_here_minimum_32_chars
echo VITE_AI_API_TIMEOUT=30000
echo.
echo # === Feature Flags ===
echo VITE_AI_ANOMALY_DETECTION=true
echo VITE_AI_SMART_SUGGESTIONS=true
echo VITE_AI_ROOT_CAUSE=true
echo VITE_AI_PREDICTIONS=true
echo VITE_AI_NATURAL_LANGUAGE=true
echo.
echo # === Development Settings ===
echo VITE_AI_DEBUG=true
echo.
echo # Note: Using OpenRouter with free models only - no paid models like gpt-4o
) > .env.local

echo Creating ai-api-server/.env with OpenRouter configuration...

(
echo # AI Performance Insights Backend Configuration
echo.
echo # === PRIMARY: OpenRouter Configuration (Free Models Only) ===
echo OPENROUTER_API_KEY=your_openrouter_api_key_here
echo PRIMARY_MODEL=deepseek/deepseek-chat-v3-0324:free
echo SITE_URL=http://localhost:5173
echo SITE_NAME=Performance Insights Dashboard
echo.
echo # === Server Configuration ===
echo PORT=3001
echo FRONTEND_URL=http://localhost:5173
echo API_SECRET_KEY=generate_secure_random_key_here_minimum_32_chars
echo.
echo # === Environment ===
echo NODE_ENV=development
echo.
echo # === Important: No OpenAI API Key - Using Free Models Only ===
echo # OPENAI_API_KEY is intentionally left empty to force free model usage
) > ai-api-server\.env

echo.
echo ✅ Environment files created successfully!
echo.
echo ⚠️  SECURITY NOTICE: Replace placeholder values with your actual API keys
echo 🔑 Backend OpenRouter API key: https://openrouter.ai/keys
echo 🛡️  Generate secure random API_SECRET_KEY (32+ characters)
echo 🔒 All AI processing now secure via backend only - no frontend API key exposure!
echo 🚫 OpenAI disabled to prevent gpt-4o usage
echo.
echo Next steps:
echo 1. npm run dev  (to start frontend)
echo 2. Test with free models only
echo.
