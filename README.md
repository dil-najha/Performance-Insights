# 🚀 Performance Insights Dashboard - Production Ready

A sophisticated AI-powered performance testing dashboard that provides comprehensive analysis, historical tracking, and **code-level optimization recommendations** for your performance metrics.

## 🌟 **What Makes This Special**

### **🔬 Code-Level Performance Analysis**
- **First of its kind**: AI analyzes your source code to find performance bottlenecks
- **Specific Recommendations**: Get exact file paths, function names, and line numbers
- **Before/After Code Examples**: See optimized code suggestions 
- **Built-in Test Application**: Complete app with intentional performance issues for testing

### **🏆 Enterprise AI Integration**
- **AWS Bedrock Claude 3.5**: Latest enterprise AI models
- **Automated Code Loading**: Auto-analyzes test-app source code
- **Multiple Model Options**: Choose based on speed vs detail needs

### **📊 Real Performance Impact**
- **Business Metrics Translation**: Converts technical metrics to business impact
- **Critical Issue Prioritization**: P1-P5 system with severity scoring
- **Historical Trend Analysis**: Track performance improvements over time

## ✨ Features

### 🔍 **Advanced Analysis**
- **Dual Analysis Modes**: Traditional rule-based + AI-powered insights
- **Smart Metric Detection**: Automatic better-when detection (higher/lower)
- **Statistical Anomaly Detection**: ML-based outlier identification
- **Root Cause Analysis**: Correlation analysis between metrics

### 🤖 **AI Capabilities**
- **AWS Bedrock Integration**: Enterprise-grade Claude 3.5 models (Haiku, Sonnet, Opus)
- **Performance Analysis**: Context-aware optimization recommendations  
- **Root Cause Detection**: AI-driven issue identification
- **Code-Level Suggestions**: File-specific optimization recommendations with before/after code examples
- **Business Impact Assessment**: Stack and environment-specific insights
- **Test Application Analysis**: Built-in code analysis using the included test-app

### 📊 **Data Management**
- **Historical Reports**: Persistent storage and trending
- **Export Functionality**: CSV, JSON with full insights
- **Real-time Analysis**: Debounced API calls with caching
- **Sample Data**: Built-in examples for testing

### 🔒 **Production Security**
- **API Authentication**: Secure backend communication
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Schema validation for uploads
- **Error Boundaries**: Graceful failure handling

## 🏗️ **Architecture**

```
Performance-Insights/
├── 🖥️  Frontend (React/TypeScript)
│   ├── src/
│   │   ├── components/         # UI Components (includes CodeLevelSuggestions)
│   │   ├── services/          # AI Service Integration
│   │   ├── utils/             # Data Processing & Validation
│   │   ├── config/            # AI Model Configuration
│   │   └── types.ts           # TypeScript Definitions
│   └── public/
│       ├── sample/            # Sample Data
│       └── test-data/         # Test Application Data
├── 🔧  Backend (Node.js/Express)
│   ├── server.js              # Main API Server
│   ├── services/              # Code Analysis Services
│   ├── prompts/               # AI Prompt Templates
│   ├── utils/                 # Backend Validation
│   └── data/                  # Historical Storage
├── 🧪  Test Application (Demo)
│   ├── backend/               # Node.js with performance issues
│   ├── frontend/              # React with performance issues
│   └── README.md              # Performance issue documentation
└── 📚  Documentation & Setup
    ├── setup-bedrock.bat     # AWS Bedrock configuration
    ├── BEDROCK-IMPLEMENTATION.md
    └── K6-SUPPORT-GUIDE.md
```

## 🚀 **Quick Start**

### **Option 1: One-Click Start (Windows)**
```bash
# Double-click start.bat or run:
start.bat
```

### **Option 2: One-Click Start (Linux/Mac)**
```bash
chmod +x start.sh
./start.sh
```

### **Option 3: Quick AWS Bedrock Setup**
```bash
# Auto-configure environment files for AWS Bedrock:
setup-bedrock.bat  # (Windows)
# Then update AWS credentials in ai-api-server/.env
```

### **Option 3: Manual Setup**
```bash
# 1. Setup AWS Bedrock environment
setup-bedrock.bat  # Creates .env files (update with your AWS keys)

# 2. Install dependencies
npm run install:all

# 3. Start both servers
npm run start:dev

# Or start individually:
# Backend: cd ai-api-server && npm start
# Frontend: npm run dev

# 4. Optional: Start test application for code analysis
cd test-app && npm run start
```

