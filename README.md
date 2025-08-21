# 🚀 Performance Insights Dashboard - Production Ready

A sophisticated AI-powered performance testing dashboard that provides comprehensive analysis, historical tracking, and actionable insights for your performance metrics.

## ✨ Features

### 🔍 **Advanced Analysis**
- **Dual Analysis Modes**: Traditional rule-based + AI-powered insights
- **Smart Metric Detection**: Automatic better-when detection (higher/lower)
- **Statistical Anomaly Detection**: ML-based outlier identification
- **Root Cause Analysis**: Correlation analysis between metrics

### 🤖 **AI Capabilities**
- **GPT-4 Integration**: Context-aware optimization recommendations
- **Performance Predictions**: Trend-based forecasting
- **Natural Language Explanations**: Human-readable insights
- **System Context Awareness**: Environment and stack-specific suggestions

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
│   │   ├── components/         # UI Components
│   │   ├── services/          # API Communication
│   │   ├── utils/             # Utilities & Logic
│   │   └── types.ts           # TypeScript Definitions
│   └── public/sample/         # Sample Data
├── 🔧  Backend (Node.js/Express)
│   ├── server.js              # Main API Server
│   ├── data/                  # Historical Storage
│   └── .env                   # Configuration
└── 📚  Documentation
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

### **Option 3: Manual Setup**
```bash
# Install dependencies
npm run install:all

# Start both servers
npm run start:dev

# Or start individually:
# Backend: cd ai-api-server && npm start
# Frontend: npm run dev
```

## 🔧 **Configuration**

### **Environment Setup**

1. **Backend Configuration** (`ai-api-server/.env`):
```bash
# API Security
API_SECRET_KEY=your-secure-api-key-here

# OpenAI Integration
OPENAI_API_KEY=your-openai-api-key

# Server Settings
PORT=3001
FRONTEND_URL=http://localhost:5173
```

2. **Frontend Configuration** (`.env.local`):
```bash
# Backend Connection
VITE_AI_API_BASE_URL=http://localhost:3001/api
VITE_API_SECRET_KEY=your-secure-api-key-here

# Feature Flags
VITE_AI_SMART_SUGGESTIONS=true
VITE_AI_HISTORICAL_DATA=true
```

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
- **Historical Reports**: View and reload past analyses
- **Export Options**: Download results as CSV/JSON
- **Real-time Insights**: Automatic analysis on data changes

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
- **Response Times**: avg, p95, p99, latency
- **Throughput**: requests/second, transactions/second
- **Error Rates**: failures, errors percentages
- **Resources**: CPU, memory utilization
- **Custom Metrics**: Any numeric performance indicator

### **Automatic Classification**
- **Lower is Better**: Response times, latency, error rates, resource usage
- **Higher is Better**: Throughput, success rates, performance scores

## 🚨 **Troubleshooting**

### **Common Issues**

1. **AI Analysis Failing**
   - Check OpenAI API key in backend `.env`
   - Verify API quota and rate limits
   - Falls back to basic analysis automatically

2. **Backend Connection Issues**
   - Ensure backend server is running on port 3001
   - Check CORS configuration in backend
   - Verify API secret key matches between frontend/backend

3. **Historical Data Not Loading**
   - Check backend data directory permissions
   - Verify API authentication
   - Historical data builds up after running analyses

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
- **Frontend**: React 18, TypeScript, TailwindCSS, DaisyUI
- **Backend**: Node.js, Express, OpenAI API
- **Charts**: Recharts
- **Build**: Vite

## 📄 **License**

MIT License - see LICENSE file for details.

## 🔗 **Links**

- **Live Demo**: http://localhost:5173 (after setup)
- **API Health Check**: http://localhost:3001/health
- **Documentation**: See AI-INTEGRATION-GUIDE.md

---

**Ready to optimize your performance!** 🚀

