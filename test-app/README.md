# Test Application for SpotLag.AI Performance Analysis

## 🚨 **WARNING: This Application Contains Intentional Performance Issues**

This test application has been specifically designed with multiple performance problems to demonstrate the code-level analysis capabilities of the SpotLag.AI Performance Insights platform.

## 🎯 **Purpose**

This application serves as a comprehensive test case to validate that our AI-powered performance analysis can:

1. **Identify specific performance bottlenecks** in both frontend and backend code
2. **Provide code-level suggestions** with exact file paths, functions, and line numbers
3. **Correlate performance metrics** with actual code patterns
4. **Generate actionable recommendations** for optimization

## 🏗️ **Architecture**

### **Backend (Node.js/Express)**
- **Location**: `test-app/backend/`
- **Port**: 3001
- **Database**: SQLite (test_app.db)
- **Key Features**: User authentication, meetings, calendar, resources, notifications, WebSocket

### **Frontend (React/Vite)**
- **Location**: `test-app/frontend/`
- **Port**: 3000
- **Framework**: React 18 with Vite
- **Key Features**: Dashboard, calendar, meetings, resources, profile, notifications

## 🚨 **Intentional Performance Issues**

### **Backend Performance Issues**

#### **1. Database Problems**
- **N+1 Query Pattern** (`server.js:85-120`)
  - `getUsersWithMeetings()` executes separate queries for each user
  - Each user triggers 3 additional queries (meetings, events, notifications)
  - **Expected Impact**: 300ms+ average response time

#### **2. Memory Leaks**
- **Global Variables** (`server.js:13-17`)
  - `globalUserCache`, `sessionData`, `notificationQueue` grow indefinitely
  - No cleanup mechanism implemented
  - **Expected Impact**: Memory usage increases over time

#### **3. Blocking Operations**
- **Synchronous Password Hashing** (`server.js:185`)
  - `bcrypt.hashSync()` in user registration and login
  - **Expected Impact**: Request blocking during authentication

#### **4. Heavy Computations in Request Handlers**
- **Complex Analytics Generation** (`server.js:300-500`)
  - Heavy loops and calculations in API responses
  - **Expected Impact**: High CPU usage, slow response times

#### **5. WebSocket Memory Leaks**
- **Connection Cleanup Issues** (`server.js:800-850`)
  - Connections not properly removed from `activeConnections`
  - Message history stored indefinitely
  - **Expected Impact**: Memory growth, WebSocket performance degradation

#### **6. No Caching Strategy**
- **Repeated Heavy Computations**
  - Same expensive operations repeated on every request
  - **Expected Impact**: Unnecessary CPU usage

### **Frontend Performance Issues**

#### **1. Unnecessary Re-renders**
- **Too Many State Variables** (`App.jsx:25-50`)
  - 20+ state variables causing cascade re-renders
  - **Expected Impact**: Poor FCP and LCP times

#### **2. Heavy Computations in Render**
- **Non-memoized Expensive Functions** (`App.jsx:55-85`)
  - `computeExpensiveData()` runs on every render
  - Nested loops with 100,000+ iterations
  - **Expected Impact**: Blocked main thread, poor user experience

#### **3. Memory Leaks**
- **Global Variables** (`App.jsx:8-12`)
  - `globalCache`, `userSessions`, `performanceData` grow indefinitely
  - **Expected Impact**: Memory consumption increases over time

#### **4. Inefficient Event Handlers**
- **Inline Functions** (`App.jsx:400-450`)
  - New function instances created on every render
  - Heavy validation on every keystroke
  - **Expected Impact**: High CPU usage during user interaction

#### **5. No Virtualization**
- **Large Lists Rendering** (`Dashboard.jsx:500-600`)
  - Rendering 1000+ items without virtualization
  - **Expected Impact**: Poor scrolling performance, high memory usage

#### **6. Heavy CSS Animations**
- **Complex Animations** (`index.css:50-100`)
  - Multiple transform and filter properties
  - **Expected Impact**: Layout thrashing, poor scrolling performance