### **⚡ Complete First-Time Setup**
```bash
# 1. Clone and setup
git clone <repository>
cd Performance-Insights

# 2. Configure AWS (creates .env files)
setup-bedrock.bat

# 3. Update AWS credentials in ai-api-server/.env
# AWS_ACCESS_KEY_ID=AKIA...your_key_here
# AWS_SECRET_ACCESS_KEY=your_secret_here

# 4. Install and start
npm run install:all
npm run start:dev

# ✅ Open http://localhost:5173 to use the dashboard
```

## 🔧 **Configuration**

### **Environment Setup**

**🚀 Quick Setup**: Use the automated setup script:
```bash
setup-bedrock.bat  # Creates both .env files with templates
```

1. **Backend Configuration** (`ai-api-server/.env`):
```bash
# AWS Bedrock Integration (REQUIRED)
AWS_ACCESS_KEY_ID=AKIA...your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=us-west-2

# API Security
API_SECRET_KEY=bedrock-performance-insights-2025
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

2. **Frontend Configuration** (`.env.local`):
```bash
# AWS Bedrock Configuration
VITE_BEDROCK_ENABLED=true
VITE_AWS_REGION=us-west-2
VITE_BEDROCK_MODEL=anthropic.claude-3-5-haiku-20241022-v1:0

# Backend Connection
VITE_AI_API_BASE_URL=http://localhost:3001/api
VITE_API_SECRET_KEY=bedrock-performance-insights-2025

# Feature Flags
VITE_AI_SMART_SUGGESTIONS=true
VITE_AI_HISTORICAL_DATA=true
```

**📝 Note**: Environment files don't exist by default - run `setup-bedrock.bat` or create them manually.

## 📋 **Usage Guide**

### **1. Upload Performance Reports**
```json
{
  "name": "Load Test Results",
  "timestamp": "2025-08-21T10:00:00Z",
  "metrics": {
    "responseTimeAvg": 150,
    "responseTimeP95": 240,
    "throughput": 460,
    "errorRate": 1.2,
    "cpu": 75,
    "memory": 950
  }
}
```

### **2. System Context Configuration**
- **Environment**: dev/staging/prod
- **Technology Stack**: Framework/language info
- **Scale**: small/medium/large

### **3. AI Analysis Features**
- **Toggle AI**: Switch between basic and AI-enhanced analysis
- **Code-Level Analysis**: Enable AI to analyze source code for specific optimization recommendations
- **Test Application**: Built-in demo app with intentional performance issues for testing
- **Historical Reports**: View and reload past analyses
- **Export Options**: Download results as CSV/JSON with code suggestions
- **Multiple AI Models**: Choose between Claude 3.5 Haiku (fast), Sonnet (balanced), or Opus (detailed)

### **4. Test Application for Code Analysis**
The platform includes a complete test application (`test-app/`) designed with intentional performance issues:

**🚨 Performance Issues Included:**
- **N+1 Database Queries** - Backend user data retrieval
- **Memory Leaks** - Global variables and improper cleanup
- **Heavy React Computations** - Unoptimized renders and calculations
- **Blocking Operations** - Synchronous file operations
- **Bundle Size Issues** - Unoptimized imports and large dependencies

**🎯 How to Use:**
1. Toggle "Code level suggestions" in the System Context panel
2. Upload any performance reports (will auto-analyze test-app code)
3. AI will provide specific file paths, function names, and code fixes
4. View detailed before/after code examples

**🔧 Test App Setup:**
```bash
cd test-app
npm run install:all  # Install both frontend & backend
npm run start        # Start both servers
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

## 🛠️ **API Endpoints**

### **Main Analysis**
```http
POST /api/ai/analyze
Authorization: Bearer your-api-key
Content-Type: application/json

{
  "baseline": {...},
  "current": {...},
  "systemContext": {...}
}
```

### **Historical Data**
```http
GET /api/reports/history?limit=20&offset=0
Authorization: Bearer your-api-key
```

### **Export Reports**
```http
POST /api/reports/export
Authorization: Bearer your-api-key
Content-Type: application/json

{
  "data": {...},
  "format": "csv" | "json"
}
```

## 🔍 **Performance Metrics**

