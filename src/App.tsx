import React, { useMemo, useState, useCallback } from 'react';
import UploadPanel from './components/UploadPanel';
import DiffTable from './components/DiffTable';
import MetricDiffChart from './components/MetricDiffChart';

import AIInsights from './components/AIInsights';
import CodeLevelSuggestions from './components/CodeLevelSuggestions';
import SystemContextPanel from './components/SystemContextPanel';
import HistoricalReports from './components/HistoricalReports';
import ExportPanel from './components/ExportPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import EnhancedImpactSummary from './components/EnhancedImpactSummary';
import type { PerformanceReport, SystemContext, EnhancedComparisonResult } from './types';
import { compareReports, computeImpact } from './utils/compare';
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

  // Debounced AI analysis to prevent excessive API calls (updated - removed sourceCode parameter)
  const runAIAnalysis = useCallback(
    debounce(async (baseline: PerformanceReport, current: PerformanceReport, context: SystemContext) => {
      if (!aiEnabled) return;

      setAILoading(true);
      try {
        console.log('🤖 Starting AI Analysis...');
        console.log('📊 Analysis Context:', {
          selectedModel: context.selectedModel,
          aiEnabled,
          provider: getPreferredProvider(),
          codeReviewMode: context.enableCodeReview,
          testAppAutoLoad: context.enableCodeReview // Code will be auto-loaded by backend if enabled
        });
        
        // Note: sourceCode parameter removed - backend will auto-load test-app code when needed
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
                      {systemContext.enableCodeReview && aiEnabled && (
                        <span className="block mt-1 text-xs opacity-75">
                          🧪 Code Level Suggestions enabled - test-app code will be auto-loaded for AI analysis.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Start Analysis Button */}
              <div className="flex justify-center py-4">
                <button 
                  className={`btn btn-primary btn-lg gap-2 ${aiLoading ? 'loading' : ''}`}
                  onClick={() => {
                    console.log('🚀 Start Analysis clicked!', { baseline: !!baseline, current: !!current, aiEnabled, codeReview: systemContext.enableCodeReview });
                    if (baseline && current) {
                      if (aiEnabled) {
                        // Note: sourceCode parameter removed - backend will auto-load test-app code when needed
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
                    <p>Code Review: {systemContext.enableCodeReview ? '🧪 Auto-Loading' : '❌ Disabled'}</p>
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
                      aiEnabled ? (systemContext.enableCodeReview ? '🧪 AI+Code' : '🤖 AI') : '📊 Basic'
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Impact Summary */}
              <div className="animate-pop">
                <EnhancedImpactSummary impact={computeImpact(result)} />
              </div>

              {/* AI Insights (if enabled) */}
              {aiEnabled && (
                <ErrorBoundary fallback={<div className="alert alert-warning">AI insights unavailable</div>}>
                  <div className="animate-pop"><AIInsights insights={result.aiInsights || []} explanation={result.explanation} loading={aiLoading} /></div>
                </ErrorBoundary>
              )}

              {/* Code-Level Suggestions (only if code review enabled AND code data available) */}
              {aiEnabled && systemContext.enableCodeReview && result.aiInsights && 
               result.aiInsights.some(insight => 
                 (insight.code_recommendations && insight.code_recommendations.length > 0) ||
                 (insight.affected_files && insight.affected_files.length > 0)
               ) && (
                <ErrorBoundary fallback={<div className="alert alert-warning">Code suggestions unavailable</div>}>
                  <div className="animate-pop"><CodeLevelSuggestions insights={result.aiInsights || []} /></div>
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
                  <p>🧪 Enable "Code level suggestions" for test-app code analysis</p>
                  <p>📊 View historical reports to compare past analyses</p>
                </div>
              </div>
            </div>
          )}
          {/* Professional About & Disclaimer Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8 animate-pop">
            
            {/* About SpotLag.AI */}
            <div className="card bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 shadow-xl">
              <div className="card-body p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">SpotLag.AI</h3>
                    <p className="text-xs text-slate-600">Performance Intelligence Platform</p>
                  </div>
                </div>
                
                <p className="text-xs text-slate-700 leading-relaxed mb-3">
                  Advanced performance analysis platform powered by AI technology. 
                  Transform complex metrics into actionable insights for faster 
                  issue resolution and optimized system performance.
                </p>
                
                <div className="divider divider-neutral my-2"></div>
                
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Development Team</h4>
                  <div className="grid grid-cols-1 gap-1">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-xs font-medium text-slate-700">Nandan Jha</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Lead </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-xs font-medium text-slate-700">Satish Taji</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Architecture & Backend</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-xs font-medium text-slate-700">Rahul Saini</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Frontend Development</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-xs font-medium text-slate-700">Shivendra Shukla</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Frontend Development</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-xs font-medium text-slate-700">Shiva Allu</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Documentation & Backend</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer & Legal */}
            <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-xl">
              <div className="card-body p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">⚖️</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Important Notice</h3>
                    <p className="text-xs text-slate-600">Terms of Use & Disclaimer</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="alert alert-warning bg-amber-100 border-amber-300 py-2">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-700">⚠️</span>
                      <div>
                        <h4 className="font-semibold text-amber-800 text-xs">AI-Generated Content</h4>
                        <p className="text-[10px] text-amber-700 mt-0.5 leading-tight">
                          All insights are generated by artificial intelligence. Results may be 
                          incomplete, inaccurate, or require professional validation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-info bg-blue-100 border-blue-300 py-2">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-700">🔒</span>
                      <div>
                        <h4 className="font-semibold text-blue-800 text-xs">Data Privacy</h4>
                        <p className="text-[10px] text-blue-700 mt-0.5 leading-tight">
                          Ensure sensitive data is sanitized before upload. Use anonymized 
                          metrics and logs to protect confidential information.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-success bg-green-100 border-green-300 py-2">
                    <div className="flex items-start gap-2">
                      <span className="text-green-700">✅</span>
                      <div>
                        <h4 className="font-semibold text-green-800 text-xs">Best Practice</h4>
                        <p className="text-[10px] text-green-700 mt-0.5 leading-tight">
                          Cross-validate AI recommendations with domain expertise and 
                          test thoroughly in non-production environments.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divider divider-neutral my-2"></div>
                
                <div className="text-[10px] text-slate-600 text-center">
                  <p className="mb-0.5">© 2024 SpotLag.AI Performance Intelligence Platform</p>
                  <p>Built with advanced AI technology for enterprise performance optimization</p>
                </div>
              </div>
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