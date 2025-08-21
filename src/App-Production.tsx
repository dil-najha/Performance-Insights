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
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <div className="navbar bg-base-200 shadow">
          <div className="container mx-auto px-4">
            <div className="flex-1">
              <span className="text-xl font-bold">Performance Dashboard</span>
              <span className="ml-2 badge badge-primary badge-sm">AI-Powered</span>
              {lastAnalysisTime && (
                <span className="ml-2 text-xs opacity-60">
                  Last analysis: {lastAnalysisTime}
                </span>
              )}
            </div>
            <div className="flex-none gap-2">
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
                className="btn btn-outline btn-sm" 
                onClick={() => setShowHistory(!showHistory)}
              >
                📊 History
              </button>
              <button 
                className={`btn btn-primary btn-sm ${loadingSample ? 'loading' : ''}`} 
                onClick={loadSample} 
                disabled={loadingSample}
              >
                {!loadingSample && '📄'} Load Sample
              </button>
              {(baseline || current) && (
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={clearData}
                >
                  🗑️ Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 py-6 space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ErrorBoundary fallback={<div className="alert alert-error">Upload panel error</div>}>
              <UploadPanel label="Benchmark (Baseline)" onLoaded={setBaseline} />
            </ErrorBoundary>
            <ErrorBoundary fallback={<div className="alert alert-error">Upload panel error</div>}>
              <UploadPanel label="Normal (Current)" onLoaded={setCurrent} />
            </ErrorBoundary>
          </div>

          {baseline && current && result && (
            <>
              {/* Summary Stats */}
              <div className="stats shadow bg-base-200 w-full">
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
                  <AIInsights 
                    insights={result.aiInsights || []}
                    explanation={result.explanation}
                    loading={aiLoading}
                  />
                </ErrorBoundary>
              )}

              {/* Charts */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Chart display error</div>}>
                <MetricDiffChart diffs={result.diffs} />
              </ErrorBoundary>
              
              {/* Detailed Table */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Table display error</div>}>
                <DiffTable diffs={result.diffs} />
              </ErrorBoundary>

              {/* Export Panel */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Export unavailable</div>}>
                <ExportPanel data={result} />
              </ErrorBoundary>
              
              {/* Traditional Suggestions (fallback) */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Suggestions unavailable</div>}>
                <Suggestions tips={tips} />
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
            <div className="alert">
              <div>
                <h3 className="font-bold">Ready to analyze performance!</h3>
                <div className="text-sm space-y-1">
                  <p>📁 Upload both reports or click "Load Sample" to try it out</p>
                  {aiEnabled && (
                    <p>🤖 AI analysis will provide enhanced insights and predictions</p>
                  )}
                  <p>📊 View historical reports to compare past analyses</p>
                </div>
              </div>
            </div>
          )}
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
