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
import { compareReports, suggestionsFromDiffs, computeImpact } from './utils/compare';
import { aiService } from './services/secureAIService';
import { AI_CONFIG, getPreferredProvider } from './config/ai';

export default function App() {
  const [baseline, setBaseline] = useState<PerformanceReport | null>(null);
  const [current, setCurrent] = useState<PerformanceReport | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [aiEnabled, setAIEnabled] = useState(true);
  const [aiLoading, setAILoading] = useState(false);
  const [systemContext, setSystemContext] = useState<SystemContext>({
    stack: '',
    environment: 'prod',
    scale: 'medium',
    selectedModel: AI_CONFIG.bedrock.primaryModel // Default to Bedrock primary model
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
        console.log('📊 Analysis Context:', {
          selectedModel: context.selectedModel,
          aiEnabled,
          provider: getPreferredProvider()
        });
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

  // Clear results when data changes (manual analysis now)
  React.useEffect(() => {
    if (!baseline || !current) {
      setResult(null);
      return;
    }
    
    // Clear previous results when new data is loaded
    // Analysis will be triggered manually via "Start Analysis" button
    setResult(null);
  }, [baseline, current]);

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
    // Clear cache when toggling AI mode
    aiService.clearCache();
    // Clear previous results - user will need to click "Start Analysis" again
    if (baseline && current && result) {
      setResult(null);
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
        <div className="animated-bar h-1 w-full"></div>
        <div className="navbar bg-base-200/80 backdrop-blur shadow-md">
          <div className="container mx-auto px-6 md:px-8 py-3">
            <div className="flex-1 items-center gap-3 animate-fade-in-up">
              <div className="flex items-center gap-6">
                <img src="/shared%20image.jpg" alt="SpotLag.AI logo" className="h-12 w-auto rounded-md shadow hidden sm:block ring-1 ring-primary/20 animate-float" />
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-black tracking-tight text-gradient-animated">SpotLag.AI</span>
                  <span className="mt-1 text-[11px] sm:text-sm text-glow opacity-90">Spot the Lag, Squash the Bug</span>
                </div>
              </div>
              {lastAnalysisTime && (
                <span className="ml-2 text-xs opacity-60">Last analysis: {lastAnalysisTime}</span>
              )}
            </div>
            <div className="flex-none gap-4 md:gap-5">
              <button 
                className="btn btn-outline btn-sm transition-all duration-200 hover:-translate-y-0.5 mr-2" 
                onClick={() => setShowHistory(!showHistory)}
              >📊 History</button>
              <button 
                className={`btn btn-primary btn-sm transition-all duration-200 hover:-translate-y-0.5 ${loadingSample ? 'loading' : ''}`} 
                onClick={loadSample} 
                disabled={loadingSample}
              >{!loadingSample && '📄'} Load Sample</button>
              {(baseline || current) && (
                <button className="btn btn-ghost btn-sm transition-all duration-200 hover:-translate-y-0.5" onClick={clearData}>🗑️ Clear</button>
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

          {/* System Context Panel with AI Toggle */}
          <ErrorBoundary fallback={<div className="alert alert-warning">Context panel unavailable</div>}>
            <SystemContextPanel 
              context={systemContext} 
              onContextChange={setSystemContext}
              aiEnabled={aiEnabled}
              onAIToggle={toggleAI}
            />
          </ErrorBoundary>

          {/* Upload Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ErrorBoundary fallback={<div className="alert alert-error">Upload panel error</div>}>
        <div className="animate-pop"><UploadPanel label="Benchmark (Baseline)" onLoaded={setBaseline} /></div>
            </ErrorBoundary>
            <ErrorBoundary fallback={<div className="alert alert-error">Upload panel error</div>}>
        <div className="animate-pop" style={{animationDelay:'80ms'}}><UploadPanel label="Normal (Current)" onLoaded={setCurrent} /></div>
            </ErrorBoundary>
          </div>

          {/* Start Analysis Button & Instructions */}
          {baseline && current && (
            <div className="space-y-4">
              {/* Analysis Instructions */}
              {!result && (
                <div className="alert alert-info">
                  <div>
                    <h3 className="font-bold">Ready for Analysis!</h3>
                    <p className="text-sm">
                      Both files are loaded. Click "Start Analysis" to begin 
                      {aiEnabled ? ' AI-powered performance analysis.' : ' basic performance comparison.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Start Analysis Button */}
              <div className="flex justify-center py-4">
                <button 
                  className={`btn btn-primary btn-lg gap-2 ${aiLoading ? 'loading' : ''}`}
                  onClick={() => {
                    console.log('🚀 Start Analysis clicked!', { baseline: !!baseline, current: !!current, aiEnabled });
                    if (baseline && current) {
                      if (aiEnabled) {
                        runAIAnalysis(baseline, current, systemContext);
                      } else {
                        setResult(compareReports(baseline, current));
                        setLastAnalysisTime(new Date().toLocaleString());
                      }
                    }
                  }}
                  disabled={!baseline || !current || aiLoading}
                >
                  {aiLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      🚀 Start Analysis
                    </>
                  )}
                </button>
              </div>

              {/* Debug Info */}
              <div className="text-center">
                <details className="text-xs opacity-50">
                  <summary className="cursor-pointer">🔍 Debug Info</summary>
                  <div className="mt-2 p-2 bg-base-300 rounded">
                    <p>Baseline: {baseline ? '✅ Loaded' : '❌ Not loaded'}</p>
                    <p>Current: {current ? '✅ Loaded' : '❌ Not loaded'}</p>
                    <p>Result: {result ? '✅ Available' : '❌ No results'}</p>
                    <p>AI Enabled: {aiEnabled ? '✅ Yes' : '❌ No'}</p>
                    <p>Loading: {aiLoading ? '⏳ Yes' : '✅ No'}</p>
                    <p>Show Button: {(baseline && current) ? '✅ Yes' : '❌ No'}</p>
                  </div>
                </details>
              </div>
            </div>
          )}

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

              {/* Impact Summary (numeric emphasis) */}
              {(() => {
                const impact = computeImpact(result);
                return (
                  <div className="card bg-base-100 shadow-lg border border-primary/20 animate-pop">
                    <div className="card-body py-4 px-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="card-title text-sm">📈 Impact Summary</h3>
                        <span className="badge badge-primary badge-sm">Numbers</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-xs opacity-70">Net Score</div>
                          <div className={`text-lg font-bold ${impact.netImprovementScore >= 0 ? 'text-success' : 'text-error'}`}>{impact.netImprovementScore}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-70">Avg % Gain</div>
                          <div className="text-lg font-bold">{impact.avgPctImprovement !== null ? `${impact.avgPctImprovement}%` : '—'}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-70">Latency Saved</div>
                          <div className="text-lg font-bold">{impact.latencyImprovementMs !== null ? `${impact.latencyImprovementMs} ms` : '—'}</div>
                          {impact.latencyImprovementPct !== null && (
                            <div className="text-[10px] opacity-60">({impact.latencyImprovementPct}% faster)</div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs opacity-70">Time / 1k Req</div>
                          <div className="text-lg font-bold">{impact.estTimeSavedPer1kRequestsMs !== null ? `${impact.estTimeSavedPer1kRequestsMs} ms` : '—'}</div>
                        </div>
                        <div className="col-span-2 md:col-span-4">
                          <div className="text-xs opacity-70">Suggestion Effectiveness</div>
                          <div className="text-base font-semibold">{impact.suggestionEffectivenessPct !== null ? `${impact.suggestionEffectivenessPct}% of affected metrics improved` : '—'}</div>
                        </div>
                      </div>
                      <p className="mt-3 text-[10px] leading-tight opacity-60">Estimates derived from metric deltas. Latency savings use primary response-time metric. Suggestion effectiveness is the share of changed metrics that improved. Treat as directional, validate in production.</p>
                    </div>
                  </div>
                );
              })()}

              {/* AI Insights (if enabled) */}
              {aiEnabled && (
                <ErrorBoundary fallback={<div className="alert alert-warning">AI insights unavailable</div>}>
                  <div className="animate-pop"><AIInsights insights={result.aiInsights || []} explanation={result.explanation} loading={aiLoading} /></div>
                </ErrorBoundary>
              )}

              {/* Charts */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Chart display error</div>}>
                <div className="card bg-base-100 shadow-lg p-4 animate-pop"><MetricDiffChart diffs={result.diffs} /></div>
              </ErrorBoundary>
              
              {/* Detailed Table */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Table display error</div>}>
                <div className="card bg-base-100 shadow-lg p-4 animate-pop"><DiffTable diffs={result.diffs} /></div>
              </ErrorBoundary>

              {/* Export Panel */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Export unavailable</div>}>
                <div className="animate-pop"><ExportPanel data={result} /></div>
              </ErrorBoundary>
              
              {/* Traditional Suggestions (fallback) */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Suggestions unavailable</div>}>
                <div className="animate-pop"><Suggestions tips={tips} /></div>
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
                <h3 className="font-bold">Ready to analyze performance!</h3>
                <div className="text-sm space-y-1">
                  <p>📁 Upload both reports or click "Load Sample" to try it out</p>
                  <p>🚀 After uploading both files, click "Start Analysis" to begin</p>
                  <p>🤖 Toggle AI Analysis in System Context for enhanced insights</p>
                  <p>📊 View historical reports to compare past analyses</p>
                </div>
              </div>
            </div>
          )}
          {/* About */}
          <section className="card bg-gradient-to-r from-cyan-200 via-blue-100 to-amber-100 shadow-lg rounded-xl animate-pop mt-8">
            <div className="card-body py-2 px-4">
              <h3 className="card-title text-sm font-bold text-blue-700">About</h3>
              <p className="text-xs text-blue-900 font-medium">SpotLag.AI: Instantly spot lag, fix bugs faster. AI-powered insights, simple results.</p>
              <ul className="mt-1 text-[11px] text-blue-900 leading-snug space-y-0.5 list-disc list-inside">
                <li>Nandan Jha – Lead, Test Suite & Overall Flow</li>
                <li>Satish Taji – Backend</li>
                <li>Rahul Saini – Frontend</li>
                <li>Shivendra Shukla – Frontend</li>
                <li>Shiva Allu – Documentation and Backend</li>
              </ul>
            </div>
          </section>
          {/* Disclaimer */}
          <section className="card bg-base-100 border border-warning/40 rounded-xl shadow-md animate-pop mt-4">
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
