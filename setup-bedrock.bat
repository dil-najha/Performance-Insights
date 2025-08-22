@echo off
echo Setting up Amazon Bedrock Performance Insights...

echo.
echo 🏆 Amazon Bedrock AI Setup
echo ===========================

echo Creating frontend configuration (.env.local)...
(
echo # Amazon Bedrock Performance Insights - Frontend Configuration
echo.
echo # === AWS Bedrock Configuration ===
echo VITE_BEDROCK_ENABLED=true
echo VITE_AWS_REGION=us-west-2
echo VITE_BEDROCK_MODEL=anthropic.claude-3-5-haiku-20241022-v1:0
echo.
echo # === Backend API Configuration ===
echo VITE_AI_API_BASE_URL=http://localhost:3001/api
echo VITE_API_SECRET_KEY=bedrock-performance-insights-2025
echo VITE_AI_API_TIMEOUT=60000
echo.
echo # === Feature Flags ===
echo VITE_AI_ANOMALY_DETECTION=true
echo VITE_AI_SMART_SUGGESTIONS=true
echo VITE_AI_ROOT_CAUSE=true
echo VITE_AI_PREDICTIONS=true
echo VITE_AI_NATURAL_LANGUAGE=true
) > .env.local

echo Creating backend configuration (ai-api-server/.env)...
(
echo # Amazon Bedrock Performance Insights - Backend Configuration
echo.
echo # === AWS Credentials (REPLACE WITH YOUR VALUES) ===
echo AWS_ACCESS_KEY_ID=AKIA...your_aws_access_key_id_here
echo AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
echo AWS_REGION=us-west-2
echo.
echo # === Server Configuration ===
echo PORT=3001
echo FRONTEND_URL=http://localhost:5173
echo API_SECRET_KEY=bedrock-performance-insights-2025
echo.
echo # === Environment ===
echo NODE_ENV=development
) > ai-api-server\.env

echo.
echo ✅ Environment files created successfully!
echo.
echo 🔧 NEXT STEPS:
echo.
echo 1. AWS Setup:
echo    • Go to AWS IAM Console
echo    • Create user with Bedrock permissions:
echo      - bedrock:InvokeModel
echo      - bedrock:ListModels
echo    • Generate Access Key and Secret
echo    • Update AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in ai-api-server\.env
echo.
echo 2. Install Dependencies:
echo    cd ai-api-server
echo    npm install
echo.
echo 3. Start Backend:
echo    npm run start
echo.
echo 4. Test Health:
echo    curl http://localhost:3001/health
echo.
echo 5. Start Frontend:
echo    npm run dev
echo.
echo 💡 Available Models:
echo    • Claude 3 Haiku   (Fast, cost-effective)
echo    • Claude 3 Sonnet  (Balanced performance)
echo    • Claude 3 Opus    (Highest capability)
echo.
echo 📋 Required AWS Permissions:
echo    {
echo      "Version": "2012-10-17",
echo      "Statement": [
echo        {
echo          "Effect": "Allow",
echo          "Action": [
echo            "bedrock:InvokeModel",
echo            "bedrock:ListModels"
echo          ],
echo          "Resource": "*"
echo        }
echo      ]
echo    }
echo.
echo 🚀 Ready to analyze performance with AWS Bedrock!
echo.
