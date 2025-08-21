import React, { useMemo, useState, useCallback } from 'react';
import UploadPanel from './components/UploadPanel';
import DiffTable from './components/DiffTable';
import MetricDiffChart from './components/MetricDiffChart';
import Suggestions from './components/Suggestions';
import AIInsights from './components/AIInsights';
import SystemContextPanel from './components/SystemContextPanel';
import HistoricalReports from './components/HistoricalReports';
import ExportPanel from './components/ExportPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { PerformanceReport, SystemContext, EnhancedComparisonResult } from './types';
import { compareReports, suggestionsFromDiffs } from './utils/compare';
import { aiService } from './services/secureAIService';

export default function App() {
  const [baseline, setBaseline] = useState<PerformanceReport | null>(null);
  const [current, setCurrent] = useState<PerformanceReport | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [aiEnabled, setAIEnabled] = useState(true);
  const [aiLoading, setAILoading] = useState(false);
  const [systemContext, setSystemContext] = useState<SystemContext>({
    stack: '',
    environment: 'prod',
    scale: 'medium'
  });
  const [result, setResult] = useState<EnhancedComparisonResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string>('');

  // Debounced AI analysis to prevent excessive API calls
  const runAIAnalysis = useCallback(
    debounce(async (baseline: PerformanceReport, current: PerformanceReport, context: SystemContext) => {
      if (!aiEnabled) return;

      setAILoading(true);
      try {
        console.log('🤖 Starting AI Analysis...');
        const aiResult = await aiService.analyzePerformance(baseline, current, context);
        console.log('✅ AI Analysis completed:', aiResult);
        setResult(aiResult);
        setLastAnalysisTime(new Date().toLocaleString());
      } catch (error) {
        console.error('❌ AI Analysis failed:', error);
        // Fallback to basic analysis
        const basicResult = compareReports(baseline, current);
        setResult({
          ...basicResult,
          explanation: 'Analysis completed using basic algorithms due to AI service unavailability.'
        });
      } finally {
        setAILoading(false);
      }
    }, 1000),
    [aiEnabled]
  );

  // Basic comparison (fallback)
  const basicResult = useMemo(() => {
    if (!baseline || !current) return null;
    return compareReports(baseline, current);
  }, [baseline, current]);

  // Run analysis when data changes
  React.useEffect(() => {
    if (!baseline || !current) {
      setResult(null);
      return;
    }

    if (aiEnabled) {
      runAIAnalysis(baseline, current, systemContext);
    } else {
      setResult(basicResult);
    }
  }, [baseline, current, systemContext, aiEnabled, basicResult, runAIAnalysis]);

  const tips = useMemo(() => result ? suggestionsFromDiffs(result.diffs) : [], [result]);

  const loadSample = async () => {
    setLoadingSample(true);
    try {
      const [b, c] = await Promise.all([
        fetch('/sample/benchmark.json').then(r => r.json()),
        fetch('/sample/current.json').then(r => r.json()),
      ]);
      setBaseline(b);
      setCurrent(c);
    } catch (error) {
      console.error('Failed to load sample data:', error);
      alert('Failed to load sample data. Please check if the sample files exist.');
    } finally {
      setLoadingSample(false);
    }
  };

  const toggleAI = () => {
    setAIEnabled(!aiEnabled);
    if (!aiEnabled && baseline && current) {
      // Clear cache and re-run analysis
      aiService.clearCache();
    }
  };

  const handleHistoricalReportSelect = (historicalBaseline: any, historicalCurrent: any) => {
    setBaseline(historicalBaseline);
    setCurrent(historicalCurrent);
    setShowHistory(false);
  };

  const clearData = () => {
    setBaseline(null);
    setCurrent(null);
    setResult(null);
    setLastAnalysisTime('');
    // Clear any cached data
    aiService.clearCache();
    // Clear localStorage if any exists
    localStorage.removeItem('performanceBaseline');
    localStorage.removeItem('performanceCurrent');
    localStorage.removeItem('performanceResults');
    console.log('🗑️ All data cleared');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
  {/* Animated top accent bar */}
  <div className="animated-bar h-1 w-full"></div>
        <div className="navbar bg-base-200/80 backdrop-blur shadow-md">
          <div className="container mx-auto px-6 md:px-8 py-3">
            <div className="flex-1 items-center gap-3 animate-fade-in-up">
              <div className="flex items-center gap-6">
                <img
                  src="/logo-short.jpg"
                  alt="SpotLag.AI logo"
                  className="h-12 w-auto rounded-md shadow hidden sm:block ring-1 ring-primary/20"
                />
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-black tracking-tight text-gradient-animated">
                    SpotLag.AI
                  </span>
                  <span className="mt-1 text-[11px] sm:text-sm text-glow opacity-90">
                    Spot the Lag, Squash the Bug
                  </span>
                </div>
              </div>
              {lastAnalysisTime && (
                <span className="ml-2 text-xs opacity-60">
                  Last analysis: {lastAnalysisTime}
                </span>
              )}
            </div>
            <div className="flex-none gap-4 md:gap-5">
              <div className="form-control">
                <label className="label cursor-pointer gap-2">
                  <span className="label-text text-sm">AI Analysis</span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary toggle-sm" 
                    checked={aiEnabled}
                    onChange={toggleAI}
                  />
                </label>
              </div>
              <button 
                className="btn btn-outline btn-sm transition-all duration-200 hover:-translate-y-0.5 mr-2" 
                onClick={() => setShowHistory(!showHistory)}
              >
                📊 History
              </button>
              <button 
                className={`btn btn-primary btn-sm transition-all duration-200 hover:-translate-y-0.5 ${loadingSample ? 'loading' : ''}`} 
                onClick={loadSample} 
                disabled={loadingSample}
              >
                {!loadingSample && '📄'} Load Sample
              </button>
              {(baseline || current) && (
                <button 
                  className="btn btn-ghost btn-sm transition-all duration-200 hover:-translate-y-0.5" 
                  onClick={clearData}
                >
                  🗑️ Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <main className="container mx-auto px-6 md:px-8 py-8 space-y-10">
          {/* Historical Reports Panel */}
          {showHistory && (
            <ErrorBoundary fallback={<div className="alert alert-warning">Failed to load historical reports</div>}>
              <HistoricalReports onSelectReport={handleHistoricalReportSelect} />
            </ErrorBoundary>
          )}

          {/* System Context Panel */}
          {aiEnabled && (
            <ErrorBoundary fallback={<div className="alert alert-warning">Context panel unavailable</div>}>
              <SystemContextPanel 
                context={systemContext} 
                onContextChange={setSystemContext}
              />
            </ErrorBoundary>
          )}

          {/* Upload Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ErrorBoundary fallback={<div className="alert alert-error">Upload panel error</div>}>
              <div className="animate-pop"><UploadPanel label="Benchmark (Baseline)" onLoaded={setBaseline} /></div>
            </ErrorBoundary>
            <ErrorBoundary fallback={<div className="alert alert-error">Upload panel error</div>}>
              <div className="animate-pop" style={{animationDelay:'80ms'}}><UploadPanel label="Normal (Current)" onLoaded={setCurrent} /></div>
            </ErrorBoundary>
          </div>

          {baseline && current && result && (
            <>
              {/* Summary Stats */}
              <div className="stats stats-vertical md:stats-horizontal shadow-lg rounded-xl bg-base-200/80 backdrop-blur w-full animate-pop">
                <div className="stat">
                  <div className="stat-title">Improved</div>
                  <div className="stat-value text-success">{result.summary.improved}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Worse</div>
                  <div className="stat-value text-error">{result.summary.worse}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Same</div>
                  <div className="stat-value">{result.summary.same}</div>
                </div>
                {aiEnabled && result.aiInsights && (
                  <div className="stat">
                    <div className="stat-title">AI Insights</div>
                    <div className="stat-value text-info">{result.aiInsights.length}</div>
                  </div>
                )}
                <div className="stat">
                  <div className="stat-title">Analysis Mode</div>
                  <div className="stat-value text-sm">
                    {aiLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      aiEnabled ? '🤖 AI' : '📊 Basic'
                    )}
                  </div>
                </div>
              </div>

              {/* AI Insights (if enabled) */}
              {aiEnabled && (
                <ErrorBoundary fallback={<div className="alert alert-warning">AI insights unavailable</div>}>
                  <div className="animate-pop">
                  <AIInsights 
                    insights={result.aiInsights || []}
                    explanation={result.explanation}
                    loading={aiLoading}
                  />
                  </div>
                </ErrorBoundary>
              )}

              {/* Charts */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Chart display error</div>}>
                <div className="card bg-base-100 shadow-lg p-4 animate-pop">
                  <MetricDiffChart diffs={result.diffs} />
                </div>
              </ErrorBoundary>
              
              {/* Detailed Table */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Table display error</div>}>
                <div className="card bg-base-100 shadow-lg p-4 animate-pop">
                  <DiffTable diffs={result.diffs} />
                </div>
              </ErrorBoundary>

              {/* Export Panel */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Export unavailable</div>}>
                <div className="animate-pop">
                  <ExportPanel data={result} />
                </div>
              </ErrorBoundary>
              
              {/* Traditional Suggestions (fallback) */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Suggestions unavailable</div>}>
                <div className="animate-pop">
                  <Suggestions tips={tips} />
                </div>
              </ErrorBoundary>
              
              {/* AI Predictions (if available) */}
              {aiEnabled && result.predictions && result.predictions.length > 0 && (
                <ErrorBoundary fallback={<div className="alert alert-warning">Predictions unavailable</div>}>
                  <div className="card bg-base-200 shadow">
                    <div className="card-body">
                      <h3 className="card-title">🔮 Performance Predictions</h3>
                      <div className="space-y-2">
                        {result.predictions.map((prediction: any, i: number) => (
                          <div key={i} className="alert alert-info">
                            <div>
                              <h4 className="font-bold">{prediction.title}</h4>
                              <p className="text-sm">{prediction.description}</p>
                              {prediction.actionable_steps && prediction.actionable_steps.length > 0 && (
                                <ul className="text-xs mt-2 list-disc list-inside">
                                  {prediction.actionable_steps.map((step: string, j: number) => (
                                    <li key={j}>{step}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ErrorBoundary>
              )}
            </>
          )}

      {(!baseline || !current) && (
    <div className="alert shadow rounded-xl animate-pop">
              <div>
                <h3 className="font-bold">Ready to analyze performance with SpotLag.AI</h3>
                <div className="text-sm space-y-1">
                  <p>📁 Upload both reports or click "Load Sample" to try it out</p>
                  {aiEnabled && (
                    <p>🤖 AI analysis will provide enhanced insights and predictions</p>
                  )}
                  <p>📊 View historical reports to compare past analyses</p>
                  {/* Debug information */}
      <details className="mt-4">
                    <summary className="text-xs opacity-50 cursor-pointer">🔍 Debug Info</summary>
                    <div className="text-xs opacity-60 mt-2 p-2 bg-base-300 rounded">
                      <p>Baseline: {baseline ? '✅ Loaded' : '❌ Not loaded'}</p>
                      <p>Current: {current ? '✅ Loaded' : '❌ Not loaded'}</p>
                      <p>Result: {result ? '✅ Available' : '❌ No results'}</p>
                      <p>AI Enabled: {aiEnabled ? '✅ Yes' : '❌ No'}</p>
                      <p>Loading: {aiLoading ? '⏳ Yes' : '✅ No'}</p>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          )}

           {/* About Us */}
           <section className="card bg-gradient-to-r from-cyan-200 via-blue-100 to-amber-100 shadow-lg rounded-xl animate-fade-in-up mt-8">
             <div className="card-body py-2 px-4">
               <h3 className="card-title text-sm font-bold text-blue-700">About</h3>
               <p className="text-xs text-blue-900 font-medium">SpotLag.AI: Instantly spot lag, fix bugs faster. AI-powered insights, simple results.</p>
               <ul className="mt-1 text-[11px] text-blue-900 leading-snug space-y-0.5 list-disc list-inside">
                 <li>Nandan Jha – Lead, Test Suite & Overall Flow</li>
                 <li>Sachin Taji – Backend</li>
                 <li>Rahul Saini – Frontend</li>
                 <li>Shivendra Shukla – Frontend</li>
                 <li>Shiva Allu – Documentation and Backend</li>
               </ul>
             </div>
           </section>
      <section className="card bg-base-100 border border-warning/40 rounded-xl shadow-md animate-fade-in-up mt-4">
        <div className="card-body py-2 px-4">
          <h3 className="card-title text-sm font-bold text-warning">Disclaimer</h3>
          <ul className="text-xs text-slate-700 leading-snug list-disc list-inside space-y-0.5">
            <li>Insights are AI-generated and may be incomplete or inaccurate.</li>
            <li>Do not upload sensitive data; prefer sanitized metrics/logs.</li>
          </ul>
        </div>
      </section>
        </main>
      </div>
    </ErrorBoundary>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
