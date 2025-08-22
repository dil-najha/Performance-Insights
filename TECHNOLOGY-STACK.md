# 🏗️ Technology Stack - Amazon Bedrock Performance Insights

## 🎯 **Clean Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Frontend      │◄──►│   Backend API    │◄──►│  Amazon Bedrock  │
│   (React SPA)   │    │  (Node.js API)   │    │   (Claude 3.5)   │
└─────────────────┘    └──────────────────┘    └──────────────────┘
```

## 🚀 **Core Technologies**

### **Frontend Stack**
| Technology | Version | Purpose | Category |
|------------|---------|---------|----------|
| **React** | ^18.3.1 | UI Framework | Frontend |
| **TypeScript** | ^5.6.2 | Type Safety | Language |
| **Vite** | ^5.4.19 | Build Tool | Development |
| **TailwindCSS** | ^3.4.16 | Styling | UI |
| **DaisyUI** | ^4.12.24 | Component Library | UI |
| **Recharts** | ^2.13.3 | Data Visualization | Charts |

### **Backend Stack**
| Technology | Version | Purpose | Category |
|------------|---------|---------|----------|
| **Node.js** | Latest | Runtime Environment | Backend |
| **Express.js** | ^5.1.0 | Web Framework | API |
| **AWS SDK** | ^3.705.0 | Bedrock Integration | AI |
| **Helmet.js** | ^7.2.0 | Security Middleware | Security |
| **CORS** | ^2.8.5 | Cross-Origin Resource Sharing | Security |
| **Express Rate Limit** | ^7.5.1 | Rate Limiting | Security |

### **AI Integration**
| Technology | Purpose | Tier |
|------------|---------|------|
| **AWS Bedrock** | Enterprise AI Platform | Primary |
| **Claude 3.5 Haiku** | Fast Performance Analysis | Default |
| **Claude 3 Sonnet** | Balanced Analysis | Alternative |
| **Claude 3 Opus** | Complex Analysis | Advanced |

## 📊 **Architecture Patterns**

### **Frontend Architecture**
```
src/
├── components/          # React components
├── services/            # API communication  
├── utils/               # Helper functions
└── config/              # Configuration
```

### **Backend Architecture**
```
ai-api-server/
├── server.js            # Express server (ES modules)
└── data/                # Historical reports storage
```

## 🔐 **Security Features**

- **Bearer Token Authentication**: API key-based access
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS Protection**: Configured origins only
- **AWS IAM**: Bedrock permissions

## 🎯 **Key Features**

- **AI-Powered Analysis**: Bedrock Claude models
- **Performance Comparison**: Baseline vs current
- **Interactive Charts**: Recharts visualizations
- **Enterprise Security**: AWS integration
- **Historical Data**: Persistent storage

---

**Status**: Production Ready 🚀  
**Architecture**: Clean Bedrock-only implementation
