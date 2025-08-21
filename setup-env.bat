@echo off
echo Creating .env.local with OpenRouter configuration...

(
echo # AI Performance Insights - Frontend Configuration
echo.
echo # === PRIMARY: OpenRouter Configuration (Free Models Only) ===
echo VITE_OPENROUTER_API_KEY=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
echo VITE_SITE_URL=http://localhost:5173
echo VITE_SITE_NAME=Performance Insights Dashboard
echo VITE_PRIMARY_MODEL=deepseek/deepseek-chat-v3-0324:free
echo.
echo # === Backend API Configuration ===
echo VITE_AI_API_BASE_URL=http://localhost:3001/api
echo VITE_API_SECRET_KEY=dev-secure-api-key-for-performance-insights-2025
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
echo OPENROUTER_API_KEY=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
echo PRIMARY_MODEL=deepseek/deepseek-chat-v3-0324:free
echo SITE_URL=http://localhost:5173
echo SITE_NAME=Performance Insights Dashboard
echo.
echo # === Server Configuration ===
echo PORT=3001
echo FRONTEND_URL=http://localhost:5173
echo API_SECRET_KEY=dev-secure-api-key-for-performance-insights-2025
echo.
echo # === Environment ===
echo NODE_ENV=development
echo.
echo # === Important: No OpenAI API Key - Using Free Models Only ===
echo # OPENAI_API_KEY is intentionally left empty to force free model usage
) > ai-api-server\.env

echo.
echo ✅ Environment files created successfully!
echo 🌟 OpenRouter API key configured for free models
echo 🚫 OpenAI disabled to prevent gpt-4o usage
echo.
echo Next steps:
echo 1. npm run dev  (to start frontend)
echo 2. Test with free models only
echo.
