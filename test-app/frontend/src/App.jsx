import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';

// Import components (will be created next)
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import Meetings from './components/Meetings';
import Resources from './components/Resources';
import Profile from './components/Profile';
import Notifications from './components/Notifications';

// 🚨 PERFORMANCE ISSUE #1: Global variables causing memory leaks
let globalCache = {};
let userSessions = [];
let performanceData = [];
let heavyComputationResults = [];

function App() {
  // 🚨 PERFORMANCE ISSUE #2: Too many state variables causing excessive re-renders
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [resources, setResources] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [lastActivity, setLastActivity] = useState(new Date());
  const [systemStats, setSystemStats] = useState({});
  const [realtimeData, setRealtimeData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({});
  const [sortOptions, setSortOptions] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [selectedItems, setSelectedItems] = useState([]);
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // 🚨 PERFORMANCE ISSUE #3: Heavy computation in render (should be in useMemo)
  const computeExpensiveData = () => {
    console.log('🚨 Heavy computation running in render!');
    let result = 0;
    
    // Intentionally expensive computation
    for (let i = 0; i < 100000; i++) {
      for (let j = 0; j < 100; j++) {
        result += Math.sin(i) * Math.cos(j) * Math.tan(i + j);
      }
    }
    
    // More expensive operations
    const expensiveArray = [];
    for (let i = 0; i < 10000; i++) {
      expensiveArray.push({
        id: i,
        data: new Array(100).fill(0).map((_, idx) => ({
          nested: Math.random() * i * idx,
          moreNested: {
            value: Math.random() * 1000,
            computed: Math.sin(i) + Math.cos(idx),
            metadata: 'Heavy data '.repeat(50)
          }
        }))
      });
    }
    
    return { result, expensiveArray, timestamp: new Date() };
  };

  // 🚨 ISSUE: This should be memoized but isn't
  const expensiveData = computeExpensiveData();

  // 🚨 PERFORMANCE ISSUE #4: WebSocket connection with memory leaks
  useEffect(() => {
    let ws;
    
    if (isAuthenticated) {
      ws = new WebSocket('ws://localhost:3001');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({ type: 'authenticate', token }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // 🚨 ISSUE: Heavy processing in WebSocket handler
        switch (data.type) {
          case 'notifications':
            // Process each notification individually (inefficient)
            data.data.forEach(notification => {
              // Heavy processing for each notification
              const processedNotification = {
                ...notification,
                processedAt: new Date(),
                heavyAnalytics: generateHeavyAnalytics(notification),
                recommendations: generateRecommendations(notification)
              };
              
              setNotifications(prev => [...prev, processedNotification]);
            });
            break;
            
          case 'system_stats':
            // 🚨 ISSUE: Updating multiple state variables rapidly
            setSystemStats(data.stats);
            setRealtimeData(prev => ({ ...prev, ...data.realtime }));
            
            // Store in global variable (memory leak)
            performanceData.push({
              timestamp: new Date(),
              stats: data.stats,
              memory: performance.memory || {}
            });
            break;
        }
      };
      
      // 🚨 ISSUE: No cleanup function, WebSocket connection leaked
    }
    
    // Missing: return () => { ws?.close(); }
  }, [isAuthenticated, token]);

  // 🚨 PERFORMANCE ISSUE #5: Heavy computation functions called in render
  function generateHeavyAnalytics(notification) {
    const analytics = {};
    
    // Expensive analytics computation
    for (let i = 0; i < 5000; i++) {
      analytics[`metric_${i}`] = {
        value: Math.random() * 1000,
        trend: Math.sin(i) * 100,
        forecast: new Array(30).fill(0).map((_, idx) => Math.random() * 100),
        metadata: {
          computed: Math.random() * i,
          nested: {
            deep: Math.random() * i * i,
            deeper: 'Analytics data '.repeat(20)
          }
        }
      };
    }
    
    return analytics;
  }

  function generateRecommendations(notification) {
    const recommendations = [];
    
    // Generate many recommendations
    for (let i = 0; i < 200; i++) {
      recommendations.push({
        id: i,
        type: 'performance',
        priority: Math.floor(Math.random() * 5) + 1,
        suggestion: `Performance recommendation ${i}`,
        impact: Math.random() * 100,
        effort: Math.random() * 10,
        details: 'Recommendation details '.repeat(30),
        relatedData: new Array(50).fill(0).map((_, idx) => ({
          id: idx,
          value: Math.random() * 1000,
          description: 'Related data '.repeat(10)
        }))
      });
    }
    
    return recommendations;
  }

  // 🚨 PERFORMANCE ISSUE #6: Authentication with heavy processing
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // 🚨 ISSUE: Heavy computation during login
      const loginMetrics = {};
      for (let i = 0; i < 10000; i++) {
        loginMetrics[`login_metric_${i}`] = Math.random() * i;
      }
      
      const response = await axios.post('/api/auth/login', { 
        username, 
        password,
        clientMetrics: loginMetrics // Sending unnecessary data
      });
      
      const { token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      // 🚨 ISSUE: Immediate heavy data loading after login
      await loadAllUserData();
      await loadSystemData();
      await loadAnalyticsData();
      
      // Store in global variables (memory leak)
      userSessions.push({
        user,
        loginTime: new Date(),
        metrics: loginMetrics,
        sessionData: new Array(1000).fill(0).map((_, i) => ({ 
          id: i, 
          data: 'Session data '.repeat(100) 
        }))
      });
      
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // 🚨 PERFORMANCE ISSUE #7: Loading all data at once without pagination
  const loadAllUserData = async () => {
    try {
      // Load all data simultaneously (inefficient)
      const [usersRes, meetingsRes, resourcesRes, notificationsRes, eventsRes] = await Promise.all([
        axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/meetings', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/resources', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/calendar/${user?.id}`, { 
          headers: { Authorization: `Bearer ${token}` },
          params: {
            startDate: moment().subtract(1, 'year').toISOString(),
            endDate: moment().add(1, 'year').toISOString()
          }
        })
      ]);

      // 🚨 ISSUE: Heavy processing of loaded data
      const processedUsers = usersRes.data.map(user => ({
        ...user,
        processedAt: new Date(),
        analytics: generateUserAnalytics(user),
        recommendations: generateUserRecommendations(user),
        socialGraph: generateSocialGraphData(user.id)
      }));

      const processedMeetings = meetingsRes.data.map(meeting => ({
        ...meeting,
        processedAt: new Date(),
        attendeeAnalytics: generateAttendeeAnalytics(meeting),
        resourceAnalytics: generateResourceAnalytics(meeting),
        timeAnalytics: generateTimeAnalytics(meeting)
      }));

      // Set all state at once (causing massive re-render)
      setUsers(processedUsers);
      setMeetings(processedMeetings);
      setResources(resourcesRes.data);
      setNotifications(notificationsRes.data);
      setCalendarEvents(eventsRes.data);

    } catch (error) {
      console.error('Failed to load user data:', error);
      setError('Failed to load data');
    }
  };

  // 🚨 PERFORMANCE ISSUE #8: Heavy analytics generation functions
  function generateUserAnalytics(user) {
    const analytics = {
      performance: {},
      behavior: {},
      engagement: {},
      productivity: {}
    };

    // Generate massive analytics data
    for (let category in analytics) {
      for (let i = 0; i < 1000; i++) {
        analytics[category][`metric_${i}`] = {
          value: Math.random() * 1000,
          trend: Math.random() * 100 - 50,
          history: new Array(365).fill(0).map(() => Math.random() * 100),
          forecast: new Array(90).fill(0).map(() => Math.random() * 100),
          metadata: {
            computed: Math.random() * i,
            category: category,
            details: 'Analytics details '.repeat(25)
          }
        };
      }
    }

    return analytics;
  }

  function generateUserRecommendations(user) {
    const recommendations = [];
    
    for (let i = 0; i < 500; i++) {
      recommendations.push({
        id: `rec_${i}`,
        type: ['performance', 'engagement', 'productivity'][Math.floor(Math.random() * 3)],
        priority: Math.floor(Math.random() * 5) + 1,
        title: `User Recommendation ${i}`,
        description: 'Recommendation description '.repeat(20),
        impact: Math.random() * 100,
        effort: Math.random() * 10,
        timeline: Math.floor(Math.random() * 30) + 1,
        relatedUsers: new Array(20).fill(0).map((_, idx) => ({
          id: user.id + idx,
          name: `Related User ${idx}`,
          relationship: Math.random()
        })),
        actionItems: new Array(15).fill(0).map((_, idx) => ({
          id: idx,
          action: `Action item ${idx}`,
          description: 'Action description '.repeat(15)
        }))
      });
    }

    return recommendations;
  }

  function generateSocialGraphData(userId) {
    const graph = {
      nodes: [],
      edges: [],
      communities: [],
      metrics: {}
    };

    // Generate massive social graph
    for (let i = 0; i < 2000; i++) {
      graph.nodes.push({
        id: i,
        userId: userId + i,
        attributes: {
          influence: Math.random(),
          connectivity: Math.random(),
          activity: Math.random(),
          metadata: 'Node metadata '.repeat(20)
        },
        history: new Array(100).fill(0).map((_, idx) => ({
          date: moment().subtract(idx, 'days').toISOString(),
          activity: Math.random() * 100,
          interactions: Math.floor(Math.random() * 50)
        }))
      });
    }

    for (let i = 0; i < 5000; i++) {
      graph.edges.push({
        id: i,
        source: Math.floor(Math.random() * 2000),
        target: Math.floor(Math.random() * 2000),
        weight: Math.random(),
        type: ['collaboration', 'communication', 'project'][Math.floor(Math.random() * 3)],
        metadata: {
          strength: Math.random(),
          frequency: Math.random() * 100,
          history: new Array(50).fill(0).map(() => Math.random())
        }
      });
    }

    return graph;
  }

  function generateAttendeeAnalytics(meeting) {
    // Heavy attendee processing
    return new Array(100).fill(0).map((_, i) => ({
      attendeeId: i,
      analytics: new Array(200).fill(0).map((_, j) => ({
        metric: `attendee_metric_${j}`,
        value: Math.random() * 1000,
        impact: Math.random() * 100
      }))
    }));
  }

  function generateResourceAnalytics(meeting) {
    // Heavy resource processing
    return new Array(50).fill(0).map((_, i) => ({
      resourceId: i,
      utilization: Math.random() * 100,
      efficiency: Math.random() * 100,
      cost: Math.random() * 1000,
      forecast: new Array(30).fill(0).map(() => Math.random() * 100),
      recommendations: new Array(20).fill(0).map((_, j) => ({
        suggestion: `Resource suggestion ${j}`,
        impact: Math.random() * 100
      }))
    }));
  }

  function generateTimeAnalytics(meeting) {
    // Heavy time analysis
    const analytics = {
      optimal: {},
      conflicts: [],
      suggestions: [],
      efficiency: {}
    };

    for (let i = 0; i < 200; i++) {
      analytics.suggestions.push({
        timeSlot: moment().add(i, 'hours').toISOString(),
        score: Math.random() * 100,
        conflicts: Math.floor(Math.random() * 10),
        reasoning: 'Time suggestion reasoning '.repeat(20)
      });
    }

    return analytics;
  }

  // 🚨 PERFORMANCE ISSUE #9: System data loading with heavy processing
  const loadSystemData = async () => {
    try {
      const systemResponse = await axios.get('/api/system/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Heavy system data processing
      const processedSystemData = {
        ...systemResponse.data,
        processedAt: new Date(),
        computedMetrics: generateSystemMetrics(),
        performanceAnalysis: generatePerformanceAnalysis(),
        recommendations: generateSystemRecommendations(),
        predictiveAnalytics: generatePredictiveAnalytics()
      };

      setSystemStats(processedSystemData);

      // Store in global cache (memory leak)
      globalCache.systemData = processedSystemData;

    } catch (error) {
      console.error('Failed to load system data:', error);
    }
  };

  function generateSystemMetrics() {
    const metrics = {};
    
    for (let i = 0; i < 10000; i++) {
      metrics[`system_metric_${i}`] = {
        value: Math.random() * 1000,
        unit: 'ms',
        threshold: Math.random() * 500,
        status: Math.random() > 0.7 ? 'warning' : 'normal',
        history: new Array(1000).fill(0).map(() => Math.random() * 1000),
        metadata: 'System metric metadata '.repeat(30)
      };
    }
    
    return metrics;
  }

  function generatePerformanceAnalysis() {
    const analysis = {
      bottlenecks: [],
      optimizations: [],
      predictions: [],
      trends: {}
    };

    // Generate bottleneck analysis
    for (let i = 0; i < 500; i++) {
      analysis.bottlenecks.push({
        id: i,
        component: `Component_${i}`,
        severity: Math.random() * 10,
        impact: Math.random() * 100,
        rootCause: 'Root cause analysis '.repeat(25),
        solution: 'Solution description '.repeat(20),
        timeline: Math.floor(Math.random() * 30),
        dependencies: new Array(10).fill(0).map((_, idx) => `Dependency_${idx}`)
      });
    }

    // Generate optimization suggestions
    for (let i = 0; i < 300; i++) {
      analysis.optimizations.push({
        id: i,
        type: 'performance',
        priority: Math.floor(Math.random() * 5) + 1,
        description: 'Optimization description '.repeat(30),
        expectedGain: Math.random() * 50,
        effort: Math.random() * 10,
        implementation: 'Implementation details '.repeat(25)
      });
    }

    return analysis;
  }

  function generateSystemRecommendations() {
    return new Array(1000).fill(0).map((_, i) => ({
      id: i,
      category: 'system',
      priority: Math.floor(Math.random() * 5) + 1,
      title: `System Recommendation ${i}`,
      description: 'System recommendation description '.repeat(20),
      impact: Math.random() * 100,
      implementation: 'Implementation guide '.repeat(25),
      alternatives: new Array(5).fill(0).map((_, idx) => ({
        option: `Alternative ${idx}`,
        pros: 'Pros description '.repeat(10),
        cons: 'Cons description '.repeat(10)
      }))
    }));
  }

  function generatePredictiveAnalytics() {
    const analytics = {
      performance: {},
      usage: {},
      capacity: {},
      incidents: {}
    };

    for (let category in analytics) {
      analytics[category] = {
        forecasts: new Array(365).fill(0).map((_, i) => ({
          date: moment().add(i, 'days').toISOString(),
          prediction: Math.random() * 100,
          confidence: Math.random(),
          factors: new Array(20).fill(0).map((_, j) => ({
            factor: `Factor_${j}`,
            impact: Math.random() * 10
          }))
        })),
        trends: new Array(12).fill(0).map((_, i) => ({
          month: moment().add(i, 'months').format('YYYY-MM'),
          trend: Math.random() * 50 - 25,
          seasonality: Math.sin(i / 12 * 2 * Math.PI) * 10
        }))
      };
    }

    return analytics;
  }

  // 🚨 PERFORMANCE ISSUE #10: Analytics data loading
  const loadAnalyticsData = async () => {
    try {
      // Load analytics for each user separately (N+1 problem)
      const analyticsPromises = users.map(async (user) => {
        const response = await axios.get(`/api/analytics/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Heavy processing for each user's analytics
        return {
          userId: user.id,
          analytics: response.data,
          processed: processUserAnalytics(response.data),
          recommendations: generateAnalyticsRecommendations(response.data)
        };
      });

      const analyticsResults = await Promise.all(analyticsPromises);
      
      // Store in global cache (memory leak)
      globalCache.analytics = analyticsResults;

    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  function processUserAnalytics(data) {
    // Heavy analytics processing
    const processed = {
      summary: {},
      detailed: {},
      comparisons: {},
      insights: []
    };

    // Generate summary analytics
    for (let i = 0; i < 500; i++) {
      processed.summary[`summary_${i}`] = Math.random() * 1000;
    }

    // Generate detailed analytics
    for (let i = 0; i < 2000; i++) {
      processed.detailed[`detail_${i}`] = {
        value: Math.random() * 1000,
        metadata: 'Detailed metadata '.repeat(20),
        breakdown: new Array(50).fill(0).map((_, idx) => ({
          component: `Component_${idx}`,
          value: Math.random() * 100
        }))
      };
    }

    return processed;
  }

  function generateAnalyticsRecommendations(data) {
    return new Array(200).fill(0).map((_, i) => ({
      id: i,
      type: 'analytics',
      recommendation: `Analytics recommendation ${i}`,
      confidence: Math.random(),
      impact: Math.random() * 100,
      details: 'Analytics recommendation details '.repeat(25)
    }));
  }

  // 🚨 PERFORMANCE ISSUE #11: Window resize handler without debouncing
  useEffect(() => {
    const handleResize = () => {
      // Heavy computation on every resize event
      const newSize = { width: window.innerWidth, height: window.innerHeight };
      
      // Expensive responsive calculations
      const layoutMetrics = calculateLayoutMetrics(newSize);
      const componentSizes = calculateComponentSizes(newSize);
      const responsiveBreakpoints = calculateResponsiveBreakpoints(newSize);
      
      setWindowSize(newSize);
      
      // Store in global arrays (memory leak)
      performanceData.push({
        type: 'resize',
        timestamp: new Date(),
        size: newSize,
        metrics: layoutMetrics,
        components: componentSizes,
        breakpoints: responsiveBreakpoints
      });
    };

    // 🚨 ISSUE: No debouncing, fires on every resize pixel
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function calculateLayoutMetrics(size) {
    // Expensive layout calculations
    const metrics = {};
    for (let i = 0; i < 1000; i++) {
      metrics[`layout_${i}`] = {
        width: size.width * Math.random(),
        height: size.height * Math.random(),
        ratio: (size.width / size.height) * Math.random(),
        area: size.width * size.height * Math.random(),
        complexity: Math.random() * 100
      };
    }
    return metrics;
  }

  function calculateComponentSizes(size) {
    return new Array(500).fill(0).map((_, i) => ({
      component: `Component_${i}`,
      width: size.width * Math.random(),
      height: size.height * Math.random(),
      position: {
        x: size.width * Math.random(),
        y: size.height * Math.random()
      },
      visibility: Math.random() > 0.3,
      zIndex: Math.floor(Math.random() * 1000)
    }));
  }

  function calculateResponsiveBreakpoints(size) {
    const breakpoints = {};
    const breakpointValues = [320, 480, 768, 1024, 1200, 1400, 1600, 1920];
    
    breakpointValues.forEach((bp, i) => {
      breakpoints[`bp_${bp}`] = {
        active: size.width >= bp,
        distance: Math.abs(size.width - bp),
        components: new Array(100).fill(0).map((_, j) => ({
          id: j,
          visible: Math.random() > 0.5,
          size: Math.random() * 100
        }))
      };
    });
    
    return breakpoints;
  }

  // 🚨 PERFORMANCE ISSUE #12: Unnecessary effects and watchers
  useEffect(() => {
    // Heavy computation on every state change
    if (user) {
      const userMetrics = generateUserActivityMetrics();
      const sessionData = generateSessionData();
      const behaviorAnalytics = generateBehaviorAnalytics();
      
      // Store in global variables
      heavyComputationResults.push({
        timestamp: new Date(),
        user: user.id,
        metrics: userMetrics,
        session: sessionData,
        behavior: behaviorAnalytics
      });
    }
  }, [user, meetings, resources, notifications, calendarEvents, theme, language, timezone]);

  function generateUserActivityMetrics() {
    const metrics = {};
    for (let i = 0; i < 5000; i++) {
      metrics[`activity_${i}`] = Math.random() * 1000;
    }
    return metrics;
  }

  function generateSessionData() {
    return {
      duration: Date.now() - (localStorage.getItem('sessionStart') || Date.now()),
      interactions: new Array(1000).fill(0).map((_, i) => ({
        type: 'interaction',
        timestamp: new Date(),
        data: 'Interaction data '.repeat(20)
      })),
      navigation: new Array(500).fill(0).map((_, i) => ({
        path: `/path/${i}`,
        timestamp: new Date(),
        duration: Math.random() * 5000
      }))
    };
  }

  function generateBehaviorAnalytics() {
    return {
      patterns: new Array(200).fill(0).map((_, i) => ({
        pattern: `Pattern_${i}`,
        frequency: Math.random() * 100,
        significance: Math.random() * 10,
        predictions: new Array(30).fill(0).map(() => Math.random())
      })),
      preferences: new Array(100).fill(0).map((_, i) => ({
        preference: `Pref_${i}`,
        value: Math.random(),
        confidence: Math.random()
      }))
    };
  }

  // 🚨 PERFORMANCE ISSUE #13: Inefficient logout with heavy cleanup
  const logout = () => {
    // Heavy logout processing
    const logoutMetrics = generateLogoutMetrics();
    const sessionSummary = generateSessionSummary();
    
    // Clear all state (causing multiple re-renders)
    setUser(null);
    setUsers([]);
    setMeetings([]);
    setResources([]);
    setNotifications([]);
    setCalendarEvents([]);
    setSystemStats({});
    setRealtimeData({});
    setIsAuthenticated(false);
    setToken(null);
    
    localStorage.removeItem('token');
    
    // Store logout data in global variables (memory leak)
    userSessions.push({
      type: 'logout',
      timestamp: new Date(),
      metrics: logoutMetrics,
      summary: sessionSummary
    });
  };

  function generateLogoutMetrics() {
    const metrics = {};
    for (let i = 0; i < 3000; i++) {
      metrics[`logout_${i}`] = Math.random() * 1000;
    }
    return metrics;
  }

  function generateSessionSummary() {
    return {
      totalTime: Math.random() * 10000,
      interactions: Math.floor(Math.random() * 1000),
      pagesVisited: Math.floor(Math.random() * 100),
      dataProcessed: Math.random() * 1000000,
      analytics: new Array(500).fill(0).map((_, i) => ({
        metric: `session_metric_${i}`,
        value: Math.random() * 1000
      }))
    };
  }

  // 🚨 PERFORMANCE ISSUE #14: Navigation component with heavy rendering
  const NavigationBar = () => {
    // Heavy computation in component render
    const navigationMetrics = useMemo(() => {
      console.log('🚨 Computing navigation metrics (expensive!)');
      const metrics = {};
      for (let i = 0; i < 2000; i++) {
        metrics[`nav_${i}`] = Math.sin(i) * Math.cos(i) * Math.tan(i);
      }
      return metrics;
    }, [user, activeTab, windowSize]); // Too many dependencies causing frequent recalculation

    return (
      <nav className="navigation">
        <div className="nav-brand">
          <h1>Test App 🚨</h1>
          <span className="performance-warning">Performance Issues Demo</span>
        </div>
        <div className="nav-links">
          {/* 🚨 ISSUE: Inline onClick handlers creating new functions on every render */}
          <Link to="/dashboard" onClick={() => setActiveTab('dashboard')}>
            Dashboard ({navigationMetrics.nav_0?.toFixed(2)})
          </Link>
          <Link to="/calendar" onClick={() => setActiveTab('calendar')}>
            Calendar ({navigationMetrics.nav_1?.toFixed(2)})
          </Link>
          <Link to="/meetings" onClick={() => setActiveTab('meetings')}>
            Meetings ({navigationMetrics.nav_2?.toFixed(2)})
          </Link>
          <Link to="/resources" onClick={() => setActiveTab('resources')}>
            Resources ({navigationMetrics.nav_3?.toFixed(2)})
          </Link>
          <Link to="/notifications" onClick={() => setActiveTab('notifications')}>
            Notifications ({notifications.length})
          </Link>
          <Link to="/profile" onClick={() => setActiveTab('profile')}>
            Profile ({navigationMetrics.nav_4?.toFixed(2)})
          </Link>
        </div>
        <div className="nav-actions">
          <span>User: {user?.username}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </nav>
    );
  };

  // 🚨 PERFORMANCE ISSUE #15: Login form component with heavy validation
  const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    // 🚨 ISSUE: Heavy validation on every keystroke
    const validateForm = (usernameVal, passwordVal) => {
      console.log('🚨 Heavy form validation running...');
      
      const errors = {};
      const validationRules = generateValidationRules(); // Expensive
      const securityChecks = performSecurityChecks(usernameVal, passwordVal); // Expensive
      const complexityAnalysis = analyzeComplexity(passwordVal); // Expensive
      
      // Heavy validation logic
      for (let i = 0; i < 1000; i++) {
        const rule = validationRules[i % validationRules.length];
        if (!rule.test(usernameVal, passwordVal)) {
          errors[`rule_${i}`] = rule.message;
        }
      }
      
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    };

    function generateValidationRules() {
      return new Array(500).fill(0).map((_, i) => ({
        id: i,
        test: (user, pass) => Math.random() > 0.1, // Random validation
        message: `Validation rule ${i} failed`,
        complexity: Math.random() * 10
      }));
    }

    function performSecurityChecks(username, password) {
      const checks = {};
      for (let i = 0; i < 200; i++) {
        checks[`security_${i}`] = {
          passed: Math.random() > 0.2,
          risk: Math.random() * 10,
          details: 'Security check details '.repeat(15)
        };
      }
      return checks;
    }

    function analyzeComplexity(password) {
      const analysis = {
        entropy: 0,
        patterns: [],
        strength: 0,
        suggestions: []
      };

      // Heavy complexity analysis
      for (let i = 0; i < password.length; i++) {
        for (let j = 0; j < 100; j++) {
          analysis.entropy += Math.sin(password.charCodeAt(i) * j) * Math.cos(i * j);
        }
      }

      // Generate suggestions
      for (let i = 0; i < 50; i++) {
        analysis.suggestions.push({
          suggestion: `Password suggestion ${i}`,
          impact: Math.random() * 10,
          details: 'Suggestion details '.repeat(10)
        });
      }

      return analysis;
    }

    const handleSubmit = (e) => {
      e.preventDefault();
      if (validateForm(username, password)) {
        login(username, password);
      }
    };

    return (
      <div className="login-container">
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Login to Test App</h2>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                validateForm(e.target.value, password); // 🚨 ISSUE: Validating on every keystroke
              }}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validateForm(username, e.target.value); // 🚨 ISSUE: Validating on every keystroke
              }}
              className="form-input"
            />
          </div>
          {Object.keys(validationErrors).length > 0 && (
            <div className="validation-errors">
              {/* 🚨 ISSUE: Rendering all validation errors */}
              {Object.entries(validationErrors).map(([key, error]) => (
                <div key={key} className="error">{error}</div>
              ))}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <div className="demo-credentials">
            <p>Demo credentials: user1 / password123</p>
          </div>
        </form>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  };

  // 🚨 PERFORMANCE ISSUE #16: Main render with heavy conditional logic
  if (!isAuthenticated) {
    return (
      <div className="app">
        <LoginForm />
        {/* 🚨 ISSUE: Heavy background processing even when logged out */}
        <div style={{ display: 'none' }}>
          {computeExpensiveData().result} {/* This still runs! */}
        </div>
      </div>
    );
  }

  // 🚨 PERFORMANCE ISSUE #17: Heavy render logic for authenticated users
  const renderMainContent = () => {
    // Heavy computation in render function
    const contentMetrics = {};
    for (let i = 0; i < 5000; i++) {
      contentMetrics[`content_${i}`] = Math.random() * 1000;
    }

    return (
      <div className="main-content">
        <div className="sidebar">
          <div className="user-info">
            <img src={user.avatar || '/default-avatar.png'} alt="Avatar" className="user-avatar" />
            <h3>{user.username}</h3>
            <p>Performance Metrics: {Object.keys(contentMetrics).length}</p>
          </div>
          
          {/* 🚨 ISSUE: Heavy sidebar content that recalculates on every render */}
          <div className="sidebar-metrics">
            {Object.entries(contentMetrics).slice(0, 10).map(([key, value]) => (
              <div key={key} className="metric-item">
                {key}: {value.toFixed(2)}
              </div>
            ))}
          </div>
          
          <div className="quick-stats">
            <div>Users: {users.length}</div>
            <div>Meetings: {meetings.length}</div>
            <div>Resources: {resources.length}</div>
            <div>Notifications: {notifications.length}</div>
            <div>Events: {calendarEvents.length}</div>
            <div>Window: {windowSize.width}x{windowSize.height}</div>
          </div>
        </div>

        <div className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <div className="app">
        <NavigationBar />
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading heavy data...</p>
          </div>
        )}
        {error && (
          <div className="error-banner">
            <p>Error: {error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        {renderMainContent()}
        
        {/* 🚨 ISSUE: Hidden expensive computations */}
        <div style={{ display: 'none' }}>
          <div>Expensive Data: {JSON.stringify(expensiveData).length} chars</div>
          <div>Global Cache Size: {Object.keys(globalCache).length}</div>
          <div>User Sessions: {userSessions.length}</div>
          <div>Performance Data: {performanceData.length}</div>
          <div>Heavy Results: {heavyComputationResults.length}</div>
        </div>
      </div>
    </Router>
  );
}

export default App;