### **Supported Metrics**
- **Core Web Vitals**: FCP, LCP, CLS, INP, TTFB (Google standards)
- **API Performance**: Response times (avg, p95, p99), HTTP request duration
- **User Experience**: Success rates, error rates, login/dashboard performance
- **System Resources**: CPU, memory, JS heap size utilization
- **Custom Business Metrics**: Any numeric KPI from your performance tests

### **Sample Data Included**
- **Default samples**: `public/sample/baseline.json` and `current.json`
- **Test-app data**: `public/test-data/test-app-baseline.json` and `test-app-current.json`
- **K6 format support**: Automatic detection and processing of K6 performance test outputs
- **Metric reduction**: Intelligently filters ~110 metrics down to ~25 critical business indicators

### **Automatic Classification**
- **Lower is Better**: Response times, latency, error rates, resource usage
- **Higher is Better**: Throughput, success rates, performance scores
- **Core Web Vitals**: Automatic Google standards compliance checking

## 🚨 **Troubleshooting**

### **Common Issues**

1. **AI Analysis Failing**
   - **Check AWS Bedrock credentials** in `ai-api-server/.env`
   - **Verify IAM permissions**: `bedrock:InvokeModel` required
   - **Run health check**: `curl http://localhost:3001/health`
   - Falls back to basic analysis automatically

2. **Code Analysis Not Working**
   - **Enable "Code level suggestions"** in System Context panel
   - **Test App Auto-Loading**: Enabled automatically when code analysis is on
   - **Check test-app structure**: Ensure `test-app/` directory exists
   - **File limits**: Max 100KB per file, 7 files analyzed

3. **Backend Connection Issues**
   - **Ensure backend server is running** on port 3001
   - **Check CORS configuration** in backend
   - **Verify API secret key matches**: `bedrock-performance-insights-2025`
   - **Environment files missing**: Run `setup-bedrock.bat`

4. **AWS Bedrock Setup Issues**
   - **Region availability**: Use `us-west-2` or `us-east-1`
   - **Model access**: Ensure Claude models are enabled in AWS console
   - **Credentials**: Use IAM user keys, not root account
   - **Rate limits**: Check AWS Bedrock quotas

### **Debug Mode**
Enable debug logging:
```bash
# Backend
LOG_LEVEL=debug

# Frontend  
VITE_DEBUG_MODE=true
```

## 📈 **Production Deployment**

### **Backend Deployment**
```bash
# Set production environment
NODE_ENV=production

# Generate secure API key
API_SECRET_KEY=$(openssl rand -base64 32)

# Configure CORS for your domain
ALLOWED_ORIGINS=https://your-domain.com
```

### **Frontend Build**
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### **Security Checklist**
- [ ] Change default API secret key
- [ ] Set up HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up API key rotation
- [ ] Monitor API usage and costs

## 🎯 **Use Cases**

### **Performance Regression Testing**
- Compare baseline vs current performance
- Identify performance degradations automatically
- Get specific recommendations for optimization

### **Continuous Performance Monitoring**
- Historical trend analysis
- Automated anomaly detection
- Predictive performance insights

### **Capacity Planning**
- Resource utilization trends
- Performance prediction modeling
- Scaling recommendations

### **DevOps Integration**
- CI/CD performance gates
- Automated performance reports
- Historical performance tracking

## 🤝 **Contributing**

### **Development Setup**
```bash
git clone <repository>
cd Performance-Insights
npm run install:all
npm run start:dev
```

### **Tech Stack**
- **Frontend**: React 18, TypeScript, TailwindCSS, DaisyUI, Recharts
- **Backend**: Node.js, Express, AWS Bedrock (Claude 3.5 models)
- **AI Integration**: AWS SDK v3, Bedrock Runtime API
- **Build Tools**: Vite, PostCSS, Autoprefixer
- **Testing**: Built-in test-app with intentional performance issues
- **Dependencies**: Concurrently for dev environment, rate limiting, CORS security

## 📄 **License**

MIT License - see LICENSE file for details.

## 🔗 **Links**

- **Main Dashboard**: http://localhost:5173 (after setup)
- **Test Application**: http://localhost:3000 (after test-app setup)
- **API Health Check**: http://localhost:3001/health
- **Bedrock Health**: http://localhost:3001/health/bedrock
- **Documentation**: 
  - `BEDROCK-IMPLEMENTATION.md` - AWS Setup Guide
  - `K6-SUPPORT-GUIDE.md` - K6 Integration
  - `test-app/README.md` - Test Application Guide

---

**Ready to optimize your performance!** 🚀

