import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';

// 🚨 PERFORMANCE ISSUE #1: Global variables causing memory leaks
let dashboardCache = {};
let renderCounts = [];
let expensiveOperations = [];

const Dashboard = () => {
  // 🚨 PERFORMANCE ISSUE #2: Too many state variables
  const [dashboardData, setDashboardData] = useState({});
  const [metrics, setMetrics] = useState([]);
  const [charts, setCharts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [userActivity, setUserActivity] = useState([]);
  const [performanceStats, setPerformanceStats] = useState({});
  const [realTimeData, setRealTimeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [sortOptions, setSortOptions] = useState({ field: 'timestamp', order: 'desc' });

  // 🚨 PERFORMANCE ISSUE #3: Heavy computation in render (not memoized)
  const computeDashboardMetrics = () => {
    console.log('🚨 Computing dashboard metrics in render!');
    
    const startTime = performance.now();
    const metrics = {};
    
    // Intentionally expensive computation
    for (let i = 0; i < 50000; i++) {
      for (let j = 0; j < 50; j++) {
        metrics[`metric_${i}_${j}`] = {
          value: Math.sin(i) * Math.cos(j) * Math.tan(i + j),
          trend: Math.random() * 100 - 50,
          status: Math.random() > 0.7 ? 'warning' : 'normal',
          history: new Array(100).fill(0).map(() => Math.random() * 1000),
          metadata: {
            computed: Math.random() * i * j,
            category: `Category_${i % 10}`,
            complexity: Math.random() * 10,
            description: 'Metric description '.repeat(20)
          }
        };
      }
    }
    
    const endTime = performance.now();
    console.log(`Dashboard metrics computation took ${endTime - startTime} milliseconds`);
    
    // Store in global array (memory leak)
    expensiveOperations.push({
      type: 'dashboard_metrics',
      timestamp: new Date(),
      duration: endTime - startTime,
      metricsCount: Object.keys(metrics).length
    });
    
    return metrics;
  };

  // 🚨 ISSUE: Not memoized, runs on every render
  const expensiveMetrics = computeDashboardMetrics();

  // 🚨 PERFORMANCE ISSUE #4: Heavy data fetching without proper dependencies
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 🚨 ISSUE: Multiple API calls that could be combined
        const [
          metricsRes,
          alertsRes,
          systemRes,
          activityRes,
          performanceRes
        ] = await Promise.all([
          axios.get('/api/dashboard/metrics'),
          axios.get('/api/dashboard/alerts'),
          axios.get('/api/system/health'),
          axios.get('/api/dashboard/activity'),
          axios.get('/api/dashboard/performance')
        ]);

        // 🚨 ISSUE: Heavy processing of fetched data
        const processedMetrics = processMetricsData(metricsRes.data);
        const processedAlerts = processAlertsData(alertsRes.data);
        const processedSystem = processSystemData(systemRes.data);
        const processedActivity = processActivityData(activityRes.data);
        const processedPerformance = processPerformanceData(performanceRes.data);

        // Set all state simultaneously (causing large re-render)
        setMetrics(processedMetrics);
        setAlerts(processedAlerts);
        setSystemHealth(processedSystem);
        setUserActivity(processedActivity);
        setPerformanceStats(processedPerformance);

        // Generate additional heavy data
        const chartData = generateChartData(processedMetrics);
        const recommendations = generateRecommendations(processedMetrics, processedAlerts);
        const realTimeData = generateRealTimeData();

        setCharts(chartData);
        setRecommendations(recommendations);
        setRealTimeData(realTimeData);

        // Store in global cache (memory leak)
        dashboardCache = {
          timestamp: new Date(),
          metrics: processedMetrics,
          alerts: processedAlerts,
          system: processedSystem,
          activity: processedActivity,
          performance: processedPerformance,
          charts: chartData,
          recommendations: recommendations
        };

      } catch (error) {
        setError(error.message);
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
        setLastUpdated(new Date());
      }
    };

    fetchDashboardData();
    
    // 🚨 ISSUE: Set up interval without cleanup
    const interval = setInterval(fetchDashboardData, refreshInterval);
    
    // Missing cleanup: return () => clearInterval(interval);
  }, [refreshInterval, selectedTimeRange]); // Could cause frequent refetches

  // 🚨 PERFORMANCE ISSUE #5: Heavy data processing functions
  function processMetricsData(data) {
    console.log('🚨 Processing metrics data...');
    
    const processed = [];
    
    // Heavy processing of each metric
    data.forEach((metric, index) => {
      const processedMetric = {
        ...metric,
        id: index,
        processedAt: new Date(),
        computedValues: {},
        analytics: {},
        trends: {},
        forecasting: {}
      };

      // Heavy computation for each metric
      for (let i = 0; i < 1000; i++) {
        processedMetric.computedValues[`computed_${i}`] = Math.random() * metric.value * i;
        
        processedMetric.analytics[`analytics_${i}`] = {
          correlation: Math.random(),
          significance: Math.random() * 10,
          patterns: new Array(50).fill(0).map(() => Math.random()),
          insights: 'Analytics insight '.repeat(15)
        };

        processedMetric.trends[`trend_${i}`] = {
          direction: Math.random() > 0.5 ? 'up' : 'down',
          magnitude: Math.random() * 100,
          confidence: Math.random(),
          historicalData: new Array(365).fill(0).map(() => Math.random() * 1000)
        };

        processedMetric.forecasting[`forecast_${i}`] = {
          prediction: Math.random() * 1000,
          confidence: Math.random(),
          timeHorizon: '30d',
          factors: new Array(20).fill(0).map((_, idx) => ({
            factor: `Factor_${idx}`,
            impact: Math.random() * 10
          }))
        };
      }

      processed.push(processedMetric);
    });

    return processed;
  }

  function processAlertsData(data) {
    console.log('🚨 Processing alerts data...');
    
    return data.map((alert, index) => {
      // Heavy processing for each alert
      const processedAlert = {
        ...alert,
        id: index,
        processedAt: new Date(),
        severity: calculateAlertSeverity(alert),
        impact: calculateAlertImpact(alert),
        recommendations: generateAlertRecommendations(alert),
        relatedMetrics: findRelatedMetrics(alert),
        escalationPath: generateEscalationPath(alert),
        historicalContext: getHistoricalContext(alert)
      };

      return processedAlert;
    });
  }

  function calculateAlertSeverity(alert) {
    // Heavy severity calculation
    let severity = 0;
    for (let i = 0; i < 5000; i++) {
      severity += Math.sin(alert.value * i) * Math.cos(alert.threshold * i);
    }
    return Math.abs(severity) % 10;
  }

  function calculateAlertImpact(alert) {
    // Heavy impact calculation
    const impact = {
      business: {},
      technical: {},
      operational: {}
    };

    for (let category in impact) {
      for (let i = 0; i < 200; i++) {
        impact[category][`impact_${i}`] = {
          score: Math.random() * 10,
          affected_systems: new Array(10).fill(0).map((_, idx) => `System_${idx}`),
          estimated_cost: Math.random() * 10000,
          recovery_time: Math.random() * 24,
          details: 'Impact details '.repeat(20)
        };
      }
    }

    return impact;
  }

  function generateAlertRecommendations(alert) {
    const recommendations = [];
    
    for (let i = 0; i < 100; i++) {
      recommendations.push({
        id: i,
        priority: Math.floor(Math.random() * 5) + 1,
        action: `Alert action ${i}`,
        description: 'Alert recommendation description '.repeat(15),
        effort: Math.random() * 10,
        impact: Math.random() * 100,
        timeline: Math.floor(Math.random() * 30) + 1,
        resources: new Array(5).fill(0).map((_, idx) => `Resource_${idx}`),
        dependencies: new Array(8).fill(0).map((_, idx) => `Dependency_${idx}`)
      });
    }

    return recommendations;
  }

  function findRelatedMetrics(alert) {
    // Heavy metric correlation analysis
    const related = [];
    
    for (let i = 0; i < 500; i++) {
      related.push({
        metricId: i,
        correlation: Math.random(),
        causality: Math.random() > 0.7,
        timeDelay: Math.random() * 60,
        strength: Math.random() * 10,
        analysis: 'Correlation analysis '.repeat(25)
      });
    }

    return related;
  }

  function generateEscalationPath(alert) {
    return new Array(20).fill(0).map((_, i) => ({
      level: i,
      role: `Role_${i}`,
      contact: `Contact_${i}`,
      timeToEscalate: i * 15,
      actions: new Array(5).fill(0).map((_, j) => `Action_${j}`),
      description: 'Escalation description '.repeat(10)
    }));
  }

  function getHistoricalContext(alert) {
    const context = {
      previousOccurrences: [],
      patterns: [],
      seasonality: {},
      trends: {}
    };

    // Generate historical data
    for (let i = 0; i < 1000; i++) {
      context.previousOccurrences.push({
        timestamp: moment().subtract(i, 'hours').toISOString(),
        severity: Math.random() * 10,
        duration: Math.random() * 120,
        resolution: 'Resolution description '.repeat(10)
      });
    }

    return context;
  }

  function processSystemData(data) {
    console.log('🚨 Processing system data...');
    
    const processed = {
      ...data,
      processedAt: new Date(),
      healthScore: calculateHealthScore(data),
      componentAnalysis: analyzeComponents(data),
      performanceMetrics: calculatePerformanceMetrics(data),
      capacity: calculateCapacityMetrics(data),
      predictions: generateSystemPredictions(data)
    };

    return processed;
  }

  function calculateHealthScore(data) {
    // Heavy health score calculation
    let score = 0;
    for (let i = 0; i < 10000; i++) {
      score += Math.random() * Math.sin(i) * Math.cos(data.cpu * i);
    }
    return Math.abs(score) % 100;
  }

  function analyzeComponents(data) {
    const analysis = {};
    
    const components = ['cpu', 'memory', 'disk', 'network', 'database', 'cache', 'queue', 'api'];
    
    components.forEach(component => {
      analysis[component] = {
        health: Math.random() * 100,
        performance: Math.random() * 100,
        utilization: Math.random() * 100,
        trends: new Array(100).fill(0).map(() => Math.random() * 100),
        alerts: new Array(20).fill(0).map((_, i) => ({
          severity: Math.floor(Math.random() * 5) + 1,
          message: `${component} alert ${i}`,
          details: 'Component alert details '.repeat(15)
        })),
        recommendations: new Array(10).fill(0).map((_, i) => ({
          suggestion: `${component} recommendation ${i}`,
          impact: Math.random() * 100,
          effort: Math.random() * 10
        }))
      };
    });

    return analysis;
  }

  function calculatePerformanceMetrics(data) {
    const metrics = {};
    
    for (let i = 0; i < 2000; i++) {
      metrics[`perf_${i}`] = {
        value: Math.random() * 1000,
        baseline: Math.random() * 1000,
        threshold: Math.random() * 1200,
        trend: Math.random() * 50 - 25,
        history: new Array(1440).fill(0).map(() => Math.random() * 1000), // 24h of minute data
        percentiles: {
          p50: Math.random() * 500,
          p75: Math.random() * 750,
          p90: Math.random() * 900,
          p95: Math.random() * 950,
          p99: Math.random() * 990
        }
      };
    }

    return metrics;
  }

  function calculateCapacityMetrics(data) {
    return {
      current: Math.random() * 100,
      forecast: new Array(365).fill(0).map((_, i) => ({
        date: moment().add(i, 'days').toISOString(),
        utilization: Math.random() * 100,
        capacity: Math.random() * 1000,
        growth: Math.random() * 10
      })),
      scaling: {
        recommendations: new Array(50).fill(0).map((_, i) => ({
          resource: `Resource_${i}`,
          action: 'scale_up',
          magnitude: Math.random() * 100,
          timeline: Math.floor(Math.random() * 30) + 1
        }))
      }
    };
  }

  function generateSystemPredictions(data) {
    const predictions = {
      performance: {},
      capacity: {},
      failures: {},
      maintenance: {}
    };

    for (let category in predictions) {
      predictions[category] = new Array(100).fill(0).map((_, i) => ({
        prediction: Math.random() * 100,
        confidence: Math.random(),
        timeframe: `${i}h`,
        factors: new Array(15).fill(0).map((_, j) => ({
          factor: `Factor_${j}`,
          weight: Math.random(),
          impact: Math.random() * 10
        }))
      }));
    }

    return predictions;
  }

  function processActivityData(data) {
    console.log('🚨 Processing activity data...');
    
    return data.map((activity, index) => {
      const processed = {
        ...activity,
        id: index,
        processedAt: new Date(),
        userAnalytics: generateUserAnalytics(activity),
        sessionMetrics: generateSessionMetrics(activity),
        behaviorAnalysis: generateBehaviorAnalysis(activity),
        recommendations: generateActivityRecommendations(activity)
      };

      return processed;
    });
  }

  function generateUserAnalytics(activity) {
    const analytics = {};
    
    for (let i = 0; i < 1000; i++) {
      analytics[`user_${i}`] = {
        engagement: Math.random() * 100,
        productivity: Math.random() * 100,
        satisfaction: Math.random() * 10,
        patterns: new Array(30).fill(0).map(() => Math.random()),
        preferences: new Array(20).fill(0).map((_, j) => ({
          preference: `Pref_${j}`,
          strength: Math.random() * 10
        }))
      };
    }

    return analytics;
  }

  function generateSessionMetrics(activity) {
    return {
      duration: Math.random() * 480, // 8 hours max
      interactions: Math.floor(Math.random() * 1000),
      pageViews: Math.floor(Math.random() * 100),
      errorRate: Math.random() * 5,
      performanceScore: Math.random() * 100,
      engagement: {
        clicks: Math.floor(Math.random() * 500),
        scrolls: Math.floor(Math.random() * 200),
        timeOnPage: Math.random() * 300,
        bounceRate: Math.random() * 50
      },
      timeline: new Array(480).fill(0).map((_, i) => ({
        minute: i,
        activity: Math.random() * 10,
        interactions: Math.floor(Math.random() * 5)
      }))
    };
  }

  function generateBehaviorAnalysis(activity) {
    return {
      patterns: new Array(50).fill(0).map((_, i) => ({
        pattern: `Pattern_${i}`,
        frequency: Math.random() * 100,
        significance: Math.random() * 10,
        prediction: Math.random()
      })),
      anomalies: new Array(10).fill(0).map((_, i) => ({
        anomaly: `Anomaly_${i}`,
        severity: Math.random() * 10,
        probability: Math.random(),
        description: 'Behavioral anomaly description '.repeat(10)
      })),
      clusters: new Array(5).fill(0).map((_, i) => ({
        cluster: i,
        size: Math.floor(Math.random() * 1000),
        characteristics: new Array(20).fill(0).map((_, j) => ({
          trait: `Trait_${j}`,
          value: Math.random() * 100
        }))
      }))
    };
  }

  function generateActivityRecommendations(activity) {
    return new Array(30).fill(0).map((_, i) => ({
      id: i,
      type: 'activity_optimization',
      priority: Math.floor(Math.random() * 5) + 1,
      suggestion: `Activity suggestion ${i}`,
      expectedImpact: Math.random() * 100,
      implementation: 'Implementation details '.repeat(15),
      timeline: Math.floor(Math.random() * 14) + 1
    }));
  }

  function processPerformanceData(data) {
    console.log('🚨 Processing performance data...');
    
    const processed = {
      ...data,
      processedAt: new Date(),
      metrics: generatePerformanceMetrics(),
      bottlenecks: identifyBottlenecks(data),
      optimizations: generateOptimizations(data),
      benchmarks: generateBenchmarks(data)
    };

    return processed;
  }

  function generatePerformanceMetrics() {
    const metrics = {};
    
    const metricTypes = ['response_time', 'throughput', 'error_rate', 'cpu_usage', 'memory_usage', 'disk_io', 'network_io'];
    
    metricTypes.forEach(type => {
      metrics[type] = {
        current: Math.random() * 1000,
        average: Math.random() * 800,
        peak: Math.random() * 1500,
        minimum: Math.random() * 100,
        trend: Math.random() * 50 - 25,
        history: new Array(1440).fill(0).map(() => Math.random() * 1000),
        thresholds: {
          warning: Math.random() * 800,
          critical: Math.random() * 1200
        },
        sla: {
          target: Math.random() * 500,
          current: Math.random() * 100,
          breach_count: Math.floor(Math.random() * 10)
        }
      };
    });

    return metrics;
  }

  function identifyBottlenecks(data) {
    return new Array(25).fill(0).map((_, i) => ({
      id: i,
      component: `Component_${i}`,
      severity: Math.random() * 10,
      impact: Math.random() * 100,
      frequency: Math.random() * 50,
      rootCause: 'Bottleneck root cause analysis '.repeat(20),
      solution: 'Bottleneck solution description '.repeat(15),
      effort: Math.random() * 10,
      timeline: Math.floor(Math.random() * 30) + 1,
      dependencies: new Array(8).fill(0).map((_, j) => `Dependency_${j}`)
    }));
  }

  function generateOptimizations(data) {
    return new Array(40).fill(0).map((_, i) => ({
      id: i,
      category: 'performance',
      priority: Math.floor(Math.random() * 5) + 1,
      title: `Performance optimization ${i}`,
      description: 'Optimization description '.repeat(20),
      expectedGain: Math.random() * 50,
      effort: Math.random() * 10,
      cost: Math.random() * 10000,
      roi: Math.random() * 500,
      implementation: {
        steps: new Array(10).fill(0).map((_, j) => `Step ${j + 1}: Implementation detail`),
        timeline: Math.floor(Math.random() * 60) + 1,
        resources: new Array(5).fill(0).map((_, j) => `Resource_${j}`)
      }
    }));
  }

  function generateBenchmarks(data) {
    return {
      industry: new Array(20).fill(0).map((_, i) => ({
        metric: `Industry_metric_${i}`,
        ourValue: Math.random() * 1000,
        industryAverage: Math.random() * 1000,
        industryBest: Math.random() * 500,
        percentile: Math.random() * 100,
        gap: Math.random() * 300
      })),
      historical: new Array(12).fill(0).map((_, i) => ({
        month: moment().subtract(i, 'months').format('YYYY-MM'),
        performance: Math.random() * 100,
        improvement: Math.random() * 20 - 10,
        events: new Array(5).fill(0).map((_, j) => ({
          event: `Event_${j}`,
          impact: Math.random() * 50
        }))
      })),
      competitive: new Array(10).fill(0).map((_, i) => ({
        competitor: `Competitor_${i}`,
        performance: Math.random() * 100,
        features: new Array(15).fill(0).map((_, j) => `Feature_${j}`),
        strengths: new Array(8).fill(0).map((_, j) => `Strength_${j}`),
        weaknesses: new Array(6).fill(0).map((_, j) => `Weakness_${j}`)
      }))
    };
  }

  // 🚨 PERFORMANCE ISSUE #6: Heavy chart data generation
  function generateChartData(metrics) {
    console.log('🚨 Generating chart data...');
    
    const charts = [];
    
    // Generate many charts with heavy data
    for (let i = 0; i < 20; i++) {
      const chartData = {
        id: i,
        type: ['line', 'bar', 'pie', 'scatter', 'area'][Math.floor(Math.random() * 5)],
        title: `Chart ${i}`,
        data: {
          labels: new Array(1000).fill(0).map((_, j) => `Label_${j}`),
          datasets: new Array(10).fill(0).map((_, j) => ({
            label: `Dataset_${j}`,
            data: new Array(1000).fill(0).map(() => Math.random() * 1000),
            backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`,
            borderColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`,
            metadata: {
              aggregation: 'sum',
              unit: 'count',
              precision: 2,
              description: 'Dataset description '.repeat(15)
            }
          }))
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Chart ${i} Title`
            },
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'X Axis'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Y Axis'
              }
            }
          }
        },
        analytics: generateChartAnalytics()
      };
      
      charts.push(chartData);
    }
    
    return charts;
  }

  function generateChartAnalytics() {
    return {
      insights: new Array(20).fill(0).map((_, i) => ({
        insight: `Chart insight ${i}`,
        confidence: Math.random(),
        impact: Math.random() * 100,
        details: 'Chart insight details '.repeat(12)
      })),
      trends: new Array(15).fill(0).map((_, i) => ({
        trend: `Trend_${i}`,
        direction: Math.random() > 0.5 ? 'up' : 'down',
        magnitude: Math.random() * 100,
        significance: Math.random() * 10
      })),
      correlations: new Array(25).fill(0).map((_, i) => ({
        variable1: `Var_${i}`,
        variable2: `Var_${i + 1}`,
        correlation: Math.random() * 2 - 1,
        pValue: Math.random(),
        significance: Math.random() > 0.05 ? 'significant' : 'not_significant'
      }))
    };
  }

  // 🚨 PERFORMANCE ISSUE #7: Heavy recommendations generation
  function generateRecommendations(metrics, alerts) {
    console.log('🚨 Generating recommendations...');
    
    const recommendations = [];
    
    for (let i = 0; i < 200; i++) {
      const recommendation = {
        id: i,
        type: 'dashboard_optimization',
        priority: Math.floor(Math.random() * 5) + 1,
        category: ['performance', 'security', 'cost', 'reliability'][Math.floor(Math.random() * 4)],
        title: `Dashboard Recommendation ${i}`,
        description: 'Dashboard recommendation description '.repeat(25),
        rationale: 'Recommendation rationale '.repeat(20),
        expectedBenefit: Math.random() * 100,
        implementationEffort: Math.random() * 10,
        cost: Math.random() * 50000,
        roi: Math.random() * 300,
        timeline: Math.floor(Math.random() * 90) + 1,
        confidence: Math.random(),
        risks: new Array(8).fill(0).map((_, j) => ({
          risk: `Risk_${j}`,
          probability: Math.random(),
          impact: Math.random() * 10,
          mitigation: 'Risk mitigation strategy '.repeat(10)
        })),
        dependencies: new Array(12).fill(0).map((_, j) => ({
          dependency: `Dependency_${j}`,
          type: 'technical',
          criticality: Math.random() * 10,
          description: 'Dependency description '.repeat(8)
        })),
        implementation: {
          phases: new Array(5).fill(0).map((_, j) => ({
            phase: j + 1,
            name: `Phase ${j + 1}`,
            duration: Math.floor(Math.random() * 30) + 1,
            tasks: new Array(10).fill(0).map((_, k) => ({
              task: `Task ${k + 1}`,
              effort: Math.random() * 40,
              description: 'Task description '.repeat(8)
            }))
          })),
          resources: new Array(8).fill(0).map((_, j) => ({
            resource: `Resource_${j}`,
            role: 'developer',
            allocation: Math.random() * 100,
            duration: Math.floor(Math.random() * 60) + 1
          }))
        },
        monitoring: {
          kpis: new Array(15).fill(0).map((_, j) => ({
            kpi: `KPI_${j}`,
            target: Math.random() * 100,
            current: Math.random() * 80,
            unit: 'percent'
          })),
          alerts: new Array(8).fill(0).map((_, j) => ({
            alert: `Alert_${j}`,
            condition: 'threshold_exceeded',
            threshold: Math.random() * 100
          }))
        }
      };

      recommendations.push(recommendation);
    }
    
    return recommendations;
  }

  // 🚨 PERFORMANCE ISSUE #8: Real-time data generation
  function generateRealTimeData() {
    console.log('🚨 Generating real-time data...');
    
    const realTime = {
      timestamp: new Date(),
      metrics: {},
      events: [],
      alerts: [],
      performance: {},
      users: {},
      system: {}
    };

    // Generate massive real-time metrics
    for (let i = 0; i < 5000; i++) {
      realTime.metrics[`rt_metric_${i}`] = {
        value: Math.random() * 1000,
        timestamp: new Date(),
        source: `Source_${i % 100}`,
        quality: Math.random(),
        tags: new Array(10).fill(0).map((_, j) => `tag_${j}`),
        metadata: {
          unit: 'count',
          aggregation: 'average',
          retention: '7d',
          description: 'Real-time metric description '.repeat(10)
        }
      };
    }

    // Generate real-time events
    for (let i = 0; i < 1000; i++) {
      realTime.events.push({
        id: i,
        type: 'system_event',
        severity: Math.floor(Math.random() * 5) + 1,
        timestamp: new Date(),
        source: `Source_${i % 50}`,
        message: `Real-time event ${i}`,
        details: 'Event details '.repeat(20),
        context: {
          user: `User_${i % 100}`,
          session: `Session_${i % 200}`,
          request: `Request_${i}`,
          metadata: 'Event context metadata '.repeat(15)
        }
      });
    }

    return realTime;
  }

  // 🚨 PERFORMANCE ISSUE #9: Component render counting
  useEffect(() => {
    renderCounts.push({
      component: 'Dashboard',
      timestamp: new Date(),
      state: {
        metricsCount: metrics.length,
        alertsCount: alerts.length,
        chartsCount: charts.length,
        recommendationsCount: recommendations.length
      }
    });
  });

  // 🚨 PERFORMANCE ISSUE #10: Heavy dashboard statistics calculation
  const calculateDashboardStats = () => {
    console.log('🚨 Calculating dashboard statistics...');
    
    const stats = {
      totalMetrics: metrics.length,
      totalAlerts: alerts.length,
      totalCharts: charts.length,
      totalRecommendations: recommendations.length,
      systemHealth: systemHealth.healthScore || 0,
      performance: {},
      trends: {},
      summary: {}
    };

    // Heavy statistical calculations
    if (metrics.length > 0) {
      for (let i = 0; i < 1000; i++) {
        const metricSubset = metrics.slice(0, Math.min(metrics.length, 100));
        
        stats.performance[`perf_stat_${i}`] = {
          mean: metricSubset.reduce((sum, m) => sum + (m.value || 0), 0) / metricSubset.length,
          variance: calculateVariance(metricSubset),
          standardDeviation: Math.sqrt(calculateVariance(metricSubset)),
          correlation: calculateCorrelation(metricSubset),
          trend: calculateTrend(metricSubset),
          seasonality: calculateSeasonality(metricSubset)
        };
      }
    }

    return stats;
  };

  function calculateVariance(data) {
    if (data.length === 0) return 0;
    const mean = data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length;
    return data.reduce((sum, item) => sum + Math.pow((item.value || 0) - mean, 2), 0) / data.length;
  }

  function calculateCorrelation(data) {
    // Heavy correlation calculation
    const correlations = {};
    for (let i = 0; i < data.length; i++) {
      for (let j = i + 1; j < data.length; j++) {
        const key = `${i}_${j}`;
        correlations[key] = Math.random() * 2 - 1; // Simplified
      }
    }
    return correlations;
  }

  function calculateTrend(data) {
    // Heavy trend calculation
    const trends = {};
    for (let i = 0; i < 50; i++) {
      trends[`trend_${i}`] = {
        direction: Math.random() > 0.5 ? 'up' : 'down',
        magnitude: Math.random() * 100,
        confidence: Math.random(),
        timeframe: `${i}h`
      };
    }
    return trends;
  }

  function calculateSeasonality(data) {
    // Heavy seasonality calculation
    const seasonality = {};
    const periods = ['hourly', 'daily', 'weekly', 'monthly'];
    
    periods.forEach(period => {
      seasonality[period] = {
        detected: Math.random() > 0.7,
        strength: Math.random() * 100,
        period: Math.floor(Math.random() * 100) + 1,
        patterns: new Array(24).fill(0).map(() => Math.random() * 100)
      };
    });
    
    return seasonality;
  }

  // 🚨 ISSUE: Not memoized, recalculated on every render
  const dashboardStats = calculateDashboardStats();

  // 🚨 PERFORMANCE ISSUE #11: Heavy loading state
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <h2>Loading Dashboard Data...</h2>
        <p>Processing {Object.keys(expensiveMetrics).length} metrics...</p>
        <p>Render count: {renderCounts.length}</p>
        <p>Expensive operations: {expensiveOperations.length}</p>
        
        {/* 🚨 ISSUE: Heavy computation even during loading */}
        <div style={{ display: 'none' }}>
          {JSON.stringify(computeDashboardMetrics()).length}
        </div>
      </div>
    );
  }

  // 🚨 PERFORMANCE ISSUE #12: Error state with heavy data
  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Dashboard Error</h2>
        <p>{error}</p>
        <p>Cached data entries: {Object.keys(dashboardCache).length}</p>
        <p>Performance operations: {expensiveOperations.length}</p>
        
        {/* 🚨 ISSUE: Still computing expensive data during error */}
        <div>
          <h3>Debug Information</h3>
          <pre>{JSON.stringify(dashboardStats, null, 2).substring(0, 1000)}...</pre>
        </div>
      </div>
    );
  }

  // 🚨 PERFORMANCE ISSUE #13: Heavy main render
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Performance Test Dashboard</h1>
        <div className="dashboard-stats">
          <span>Metrics: {metrics.length}</span>
          <span>Alerts: {alerts.length}</span>
          <span>Charts: {charts.length}</span>
          <span>Recommendations: {recommendations.length}</span>
          <span>Renders: {renderCounts.length}</span>
          <span>Last Updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 🚨 ISSUE: Rendering all metrics without virtualization */}
      <div className="dashboard-grid">
        {metrics.slice(0, 50).map((metric, index) => (
          <div key={index} className="metric-card">
            <h3>{metric.name || `Metric ${index}`}</h3>
            <div className="metric-value">{metric.value?.toFixed(2) || 'N/A'}</div>
            <div className="metric-trend">
              Trend: {metric.trend?.toFixed(2) || 'N/A'}%
            </div>
            {/* 🚨 ISSUE: Rendering heavy analytics for each metric */}
            <div className="metric-analytics">
              Analytics: {Object.keys(metric.analytics || {}).length} items
            </div>
          </div>
        ))}
      </div>

      {/* 🚨 ISSUE: Rendering all alerts */}
      <div className="alerts-section">
        <h2>Active Alerts ({alerts.length})</h2>
        <div className="alerts-list">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert alert-${alert.severity || 'info'}`}>
              <h4>{alert.title || `Alert ${index}`}</h4>
              <p>{alert.message}</p>
              <div className="alert-metadata">
                <span>Severity: {alert.severity}</span>
                <span>Impact: {alert.impact?.business ? 'High' : 'Low'}</span>
                <span>Recommendations: {alert.recommendations?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🚨 ISSUE: Rendering all charts */}
      <div className="charts-section">
        <h2>Performance Charts ({charts.length})</h2>
        <div className="charts-grid">
          {charts.map((chart, index) => (
            <div key={index} className="chart-container">
              <h3>{chart.title}</h3>
              <div className="chart-placeholder">
                Chart {index} ({chart.type})
                <br />
                Data points: {chart.data?.datasets?.[0]?.data?.length || 0}
                <br />
                Analytics: {chart.analytics?.insights?.length || 0} insights
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🚨 ISSUE: Rendering all recommendations */}
      <div className="recommendations-section">
        <h2>Recommendations ({recommendations.length})</h2>
        <div className="recommendations-list">
          {recommendations.slice(0, 20).map((rec, index) => (
            <div key={index} className="recommendation-card">
              <h4>{rec.title}</h4>
              <p>{rec.description}</p>
              <div className="recommendation-metadata">
                <span>Priority: {rec.priority}</span>
                <span>ROI: {rec.roi?.toFixed(2) || 'N/A'}%</span>
                <span>Effort: {rec.implementationEffort?.toFixed(1) || 'N/A'}/10</span>
                <span>Risks: {rec.risks?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🚨 ISSUE: Hidden expensive data rendering */}
      <div style={{ display: 'none' }}>
        <div>Expensive metrics: {Object.keys(expensiveMetrics).length}</div>
        <div>Dashboard stats: {JSON.stringify(dashboardStats).length} chars</div>
        <div>Cache size: {Object.keys(dashboardCache).length}</div>
        <div>Render history: {renderCounts.length}</div>
        <div>Operations: {expensiveOperations.length}</div>
      </div>
    </div>
  );
};

export default Dashboard;
