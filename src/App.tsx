import React, { useMemo, useState } from 'react';
import UploadPanel from './components/UploadPanel';
import DiffTable from './components/DiffTable';
import MetricDiffChart from './components/MetricDiffChart';
import Suggestions from './components/Suggestions';
import HistoricalReports from './components/HistoricalReports';
import ExportPanel from './components/ExportPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import AIInsights from './components/AIInsights';
import { deepAnalyze } from './utils/deepAI';
import type { PerformanceReport, EnhancedComparisonResult } from './types';
import { aiService } from './services/aiService';
import { compareReports, suggestionsFromDiffs, computeImpact, coerceReport } from './utils/compare';

export default function App() {
  const [baseline, setBaseline] = useState<PerformanceReport | null>(null);
  const [current, setCurrent] = useState<PerformanceReport | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [result, setResult] = useState<EnhancedComparisonResult | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean>(import.meta.env.VITE_ENABLE_AI === 'true');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string>('');
  const [showTopMetricsOnly, setShowTopMetricsOnly] = useState(true);
  const [baselineVersion, setBaselineVersion] = useState<string>('');
  const [baselineMode, setBaselineMode] = useState<'version' | 'upload'>('version');

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
    setResult(null);
  }, [baseline, current]);

  const tips = useMemo(() => result ? suggestionsFromDiffs(result.diffs) : [], [result]);
  const deepAI = useMemo(() => {
    // Use heuristic only if no AI insights present or AI disabled
    if (!result) return null;
    if (result.aiInsights && result.aiInsights.length > 0) return null;
    return deepAnalyze(result);
  }, [result]);

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

  const loadBaselineVersion = async (ver: string) => {
    try {
      if (!ver) return;
      const raw = await fetch(`/baselines/baseline-${ver}.json`).then(r => r.json());
      const coerced = coerceReport(raw, `Baseline ${ver}`);
      if (coerced) {
        setBaseline(coerced);
        setBaselineVersion(ver);
      } else {
        console.warn('Baseline version file did not parse into metrics', ver);
      }
    } catch (e) {
      console.error('Failed to load baseline version', ver, e);
    }
  };

  // AI toggle removed

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
  // Clear localStorage if any exists
    localStorage.removeItem('performanceBaseline');
    localStorage.removeItem('performanceCurrent');
    localStorage.removeItem('performanceResults');
    console.log('🗑️ All data cleared');
  };

  // Navbar scroll effect
  const [navScrolled, setNavScrolled] = useState(false);
  React.useEffect(()=>{
    const onScroll = () => setNavScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <div className="animated-bar h-1 w-full"></div>
  <div className={`navbar enhanced-navbar bg-base-200/70 ${navScrolled ? 'nav-scrolled' : ''}`}>
          <div className="container mx-auto px-6 md:px-8 py-3">
            <div className="flex-1 items-center gap-3 animate-fade-in-up">
              <div className="flex items-center gap-6">
    <img src="/shared%20image.jpg" alt="SpotLag.AI logo" className="h-12 w-auto rounded-md shadow hidden sm:block ring-1 ring-primary/20 animate-float logo-pulse" />
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-black tracking-tight text-gradient-animated">SpotLag.AI</span>
                  <span className="mt-1 text-[11px] sm:text-sm text-glow opacity-90">Spot the Lag, Squash the Bug</span>
                </div>
              </div>
              {lastAnalysisTime && (
                <span className="ml-2 text-xs opacity-60">Last analysis: {lastAnalysisTime}</span>
              )}
            </div>
            <div className="flex-none gap-4 md:gap-5 flex items-center">
              <div className="form-control hidden sm:block">
                <label className="label cursor-pointer gap-2">
                  <span className="label-text text-xs">AI</span>
                  <input type="checkbox" className="toggle toggle-primary toggle-xs" checked={aiEnabled} onChange={()=> setAiEnabled(v=>!v)} />
                </label>
              </div>
              <button 
                className="btn btn-outline btn-sm nav-cta transition-all duration-200 hover:-translate-y-0.5 mr-2" 
                onClick={() => setShowHistory(!showHistory)}
              >📊 History</button>
              <button 
                className={`btn btn-primary btn-sm nav-cta transition-all duration-200 hover:-translate-y-0.5 ${loadingSample ? 'loading' : ''}`} 
                onClick={loadSample} 
                disabled={loadingSample}
              >{!loadingSample && '📄'} Load Sample</button>
              {(baseline || current) && (
                <button className="btn btn-ghost btn-sm nav-cta transition-all duration-200 hover:-translate-y-0.5" onClick={clearData}>🗑️ Clear</button>
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

          {/* AI system context removed */}

          {/* Upload Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Baseline selection now via dropdown only */}
  <div className="card bg-base-100 shadow-md border border-primary/30 animate-pop">
          <div className="card-body py-3 px-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs tracking-wide">Benchmark (Baseline)</h3>
              {baseline && (
                <button className="btn btn-ghost btn-xs" onClick={()=>{setBaseline(null); setBaselineVersion('');}}>Clear</button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                className={`btn btn-xs flex-1 ${baselineMode==='version'?'btn-primary':'btn-outline'}`}
                onClick={()=>setBaselineMode('version')}
              >Versions</button>
              <button
                className={`btn btn-xs flex-1 ${baselineMode==='upload'?'btn-primary':'btn-outline'}`}
                onClick={()=>{setBaselineMode('upload'); setBaselineVersion('');}}
              >Upload</button>
            </div>
            {baselineMode === 'version' && (
              <div className="space-y-2">
                <select
                  className="select select-bordered select-xs w-full"
                  value={baselineVersion}
                  onChange={(e)=>{
                    const v = e.target.value; 
                    if (!v) { setBaseline(null); setBaselineVersion(''); return; }
                    loadBaselineVersion(v);
                  }}
                >
                  <option value="">-- choose baseline --</option>
                  <option value="v1">Baseline v1 (oldest)</option>
                  <option value="v2">Baseline v2 (mid)</option>
                  <option value="v3">Baseline v3 (recent)</option>
                </select>
                {!baseline && <p className="text-[10px] opacity-60 leading-snug">Pick a predefined version. Or switch to Upload for a custom JSON baseline.</p>}
                {baseline && (
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="badge badge-neutral badge-xs">Ver {baselineVersion || '—'}</span>
                    <span className="badge badge-info badge-xs">Metrics {Object.keys(baseline.metrics).length}</span>
                  </div>
                )}
              </div>
            )}
            {baselineMode === 'upload' && (
              <div className="mt-1">
                <div className="text-[10px] mb-1 opacity-70">Upload custom baseline JSON</div>
                <UploadPanel label="Custom Baseline" onLoaded={(r)=>{setBaseline(r); setBaselineVersion('');}} />
              </div>
            )}
          </div>
        </div>
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
                    <p className="text-sm">Both files are loaded. Click "Start Analysis" to run the comparison.</p>
                  </div>
                </div>
              )}

              {/* Start Analysis Button */}
              <div className="flex justify-center py-4">
                <button 
                  className={`btn btn-primary btn-lg gap-2 ${aiLoading ? 'loading' : ''}`}
                  onClick={async () => {
                    if (!baseline || !current) return;
                    setAiError(null);
                    setAiLoading(aiEnabled);
                    const base = compareReports(baseline, current);
                    let enhanced: EnhancedComparisonResult = { ...base } as EnhancedComparisonResult;
                    if (aiEnabled) {
                      try {
                        const res = await aiService.analyzePerformance(baseline, current, {});
                        enhanced = res;
                      } catch (e:any) {
                        console.error('AI analysis failed, falling back to heuristic', e);
                        setAiError('AI service unavailable, using heuristic insights.');
                        enhanced = { ...base } as EnhancedComparisonResult;
                      } finally {
                        setAiLoading(false);
                      }
                    }
                    setResult(enhanced);
                    setLastAnalysisTime(new Date().toLocaleString());
                  }}
                  disabled={!baseline || !current}
                >
                  {aiLoading ? '' : '🚀'} Start Analysis
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
                    <p>AI Enabled: {aiEnabled ? 'Yes' : 'No'}</p>
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
                {/* AI stats */}
                {result.aiInsights && result.aiInsights.length > 0 && (
                  <div className="stat">
                    <div className="stat-title">AI Insights</div>
                    <div className="stat-value text-info">{result.aiInsights.length}</div>
                  </div>
                )}
                {!result.aiInsights && deepAI && (
                  <div className="stat">
                    <div className="stat-title">Heuristic Insights</div>
                    <div className="stat-value text-info">{deepAI.aiInsights.length}</div>
                  </div>
                )}
              </div>

              {/* Impact Summary (numeric emphasis) */}
              {(() => {
                const impact = computeImpact(result);
                return (
                  <div className="card bg-base-100 shadow-lg border border-primary/30 animate-pop">
                    <div className="card-body py-4 px-5 space-y-4">
                      <div className="flex flex-wrap items-center gap-3 justify-between mb-1">
                        <h3 className="card-title text-sm">📈 Impact Summary</h3>
                        <div className="flex gap-2 items-center text-xs">
                          {impact.currentOverallBetter ? (
                            <span className="badge badge-success badge-sm">Current Better</span>
                          ) : (
                            <span className="badge badge-error badge-sm">Baseline Better</span>
                          )}
                          {impact.performanceScore !== null && (
                            <span className="badge badge-neutral badge-sm">Score {impact.performanceScore}</span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-[11px] opacity-70">Avg % Gain</div>
                          <div className="text-lg font-bold">{impact.avgPctImprovement !== null ? `${impact.avgPctImprovement}%` : '—'}</div>
                        </div>
                        <div>
                          <div className="text-[11px] opacity-70">Latency Saved</div>
                          <div className="text-lg font-bold">{impact.latencyImprovementMs !== null ? `${impact.latencyImprovementMs} ms` : '—'}</div>
                          {impact.latencyImprovementPct !== null && (
                            <div className="text-[10px] opacity-60">({impact.latencyImprovementPct}% faster)</div>
                          )}
                        </div>
                        <div>
                          <div className="text-[11px] opacity-70">Time / 1k Req</div>
                          <div className="text-lg font-bold">{impact.estTimeSavedPer1kRequestsMs !== null ? `${impact.estTimeSavedPer1kRequestsMs} ms` : '—'}</div>
                        </div>
                        <div>
                          <div className="text-[11px] opacity-70">Hours Saved / Day</div>
                          <div className="text-lg font-bold">{impact.estUserHoursSavedPerDay !== null ? impact.estUserHoursSavedPerDay : '—'}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-[11px] opacity-70">Throughput Δ</div>
                          <div className={`${impact.throughputChangePct && impact.throughputChangePct > 0 ? 'text-success' : impact.throughputChangePct && impact.throughputChangePct < 0 ? 'text-error' : ''} font-semibold`}>{impact.throughputChangePct !== null ? `${impact.throughputChangePct}%` : '—'}</div>
                        </div>
                        <div>
                          <div className="text-[11px] opacity-70">Error Rate Δ</div>
                          <div className={`${impact.errorRateChangePct && impact.errorRateChangePct > 0 ? 'text-success' : impact.errorRateChangePct && impact.errorRateChangePct < 0 ? 'text-error' : ''} font-semibold`}>{impact.errorRateChangePct !== null ? `${impact.errorRateChangePct}%` : '—'}</div>
                        </div>
                        <div>
                          <div className="text-[11px] opacity-70">CPU Δ</div>
                          <div className={`${impact.cpuChangePct && impact.cpuChangePct > 0 ? 'text-success' : impact.cpuChangePct && impact.cpuChangePct < 0 ? 'text-error' : ''} font-semibold`}>{impact.cpuChangePct !== null ? `${impact.cpuChangePct}%` : '—'}</div>
                        </div>
                        <div>
                          <div className="text-[11px] opacity-70">Memory Δ</div>
                          <div className={`${impact.memoryChangePct && impact.memoryChangePct > 0 ? 'text-success' : impact.memoryChangePct && impact.memoryChangePct < 0 ? 'text-error' : ''} font-semibold`}>{impact.memoryChangePct !== null ? `${impact.memoryChangePct}%` : '—'}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-[11px] opacity-70 mb-1">Top Improvements</div>
                          {impact.topImproved.length ? (
                            <ul className="text-xs space-y-1">
                              {impact.topImproved.map(m => (
                                <li key={m.label} className="flex justify-between"><span>{m.label}</span><span className="text-success font-semibold">+{m.pct}%</span></li>
                              ))}
                            </ul>
                          ) : <div className="text-xs opacity-50">None</div>}
                        </div>
                        <div>
                          <div className="text-[11px] opacity-70 mb-1">Top Regressions</div>
                          {impact.topRegressed.length ? (
                            <ul className="text-xs space-y-1">
                              {impact.topRegressed.map(m => (
                                <li key={m.label} className="flex justify-between"><span>{m.label}</span><span className="text-error font-semibold">{m.pct}%</span></li>
                              ))}
                            </ul>
                          ) : <div className="text-xs opacity-50">None</div>}
                        </div>
                      </div>
                      <div className="pt-1">
                        <div className="text-[11px] opacity-70">Suggestion Effectiveness</div>
                        <div className="text-sm font-semibold">{impact.suggestionEffectivenessPct !== null ? `${impact.suggestionEffectivenessPct}% of changed metrics improved` : '—'}</div>
                      </div>
                      <p className="mt-1 text-[10px] leading-tight opacity-60">Δ values are directionally normalized (positive = better). Hours saved assumes consistent throughput; validate in production. Performance score blends normalized percent improvements and regressions.</p>
                    </div>
                  </div>
                );
              })()}

              {/* Metric Differences Table moved just below Impact Summary */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Table display error</div>}>
                <div className="card bg-base-100 shadow-lg p-4 animate-pop space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Metric Differences</h3>
                    <div className="form-control">
                      <label className="label cursor-pointer gap-2">
                        <span className="label-text text-xs">Top 25 only</span>
                        <input type="checkbox" className="toggle toggle-primary toggle-xs" checked={showTopMetricsOnly} onChange={e=>setShowTopMetricsOnly(e.target.checked)} />
                      </label>
                    </div>
                  </div>
                  <DiffTable diffs={result.diffs} topOnly={showTopMetricsOnly} max={25} />
                  {showTopMetricsOnly && result.diffs.length > 25 && (
                    <p className="text-[10px] opacity-60">Showing top 25 important metrics (latency, errors, throughput, web vitals, resource). Toggle off to view all {result.diffs.length} metrics.</p>
                  )}
                </div>
              </ErrorBoundary>

              {/* AI or Heuristic Insights */}
              {aiError && (
                <div className="alert alert-warning animate-pop text-xs">{aiError}</div>
              )}
              {result.aiInsights && result.aiInsights.length > 0 && (
                <div className="animate-pop">
                  <AIInsights insights={result.aiInsights} explanation={result.explanation} />
                </div>
              )}
              {!result.aiInsights && deepAI && (
                <div className="animate-pop">
                  <AIInsights insights={deepAI.aiInsights} explanation={deepAI.explanation} />
                </div>
              )}
              {result.predictions && result.predictions.length > 0 && (
                <div className="card bg-base-200 shadow animate-pop">
                  <div className="card-body">
                    <h3 className="card-title">🔮 AI Trend Projections</h3>
                    <div className="space-y-2">
                      {result.predictions.map((p,i)=>(
                        <div key={i} className="alert alert-info">
                          <div>
                            <h4 className="font-bold">{p.title}</h4>
                            <p className="text-sm">{p.description}</p>
                            {p.actionable_steps && p.actionable_steps.length>0 && (
                              <ul className="text-xs mt-2 list-disc list-inside">
                                {p.actionable_steps.map((s,j)=>(<li key={j}>{s}</li>))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {!result.predictions && deepAI && deepAI.predictions.length > 0 && (
                <div className="card bg-base-200 shadow animate-pop">
                  <div className="card-body">
                    <h3 className="card-title">🔮 Heuristic Trend Projections</h3>
                    <div className="space-y-2">
                      {deepAI.predictions.map((p,i)=>(
                        <div key={i} className="alert alert-info">
                          <div>
                            <h4 className="font-bold">{p.title}</h4>
                            <p className="text-sm">{p.description}</p>
                            {p.actionable_steps.length>0 && (
                              <ul className="text-xs mt-2 list-disc list-inside">
                                {p.actionable_steps.map((s,j)=>(<li key={j}>{s}</li>))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Charts (now after table) */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Chart display error</div>}>
                <div className="card bg-base-100 shadow-lg p-4 animate-pop"><MetricDiffChart diffs={result.diffs} /></div>
              </ErrorBoundary>

              {/* Export Panel */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Export unavailable</div>}>
                <div className="animate-pop"><ExportPanel data={result} /></div>
              </ErrorBoundary>
              
              {/* Traditional Suggestions (fallback) */}
              <ErrorBoundary fallback={<div className="alert alert-warning">Suggestions unavailable</div>}>
                <div className="animate-pop"><Suggestions tips={tips} /></div>
              </ErrorBoundary>
              
            </>
          )}

          {(!baseline || !current) && (
            <div className="alert shadow rounded-xl animate-pop">
              <div>
                <h3 className="font-bold">Ready to analyze performance!</h3>
                <div className="text-sm space-y-1">
                  <p>📁 Upload both reports or click "Load Sample" to try it out</p>
                  <p>🚀 After uploading both files, click "Start Analysis" to begin</p>
                  {/* AI toggle removed */}
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

// Debounce removed with AI removal