#### **7. Large Bundle Size**
- **Unoptimized Imports**
  - Importing entire libraries instead of specific functions
  - **Expected Impact**: Poor initial page load times

#### **8. WebSocket Issues**
- **No Cleanup** (`App.jsx:150-200`)
  - WebSocket connections not closed properly
  - Heavy processing in message handlers
  - **Expected Impact**: Memory leaks, performance degradation

### **Component-Specific Issues**

#### **Dashboard Component** (`Dashboard.jsx`)
- Heavy metrics computation in render (lines 50-120)
- No memoization for expensive calculations
- Rendering all data without pagination/virtualization
- **Expected Impact**: Slow initial render, high memory usage

#### **Calendar Component** (`Calendar.jsx`)
- Massive calendar data generation (lines 20-80)
- Event processing without optimization
- **Expected Impact**: Calendar view switching delays

#### **Profile Component** (`Profile.jsx`)
- Heavy user analytics generation
- Large social connections processing
- **Expected Impact**: Profile page load delays

## 🔧 **Setup Instructions**

### **Prerequisites**
- Node.js 16+ 
- npm or yarn

### **Backend Setup**
```bash
cd test-app/backend
npm install
npm start
```
**Server runs on**: http://localhost:3001

### **Frontend Setup**
```bash
cd test-app/frontend
npm install
npm run dev
```
**Application runs on**: http://localhost:3000

### **Demo Credentials**
- **Username**: `user1`
- **Password**: `password123`

## 📊 **Expected Performance Metrics**

When running performance tests against this application, you should observe:

### **Response Time Degradation**
- **Login API**: 2-5 seconds (due to heavy computation)
- **Users API**: 5-10 seconds (due to N+1 queries)
- **Dashboard API**: 3-8 seconds (due to heavy processing)

### **Frontend Performance**
- **FCP (First Contentful Paint)**: 3-6 seconds
- **LCP (Largest Contentful Paint)**: 5-10 seconds
- **TTI (Time to Interactive)**: 8-15 seconds
- **Memory Usage**: Continuously increasing

### **Resource Utilization**
- **CPU Usage**: 60-90% during heavy operations
- **Memory Usage**: 500MB+ for backend, 200MB+ for frontend
- **Database**: Multiple query execution spikes

## 🎯 **Testing with SpotLag.AI**

1. **Generate Performance Reports**
   - Use K6, Lighthouse, or similar tools
   - Create baseline and current performance reports

2. **Upload to SpotLag.AI**
   - Upload performance reports to the analysis platform
   - Include source code files for code-level analysis

3. **Validate AI Suggestions**
   - Check if AI identifies the specific performance issues listed above
   - Verify that recommendations include exact file paths and function names
   - Confirm that suggested fixes address the root causes

## 🔍 **Expected AI Insights**

The AI should identify and provide specific fixes for:

1. **N+1 Query Issue**: Suggest JOIN queries or data loader patterns
2. **Memory Leaks**: Recommend cleanup functions and proper state management
3. **Heavy Render Computations**: Suggest useMemo, useCallback, React.memo
4. **Database Optimization**: Recommend indexing, query optimization
5. **Bundle Optimization**: Suggest code splitting, tree shaking
6. **WebSocket Cleanup**: Recommend proper connection management

## 📝 **Performance Issue Categories**

- **🔴 Critical (P1)**: Memory leaks, N+1 queries, blocking operations
- **🟡 High (P2)**: Heavy render computations, no virtualization
- **🟠 Medium (P3)**: CSS animations, large bundle size
- **🟢 Low (P4)**: Code organization, minor optimizations

## 🚀 **Success Criteria**

The SpotLag.AI analysis is successful if it can:

1. ✅ **Identify specific performance issues** with file paths and line numbers
2. ✅ **Provide actionable code fixes** with before/after examples
3. ✅ **Correlate performance metrics** with actual code problems
4. ✅ **Prioritize issues** based on business impact
5. ✅ **Suggest architectural improvements** for long-term optimization

---

**Note**: This application is designed for testing purposes only. Do not use patterns from this codebase in production applications.
