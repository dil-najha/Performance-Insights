import React, { useMemo, useState } from 'react';
import UploadPanel from './components/UploadPanel';
import DiffTable from './components/DiffTable';
import MetricDiffChart from './components/MetricDiffChart';
import Suggestions from './components/Suggestions';
import AIInsights from './components/AIInsights';
import SystemContextPanel from './components/SystemContextPanel';
import type { PerformanceReport, SystemContext } from './types';
import { compareReports, suggestionsFromDiffs } from './utils/compare';
import { simplifiedAI } from './utils/simplifiedAI';

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

  // Basic comparison (legacy)
  const basicResult = useMemo(() => {
    if (!baseline || !current) return null;
    return compareReports(baseline, current);
  }, [baseline, current]);

  // AI-enhanced comparison
  const [aiResult, setAIResult] = useState<any>(null);

  // Run AI analysis when data changes
  React.useEffect(() => {
    if (!baseline || !current || !aiEnabled) {
      setAIResult(null);
      return;
    }

    const runAIAnalysis = async () => {
      setAILoading(true);
      try {
        console.log('🤖 Starting AI Analysis...');
        console.log('Baseline:', baseline);
        console.log('Current:', current);
        console.log('AI Enabled:', aiEnabled);
        console.log('System Context:', systemContext);
        
        const result = await simplifiedAI.compareWithAI(baseline, current);
        
        console.log('🤖 AI Analysis Result:', result);
        console.log('AI Insights:', result.aiInsights);
        console.log('Explanation:', result.explanation);
        
        setAIResult(result);
      } catch (error) {
        console.error('❌ AI Analysis failed:', error);
        setAIResult(basicResult);
      } finally {
        setAILoading(false);
      }
    };

    runAIAnalysis();
  }, [baseline, current, systemContext, aiEnabled, basicResult]);

  // Use AI result if available, otherwise fall back to basic
  const result = aiResult || basicResult;
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
    } finally {
      setLoadingSample(false);
    }
  };

  const toggleAI = () => {
    setAIEnabled(!aiEnabled);
    if (!aiEnabled && baseline && current) {
      // Re-run analysis with AI enabled
      setAIResult(null);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="navbar bg-base-200 shadow">
        <div className="container mx-auto px-4">
          <div className="flex-1">
            <span className="text-xl font-bold">Performance Dashboard</span>
            <span className="ml-2 badge badge-primary badge-sm">AI-Powered</span>
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
              className={`btn btn-primary ${loadingSample ? 'loading' : ''}`} 
              onClick={loadSample} 
              disabled={loadingSample}
            >
              Load Sample
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* System Context Panel */}
        {aiEnabled && (
          <SystemContextPanel 
            context={systemContext} 
            onContextChange={setSystemContext}
          />
        )}

        {/* Upload Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UploadPanel label="Benchmark (Baseline)" onLoaded={setBaseline} />
          <UploadPanel label="Normal (Current)" onLoaded={setCurrent} />
        </div>

        {baseline && current && result && (
          <>
            {/* Summary Stats */}
            <div className="stats shadow bg-base-200">
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
              {aiEnabled && aiResult?.aiInsights && (
                <div className="stat">
                  <div className="stat-title">AI Insights</div>
                  <div className="stat-value text-info">{aiResult.aiInsights.length}</div>
                </div>
              )}
            </div>

            {/* AI Insights (if enabled) */}
            {aiEnabled && (
              <AIInsights 
                insights={aiResult?.aiInsights || []}
                explanation={aiResult?.explanation}
                loading={aiLoading}
              />
            )}

            {/* Charts */}
            <MetricDiffChart diffs={result.diffs} />
            
            {/* Detailed Table */}
            <DiffTable diffs={result.diffs} />
            
            {/* Traditional Suggestions (fallback) */}
            <Suggestions tips={tips} />
            
            {/* AI Predictions (if available) */}
            {aiEnabled && aiResult?.predictions && aiResult.predictions.length > 0 && (
              <div className="card bg-base-200 shadow">
                <div className="card-body">
                  <h3 className="card-title">🔮 Performance Predictions</h3>
                  <div className="space-y-2">
                    {aiResult.predictions.map((prediction: any, i: number) => (
                      <div key={i} className="alert alert-info">
                        <div>
                          <h4 className="font-bold">{prediction.title}</h4>
                          <p className="text-sm">{prediction.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {(!baseline || !current) && (
          <div className="alert">
            <span>Upload both reports or click "Load Sample" to try it out.</span>
            {aiEnabled && (
              <span className="text-sm opacity-70 ml-2">AI analysis will provide enhanced insights.</span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
